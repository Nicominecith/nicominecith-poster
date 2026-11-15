use serde::Deserialize;

use crate::{Color, FontSpec};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PaletteShape {
    /// One band across the content width.
    Bar,
    Block,
    Round,
    Circle,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TextAlign {
    #[default]
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CodeKind {
    Qr,
    Spotify,
}

/// Straight-alpha RGBA pixels the browser already decoded and resampled to
/// the box they print in, addressed inside the request's pixel arena.
#[derive(Debug, Clone, Copy, Deserialize)]
pub struct Bitmap {
    pub width: u32,
    pub height: u32,
    pub offset: u32,
}

impl Bitmap {
    #[must_use]
    pub fn aspect(&self) -> f32 {
        self.height as f32 / self.width.max(1) as f32
    }

    /// This bitmap's bytes, `None` when the arena is too short for them.
    #[must_use]
    pub fn pixels<'a>(&self, arena: &'a [u8]) -> Option<&'a [u8]> {
        let start = self.offset as usize;
        let len = (self.width * self.height * 4) as usize;
        arena.get(start..start + len)
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Image {
    pub bitmap: Bitmap,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CodeImage {
    pub kind: CodeKind,
    pub bitmap: Bitmap,
}

/// One row of the list under the title: a track, an actor, a chapter.
#[derive(Debug, Clone, Deserialize)]
pub struct Row {
    pub label: String,
    /// The right-hand column: a duration, a role, a page, a year.
    #[serde(rename = "duration")]
    pub detail: String,
    /// The bold face this row's label is set in when it is emphasized.
    #[serde(default)]
    pub emphasized_font: Option<FontSpec>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Credit {
    pub label: String,
    pub value: String,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(clippy::struct_excessive_bools, reason = "mirrors the switches the app sends")]
pub struct Theme {
    pub paper: Color,
    /// The colour around the frame; equals `paper` without a frame border.
    pub mat: Color,
    /// The frame border and the soundwave.
    pub ink: Color,
    pub frame_border: f32,
    pub palette_shape: PaletteShape,
    /// A bar's swatches divide the content width instead of keeping their own.
    pub palette_bar_stretch: bool,
    pub palette_top: f32,
    pub palette_width: f32,
    pub palette_height: f32,
    pub palette_gap: f32,
    pub backdrop: bool,
    pub backdrop_blur: f32,
    pub title_leading: f32,
}

/// Every measure in poster units; `Scene::scale` turns them into pixels.
#[derive(Debug, Clone, Deserialize)]
pub struct Layout {
    pub outer_pad: f32,
    pub inner_pad: f32,
    pub content_width: f32,
    #[serde(rename = "cover_size")]
    pub cover_width: f32,
    /// Left out for a square cover.
    #[serde(default)]
    pub cover_height: Option<f32>,
    pub cover_gap: f32,
    pub title_gap: f32,
    #[serde(rename = "side_column_width")]
    pub side_width: f32,
    pub qr_size: f32,
    pub side_gap: f32,
    #[serde(rename = "track_gap")]
    pub row_gap: f32,
    #[serde(rename = "track_column_gap")]
    pub column_gap: f32,
    pub content_gap: f32,
    #[serde(rename = "duration_gap")]
    pub detail_gap: f32,
}

impl Layout {
    #[must_use]
    pub fn cover_height(&self) -> f32 {
        self.cover_height.unwrap_or(self.cover_width)
    }
}

#[derive(Debug, Clone, Deserialize)]
#[allow(clippy::struct_excessive_bools, reason = "mirrors the switches the app sends")]
pub struct Scene {
    pub width: u32,
    pub height: u32,
    /// Output pixels per poster unit.
    pub scale: f32,

    pub theme: Theme,
    pub layout: Layout,

    pub title: String,
    pub title_font: FontSpec,
    #[serde(rename = "artist")]
    pub subtitle: String,
    #[serde(rename = "artist_font")]
    pub subtitle_font: FontSpec,
    /// Whether the subtitle prints above the title, as an eyebrow.
    #[serde(rename = "eyebrow_first")]
    pub subtitle_first: bool,
    /// Followed by the title, the subtitle and the palette.
    #[serde(default)]
    pub title_align: TextAlign,

    pub cover: Option<Image>,
    pub backdrop: Option<Image>,
    /// Printed on the cover of social posts; none prints no plate.
    #[serde(default)]
    pub brand: Option<String>,

    pub show_palette: bool,
    pub palette: Vec<Color>,
    /// Numbers the swatches when set.
    #[serde(default)]
    pub palette_index_font: Option<FontSpec>,

    pub columns: Vec<Vec<Row>>,
    #[serde(rename = "track_font")]
    pub row_font: FontSpec,
    #[serde(rename = "duration_color")]
    pub detail_color: Color,

    pub credits: Vec<Credit>,
    pub credit_label_font: FontSpec,
    pub credit_value_font: FontSpec,
    pub show_soundwave: bool,

    pub code: Option<CodeImage>,
}

impl Scene {
    #[must_use]
    pub fn has_palette(&self) -> bool {
        self.show_palette && !self.palette.is_empty()
    }
}
