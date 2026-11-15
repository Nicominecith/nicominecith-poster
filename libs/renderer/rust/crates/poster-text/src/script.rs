//! Everything the `scripts` feature adds. Without it, text is unshaped,
//! left to right, and every character is its own cluster.

/// One glyph as the shaper placed it, in output pixels.
#[derive(Debug, Clone, Copy)]
pub(crate) struct ShapedGlyph {
    pub(crate) id: u16,
    pub(crate) x_offset: f32,
    /// Upwards, as fonts measure.
    pub(crate) y_offset: f32,
    pub(crate) x_advance: f32,
    /// Whether the next glyph starts another cluster, where letter spacing goes.
    pub(crate) ends_cluster: bool,
}

#[derive(Debug)]
pub(crate) struct Shaped {
    pub(crate) glyphs: Vec<ShapedGlyph>,
    /// Joined scripts take no letter spacing inside a run.
    pub(crate) cursive: bool,
}

const WOFF2_SIGNATURE: &[u8] = b"wOF2";

#[cfg(feature = "scripts")]
mod enabled {
    use std::{cell::OnceCell, ops::Range};

    use rustybuzz::{script, Direction, Script, UnicodeBuffer};
    use unicode_bidi::{bidi_class, BidiClass, Level, ParagraphBidiInfo};
    use unicode_segmentation::UnicodeSegmentation;

    use super::{Shaped, ShapedGlyph, WOFF2_SIGNATURE};

    /// Script faces ship as WOFF2; poster families as plain sfnt.
    pub(crate) fn unpack(bytes: &[u8]) -> Option<Vec<u8>> {
        if bytes.starts_with(WOFF2_SIGNATURE) {
            wuff::decompress_woff2(bytes).ok()
        } else {
            Some(bytes.to_vec())
        }
    }

    /// A face's shaping tables, parsed on first use.
    pub(crate) struct Shaper {
        /// Leaked: faces live in the font cache for the worker's lifetime, and
        /// a `'static` slice lets the parsed face be kept beside it.
        sfnt: &'static [u8],
        face: OnceCell<Option<rustybuzz::Face<'static>>>,
    }

    impl Shaper {
        pub(crate) fn new(sfnt: Vec<u8>) -> Self {
            Self { sfnt: Box::leak(sfnt.into_boxed_slice()), face: OnceCell::new() }
        }

        fn face(&self) -> Option<&rustybuzz::Face<'static>> {
            self.face.get_or_init(|| rustybuzz::Face::from_slice(self.sfnt, 0)).as_ref()
        }
    }

    pub(crate) fn is_rtl(ch: char) -> bool {
        matches!(bidi_class(ch), BidiClass::R | BidiClass::AL)
    }

    /// Extended grapheme clusters with their byte offsets.
    pub(crate) fn clusters(text: &str) -> Vec<(usize, &str)> {
        text.grapheme_indices(true).collect()
    }

    /// Directional runs in visual order, on a left-to-right paragraph.
    pub(crate) fn directional_runs(text: &str) -> Vec<(Range<usize>, bool)> {
        let bidi = ParagraphBidiInfo::new(text, Some(Level::ltr()));
        let (levels, runs) = bidi.visual_runs(0..text.len());
        runs.into_iter().map(|range| (range.clone(), levels[range.start].is_rtl())).collect()
    }

    /// Scripts whose letters join, which CSS keeps letter spacing out of.
    const CURSIVE: [Script; 12] = [
        script::ARABIC,
        script::SYRIAC,
        script::MONGOLIAN,
        script::NKO,
        script::MANDAIC,
        script::MANICHAEAN,
        script::PSALTER_PAHLAVI,
        script::ADLAM,
        script::HANIFI_ROHINGYA,
        script::SOGDIAN,
        script::OLD_UYGHUR,
        script::PHAGS_PA,
    ];

    /// One same-face segment, shaped and in visual order. `None` when the
    /// face has no tables the shaper can read.
    pub(crate) fn shape(shaper: &Shaper, text: &str, size: f32, rtl: bool) -> Option<Shaped> {
        let face = shaper.face()?;
        let mut buffer = UnicodeBuffer::new();
        buffer.push_str(text);
        buffer.guess_segment_properties();
        buffer.set_direction(if rtl { Direction::RightToLeft } else { Direction::LeftToRight });
        let cursive = CURSIVE.contains(&buffer.script());
        let output = rustybuzz::shape(face, &[], buffer);
        let scale = size / face.units_per_em() as f32;
        let infos = output.glyph_infos();
        let glyphs = infos
            .iter()
            .zip(output.glyph_positions())
            .enumerate()
            .map(|(i, (info, position))| ShapedGlyph {
                id: info.glyph_id as u16,
                x_offset: position.x_offset as f32 * scale,
                y_offset: position.y_offset as f32 * scale,
                x_advance: position.x_advance as f32 * scale,
                ends_cluster: infos.get(i + 1).is_none_or(|next| next.cluster != info.cluster),
            })
            .collect();
        Some(Shaped { glyphs, cursive })
    }
}

#[cfg(not(feature = "scripts"))]
mod enabled {
    use std::ops::Range;

    use super::{Shaped, WOFF2_SIGNATURE};

    /// Without the feature, only plain sfnt faces can be read.
    pub(crate) fn unpack(bytes: &[u8]) -> Option<Vec<u8>> {
        (!bytes.starts_with(WOFF2_SIGNATURE)).then(|| bytes.to_vec())
    }

    pub(crate) struct Shaper;

    impl Shaper {
        pub(crate) fn new(_sfnt: Vec<u8>) -> Self {
            Self
        }
    }

    pub(crate) fn is_rtl(_ch: char) -> bool {
        false
    }

    pub(crate) fn clusters(text: &str) -> Vec<(usize, &str)> {
        text.char_indices().map(|(at, ch)| (at, &text[at..at + ch.len_utf8()])).collect()
    }

    pub(crate) fn directional_runs(text: &str) -> Vec<(Range<usize>, bool)> {
        vec![(0..text.len(), false)]
    }

    pub(crate) fn shape(_shaper: &Shaper, _text: &str, _size: f32, _rtl: bool) -> Option<Shaped> {
        None
    }
}

pub(crate) use enabled::{clusters, directional_runs, is_rtl, shape, unpack, Shaper};
