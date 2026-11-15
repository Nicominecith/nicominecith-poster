use poster_canvas::Canvas;
use tiny_skia::Pixmap;

use crate::layout::Line;

/// How far above and below its baseline a line can reach, in ems; lines
/// entirely outside a band are skipped before any glyph is rasterized.
const ASCENT_REACH_EM: f32 = 2.0;
const DESCENT_REACH_EM: f32 = 1.0;

pub(crate) fn reaches(canvas: &Canvas, baseline: f32, size: f32) -> bool {
    let (top, bottom) = canvas.rows();
    baseline + size * DESCENT_REACH_EM >= top && baseline - size * ASCENT_REACH_EM <= bottom
}

/// Coverage scaled into premultiplied colour, as tiny-skia stores it.
fn tint(coverage: &[u8], [r, g, b]: [u8; 3], into: &mut [u8]) {
    let scale = |channel: u8, alpha: u8| ((u32::from(channel) * u32::from(alpha)) / 255) as u8;
    for (pixel, &alpha) in into.chunks_exact_mut(4).zip(coverage) {
        pixel.copy_from_slice(&[scale(r, alpha), scale(g, alpha), scale(b, alpha), alpha]);
    }
}

/// Rasterizes every glyph of `line` with its start at `x` and its baseline at
/// `baseline`, both in poster pixels.
pub(crate) fn draw(
    canvas: &mut Canvas,
    line: &Line,
    (x, baseline): (f32, f32),
    size: f32,
    rgb: [u8; 3],
) {
    for glyph in &line.glyphs {
        let (metrics, coverage) = glyph.face.raster.rasterize_indexed(glyph.id, size);
        let Some(mut image) = Pixmap::new(metrics.width as u32, metrics.height as u32) else {
            continue;
        };
        tint(&coverage, rgb, image.data_mut());
        let left = x + glyph.x + metrics.xmin as f32;
        let top = baseline - glyph.y - metrics.height as f32 - metrics.ymin as f32;
        canvas.draw(&image, left, top);
    }
}
