use poster_canvas::Canvas;
use poster_model::FontSpec;

use crate::{
    chain::FontChain,
    glyphs,
    layout::{lay_out, Setting},
    wrap, Align, FontLibrary, Paragraph,
};

/// Where the baseline sits in a line box when the face states no metrics.
const DEFAULT_ASCENT_EM: f32 = 0.8;

/// One text run's face, size and colour, ready to measure, wrap and draw.
/// A run whose asset is missing measures as empty and draws nothing.
pub struct Typesetter<'a> {
    spec: &'a FontSpec,
    chain: Option<FontChain<'a>>,
    tabular: bool,
}

impl<'a> Typesetter<'a> {
    #[must_use]
    pub fn new(fonts: &'a FontLibrary, spec: &'a FontSpec) -> Self {
        Self { spec, chain: FontChain::resolve(fonts, spec), tabular: false }
    }

    /// Sets digits on one common width, as `font-variant-numeric: tabular-nums`.
    #[must_use]
    pub fn tabular(self) -> Self {
        Self { tabular: true, ..self }
    }

    #[must_use]
    pub fn is_available(&self) -> bool {
        self.chain.is_some()
    }

    #[must_use]
    pub fn size(&self) -> f32 {
        self.spec.size
    }

    /// Wraps `text` into lines at most `max_width` wide.
    #[must_use]
    pub fn wrap(&self, text: &str, max_width: f32, leading: f32) -> Paragraph {
        let text = self.transformed(text);
        let lines = self
            .chain
            .as_ref()
            .map(|chain| wrap::wrap(chain, &text, self.setting(chain), max_width))
            .unwrap_or_default();
        Paragraph { lines, line_height: self.spec.size * leading }
    }

    /// The first baseline's distance below the top of a line box, with the
    /// leftover line height split evenly above and below, as CSS does.
    #[must_use]
    pub fn baseline(&self, line_height: f32) -> f32 {
        let size = self.spec.size;
        let metrics =
            self.chain.as_ref().map(|chain| chain.own.raster.horizontal_line_metrics(size));
        match metrics {
            Some(Some(metrics)) => {
                let content = metrics.ascent - metrics.descent;
                (line_height - content) / 2.0 + metrics.ascent
            }
            _ => size * DEFAULT_ASCENT_EM,
        }
    }

    /// The width `count` tabular digits take.
    #[must_use]
    pub fn digits_width(&self, count: usize) -> f32 {
        self.chain.as_ref().map_or(0.0, |chain| chain.digit_advance(self.spec.size) * count as f32)
    }

    /// One character's advance, fallbacks included.
    #[must_use]
    pub fn advance(&self, ch: char) -> f32 {
        self.chain.as_ref().map_or(0.0, |chain| chain.face_for_char(ch).advance(ch, self.spec.size))
    }

    /// Draws one line anchored at `x` by `align`, its baseline at `baseline`
    /// in poster pixels, and returns its width.
    pub fn draw(
        &self,
        canvas: &mut Canvas,
        text: &str,
        x: f32,
        baseline: f32,
        align: Align,
    ) -> f32 {
        let Some(chain) = &self.chain else { return 0.0 };
        let line = lay_out(chain, &self.transformed(text), self.setting(chain));
        let start = match align {
            Align::Left => x,
            Align::Right => x - line.width,
            Align::Center => x - line.width / 2.0,
        };
        if glyphs::reaches(canvas, baseline, self.spec.size) {
            let rgb = [self.spec.color.r, self.spec.color.g, self.spec.color.b];
            glyphs::draw(canvas, &line, (start, baseline), self.spec.size, rgb);
        }
        line.width
    }

    fn setting(&self, chain: &FontChain) -> Setting {
        Setting {
            size: self.spec.size,
            letter_spacing: self.spec.letter_spacing,
            tabular_advance: if self.tabular { chain.digit_advance(self.spec.size) } else { 0.0 },
        }
    }

    /// `text-transform: uppercase`, with Unicode's full mapping (ß to SS).
    fn transformed(&self, text: &str) -> String {
        if self.spec.uppercase {
            text.to_uppercase()
        } else {
            text.to_owned()
        }
    }
}

impl std::fmt::Debug for Typesetter<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Typesetter")
            .field("asset", &self.spec.asset)
            .field("available", &self.is_available())
            .field("tabular", &self.tabular)
            .finish()
    }
}
