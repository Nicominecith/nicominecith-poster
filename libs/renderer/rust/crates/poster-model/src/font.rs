use serde::Deserialize;

use crate::Color;

/// One text run's typeface and the CSS properties that are not part of the
/// font file itself.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct FontSpec {
    /// Key into the request's `fonts`.
    pub asset: String,
    pub size: f32,
    /// Extra advance after each character, already `em * size`.
    #[serde(default)]
    pub letter_spacing: f32,
    #[serde(default)]
    pub uppercase: bool,
    pub color: Color,
    /// Faces to try, in order, for a character the asset has no glyph for.
    #[serde(default)]
    pub fallbacks: Vec<String>,
}

impl FontSpec {
    #[must_use]
    pub fn with_color(&self, color: Color) -> Self {
        Self { color, ..self.clone() }
    }
}
