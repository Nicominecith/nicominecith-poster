use poster_canvas::{Area, Canvas, Path, PathBuilder};
use poster_model::PaletteShape;
use poster_text::{Align, Typesetter};

use crate::{context::Context, paragraph::start, BODY_LEADING};

/// How much of a rounded swatch's short side its corners take: clearly
/// rounded, short of the half that would make it a circle.
const CORNER_RATIO: f32 = 0.35;

/// The swatch row, aligned with the title, each swatch optionally numbered
/// underneath.
pub(crate) fn paint(canvas: &mut Canvas, context: &Context, (x, top, width): (f32, f32, f32)) {
    let Context { scene, fonts, metrics, .. } = context;
    let count = scene.palette.len().max(1) as f32;
    let shape = scene.theme.palette_shape;
    let height = metrics.palette_height;
    // A stretched bar divides the whole width between touching swatches.
    let stretched = shape == PaletteShape::Bar && scene.theme.palette_bar_stretch;
    let (each, gap) =
        if stretched { (width / count, 0.0) } else { (metrics.palette_width, metrics.palette_gap) };
    let row_width = if stretched { width } else { each * count + gap * (count - 1.0) };
    let left = start(scene.title_align, x, width, row_width);
    let index_font = scene.palette_index_font.as_ref().map(|spec| Typesetter::new(fonts, spec));

    for (index, color) in scene.palette.iter().enumerate() {
        let swatch = Area::new(left + (each + gap) * index as f32, top, each, height);
        if shape == PaletteShape::Bar {
            canvas.fill(swatch, color.to_skia());
        } else {
            canvas.fill_path(&swatch_path(shape, swatch), color.to_skia());
        }
        if let Some(font) = &index_font {
            let line_top = top + height + metrics.palette_index_gap;
            let line_height = font.size() * BODY_LEADING;
            let baseline = line_top + font.baseline(line_height);
            let label = (index + 1).to_string();
            font.draw(canvas, &label, swatch.x + each / 2.0, baseline, Align::Center);
        }
    }
}

fn swatch_path(shape: PaletteShape, area: Area) -> Path {
    let Area { x, y, width: w, height: h } = area;
    let mut path = PathBuilder::new();
    match shape {
        PaletteShape::Circle => path.push_circle(x + w / 2.0, y + h / 2.0, w.min(h) / 2.0),
        PaletteShape::Round => {
            // Quadratic corners: at swatch size the difference from an arc is
            // under half a pixel.
            let r = w.min(h) * CORNER_RATIO;
            path.move_to(x + r, y);
            path.line_to(x + w - r, y);
            path.quad_to(x + w, y, x + w, y + r);
            path.line_to(x + w, y + h - r);
            path.quad_to(x + w, y + h, x + w - r, y + h);
            path.line_to(x + r, y + h);
            path.quad_to(x, y + h, x, y + h - r);
            path.line_to(x, y + r);
            path.quad_to(x, y, x + r, y);
            path.close();
        }
        PaletteShape::Bar | PaletteShape::Block => {
            if let Some(rect) = poster_canvas::Rect::from_xywh(x, y, w, h) {
                path.push_rect(rect);
            }
        }
    }
    path.finish().unwrap_or_else(empty_path)
}

fn empty_path() -> Path {
    let mut path = PathBuilder::new();
    path.close();
    path.finish().expect("a closed empty path")
}
