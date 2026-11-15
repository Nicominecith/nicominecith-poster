//! The brand plate on the cover's bottom-right corner of social posts.

use poster_canvas::{Area, Canvas};
use poster_model::{Color, FontSpec};
use poster_text::{Align, FontLibrary, Typesetter};

/// In poster units.
const INSET: f32 = 14.0;
const PADDING_Y: f32 = 6.0;
const FONT_SIZE: f32 = 15.0;
const TRACKING_EM: f32 = 0.08;
/// Where the baseline sits below the text's top, in ems.
const BASELINE_EM: f32 = 0.82;
const INK: Color = Color::rgba(245, 242, 234, 1.0);
const PLATE: Color = Color::rgba(12, 11, 8, 0.65);

/// Set in `asset`, the poster's credit label family.
pub(crate) fn paint(
    canvas: &mut Canvas,
    fonts: &FontLibrary,
    asset: &str,
    label: &str,
    cover: Area,
    scale: f32,
) {
    let size = FONT_SIZE * scale;
    let spec = FontSpec {
        asset: asset.to_owned(),
        size,
        letter_spacing: size * TRACKING_EM,
        uppercase: false,
        color: INK,
        fallbacks: Vec::new(),
    };
    let font = Typesetter::new(fonts, &spec);
    if !font.is_available() {
        return;
    }
    let inset = INSET * scale;
    let padding_y = PADDING_Y * scale;
    let text_width: f32 = label.chars().map(|ch| font.advance(ch) + spec.letter_spacing).sum();
    let width = text_width + inset;
    let height = size + padding_y * 2.0;
    let plate = Area::new(
        cover.x + cover.width - inset - width,
        cover.y + cover.height - inset - height,
        width,
        height,
    );
    canvas.fill(plate, PLATE.to_skia());
    let baseline = plate.y + padding_y + size * BASELINE_EM;
    font.draw(canvas, label, plate.x + plate.width / 2.0, baseline, Align::Center);
}
