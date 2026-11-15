use serde::Deserialize;

/// A colour as the app resolves it: 8-bit channels and a `0..=1` alpha.
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: f32,
}

impl Color {
    pub const BLACK: Self = Self::rgba(0, 0, 0, 1.0);

    #[must_use]
    pub const fn rgba(r: u8, g: u8, b: u8, a: f32) -> Self {
        Self { r, g, b, a }
    }

    #[must_use]
    pub fn to_skia(self) -> tiny_skia::Color {
        let unit = |channel: u8| f32::from(channel) / 255.0;
        tiny_skia::Color::from_rgba(unit(self.r), unit(self.g), unit(self.b), self.a)
            .unwrap_or(tiny_skia::Color::BLACK)
    }
}
