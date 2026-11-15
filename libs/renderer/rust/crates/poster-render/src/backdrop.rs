//! The blurred cover behind backdrop styles: blurred, darkened and covered by
//! a scrim, in the order a browser composites the CSS filters.

use poster_canvas::{box_blur, pixmap_from_rgba, Pixmap};
use poster_model::{Bitmap, Scene};

/// CSS `brightness()`.
const BRIGHTNESS: f32 = 0.75;

/// The scrim: black at 5% at the top, 25% at 45% of the height, 93% at the
/// bottom.
const SCRIM_TOP: f32 = 0.05;
const SCRIM_MIDDLE: f32 = 0.25;
const SCRIM_MIDDLE_AT: f32 = 0.45;
const SCRIM_BOTTOM: f32 = 0.93;

pub(crate) fn prepare(scene: &Scene, bitmap: &Bitmap, arena: &[u8]) -> Option<Pixmap> {
    let mut layer = pixmap_from_rgba(bitmap.width, bitmap.height, bitmap.pixels(arena)?)?;
    // The layer is smaller than the poster; its blur shrinks with it.
    let ratio = layer.width() as f32 / (scene.width as f32).max(1.0);
    let radius = scene.theme.backdrop_blur * scene.scale * ratio;
    box_blur(&mut layer, radius.round().max(0.0) as u32);
    darken(&mut layer);
    apply_scrim(&mut layer);
    Some(layer)
}

fn darken(layer: &mut Pixmap) {
    for pixel in layer.data_mut().chunks_exact_mut(4) {
        for channel in &mut pixel[..3] {
            *channel = (f32::from(*channel) * BRIGHTNESS).round().clamp(0.0, 255.0) as u8;
        }
    }
}

fn scrim_opacity(t: f32) -> f32 {
    if t <= SCRIM_MIDDLE_AT {
        SCRIM_TOP + (SCRIM_MIDDLE - SCRIM_TOP) * (t / SCRIM_MIDDLE_AT)
    } else {
        SCRIM_MIDDLE
            + (SCRIM_BOTTOM - SCRIM_MIDDLE) * ((t - SCRIM_MIDDLE_AT) / (1.0 - SCRIM_MIDDLE_AT))
    }
}

/// The scrim only varies down the page, so each row is one multiply.
fn apply_scrim(layer: &mut Pixmap) {
    let width = layer.width() as usize;
    let height = layer.height() as usize;
    let last_row = height.saturating_sub(1).max(1) as f32;
    for (y, row) in layer.data_mut().chunks_exact_mut(width * 4).enumerate() {
        let keep = 1.0 - scrim_opacity(y as f32 / last_row);
        for pixel in row.chunks_exact_mut(4) {
            for channel in &mut pixel[..3] {
                *channel = (f32::from(*channel) * keep) as u8;
            }
        }
    }
}
