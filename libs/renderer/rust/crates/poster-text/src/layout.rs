use std::ptr;

use crate::{
    chain::FontChain,
    face::Face,
    script::{self, clusters, directional_runs},
};

/// How one line is set: size, tracking, and the digit width tabular figures
/// take (`0` for proportional figures).
#[derive(Debug, Clone, Copy)]
pub(crate) struct Setting {
    pub(crate) size: f32,
    pub(crate) letter_spacing: f32,
    pub(crate) tabular_advance: f32,
}

/// A glyph placed relative to the line's start and baseline.
pub(crate) struct Glyph<'a> {
    pub(crate) face: &'a Face,
    pub(crate) id: u16,
    pub(crate) x: f32,
    /// Upwards, as fonts measure.
    pub(crate) y: f32,
}

pub(crate) struct Line<'a> {
    pub(crate) glyphs: Vec<Glyph<'a>>,
    pub(crate) width: f32,
}

/// Places glyphs left to right. Letter spacing follows every character or
/// cluster and is taken back after the last, as in CSS.
struct Pen<'a> {
    glyphs: Vec<Glyph<'a>>,
    x: f32,
    spaced: usize,
    setting: Setting,
}

impl<'a> Pen<'a> {
    fn new(setting: Setting) -> Self {
        Self { glyphs: Vec::new(), x: 0.0, spaced: 0, setting }
    }

    fn place(&mut self, face: &'a Face, id: u16, dx: f32, dy: f32) {
        self.glyphs.push(Glyph { face, id, x: self.x + dx, y: dy });
    }

    fn space(&mut self) {
        self.x += self.setting.letter_spacing;
        self.spaced += 1;
    }

    /// Character by character at their own advances, no kerning.
    fn characters(&mut self, face: &'a Face, text: &str, tabular: bool) {
        let Setting { size, tabular_advance, .. } = self.setting;
        for ch in text.chars() {
            let id = face.raster.lookup_glyph_index(ch);
            let advance = if tabular && tabular_advance > 0.0 && ch.is_ascii_digit() {
                tabular_advance
            } else {
                face.raster.metrics_indexed(id, size).advance_width
            };
            self.place(face, id, 0.0, 0.0);
            self.x += advance;
            self.space();
        }
    }

    /// Through the shaper when it can read the face, else character by character.
    fn shaped(&mut self, face: &'a Face, text: &str, rtl: bool) {
        let Some(shaped) = script::shape(&face.shaper, text, self.setting.size, rtl) else {
            self.characters(face, text, false);
            return;
        };
        let last = shaped.glyphs.len().saturating_sub(1);
        for (i, glyph) in shaped.glyphs.into_iter().enumerate() {
            self.place(face, glyph.id, glyph.x_offset, glyph.y_offset);
            self.x += glyph.x_advance;
            if i == last || (glyph.ends_cluster && !shaped.cursive) {
                self.space();
            }
        }
    }

    fn finish(mut self) -> Line<'a> {
        if self.spaced > 0 {
            self.x -= self.setting.letter_spacing;
        }
        Line { glyphs: self.glyphs, width: self.x }
    }
}

/// Splits one directional run into same-face segments, in logical order.
fn segments<'a, 't>(chain: &FontChain<'a>, text: &'t str) -> Vec<(&'t str, &'a Face)> {
    let mut spans: Vec<(usize, usize, &'a Face)> = Vec::new();
    let mut previous = None;
    for (start, cluster) in clusters(text) {
        let face = chain.face_for_cluster(cluster, previous);
        let end = start + cluster.len();
        match spans.last_mut() {
            Some(span) if ptr::eq(span.2, face) => span.1 = end,
            _ => spans.push((start, end, face)),
        }
        previous = Some(face);
    }
    spans.into_iter().map(|(start, end, face)| (&text[start..end], face)).collect()
}

/// Lays out one line in visual order. Left-to-right text the run's own face
/// covers is set character by character; everything else is split into bidi
/// runs and same-face segments, and fallback or right-to-left segments are
/// shaped.
pub(crate) fn lay_out<'a>(chain: &FontChain<'a>, text: &str, setting: Setting) -> Line<'a> {
    let mut pen = Pen::new(setting);
    if text.chars().all(|ch| chain.own.has(ch) && !script::is_rtl(ch)) {
        pen.characters(chain.own, text, true);
        return pen.finish();
    }
    for (range, rtl) in directional_runs(text) {
        let mut runs = segments(chain, &text[range]);
        if rtl {
            runs.reverse();
        }
        for (segment, face) in runs {
            if chain.is_own(face) && !rtl {
                pen.characters(face, segment, true);
            } else {
                pen.shaped(face, segment, rtl);
            }
        }
    }
    pen.finish()
}

pub(crate) fn width(chain: &FontChain, text: &str, setting: Setting) -> f32 {
    lay_out(chain, text, setting).width
}
