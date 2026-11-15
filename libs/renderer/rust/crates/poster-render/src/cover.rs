use poster_canvas::{Area, Canvas, Pixmap, Shadow};
use poster_model::Color;

use crate::{brand, context::Context};

/// One CSS `cqw`: a hundredth of the poster's width.
const CQW: f32 = 0.01;

/// `box-shadow: 0 2cqw 6cqw rgb(0 0 0 / 0.55)` under a backdrop style's cover.
const SHADOW_OFFSET_CQW: f32 = 2.0;
const SHADOW_BLUR_CQW: f32 = 6.0;
const SHADOW_COLOR: Color = Color::rgba(0, 0, 0, 0.55);

/// The cover image (or the mat colour without one), its shadow under it and
/// the brand plate on it.
pub(crate) fn paint(canvas: &mut Canvas, context: &Context, area: Area, image: Option<&Pixmap>) {
    let Context { scene, fonts, .. } = context;
    let has_width = area.width > 0.0;
    if scene.theme.backdrop && has_width {
        let width = scene.width as f32;
        let shadow = Shadow {
            offset_y: SHADOW_OFFSET_CQW * CQW * width,
            blur: SHADOW_BLUR_CQW * CQW * width,
            color: SHADOW_COLOR.to_skia(),
        };
        canvas.draw_shadow(area, &shadow);
    }
    match image {
        Some(image) => canvas.draw_scaled(image, area),
        None => canvas.fill(area, scene.theme.mat.to_skia()),
    }
    let label = scene.brand.as_deref().filter(|label| !label.is_empty());
    if let (Some(label), true) = (label, has_width) {
        brand::paint(canvas, fonts, &scene.credit_label_font.asset, label, area, scene.scale);
    }
}
