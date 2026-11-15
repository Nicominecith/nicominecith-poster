use crate::script::{self, Shaper};

/// One font file: `fontdue` rasterizes it and, with `scripts`, `rustybuzz`
/// shapes into it.
pub(crate) struct Face {
    pub(crate) raster: fontdue::Font,
    pub(crate) shaper: Shaper,
}

impl Face {
    pub(crate) fn parse(bytes: &[u8]) -> Option<Self> {
        let sfnt = script::unpack(bytes)?;
        let raster =
            fontdue::Font::from_bytes(sfnt.as_slice(), fontdue::FontSettings::default()).ok()?;
        Some(Self { raster, shaper: Shaper::new(sfnt) })
    }

    pub(crate) fn has(&self, ch: char) -> bool {
        self.raster.lookup_glyph_index(ch) != 0
    }

    /// Whether this face can set a whole grapheme cluster.
    pub(crate) fn covers(&self, cluster: &str) -> bool {
        cluster.chars().all(|ch| is_ignorable(ch) || self.has(ch))
    }

    pub(crate) fn advance(&self, ch: char, size: f32) -> f32 {
        self.raster.metrics(ch, size).advance_width
    }
}

/// Default-ignorable code points: joiners, variation selectors, bidi controls
/// and tags, which the shaper consumes and no face has to draw.
const IGNORABLE: [(u32, u32); 16] = [
    (0x00AD, 0x00AD),
    (0x034F, 0x034F),
    (0x061C, 0x061C),
    (0x115F, 0x1160),
    (0x17B4, 0x17B5),
    (0x180B, 0x180F),
    (0x200B, 0x200F),
    (0x202A, 0x202E),
    (0x2060, 0x206F),
    (0x3164, 0x3164),
    (0xFE00, 0xFE0F),
    (0xFEFF, 0xFEFF),
    (0xFFA0, 0xFFA0),
    (0x1_BCA0, 0x1_BCA3),
    (0x1_D173, 0x1_D17A),
    (0xE_0000, 0xE_0FFF),
];

pub(crate) fn is_ignorable(ch: char) -> bool {
    let code = u32::from(ch);
    IGNORABLE.iter().any(|&(first, last)| (first..=last).contains(&code))
}
