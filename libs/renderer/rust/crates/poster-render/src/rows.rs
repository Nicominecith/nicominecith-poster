use poster_canvas::Canvas;
use poster_text::{Align, Typesetter};

use crate::context::Context;

/// The columns of rows: each label wrapped at the left, its detail on the
/// right of its first line. Digits are tabular throughout, so numbered rows
/// and durations line up.
pub(crate) fn paint(canvas: &mut Canvas, context: &Context, (x, top): (f32, f32)) {
    let Context { scene, fonts, metrics, arrangement } = context;
    let width = arrangement.column_width;
    let row_font = Typesetter::new(fonts, &scene.row_font).tabular();
    let detail_spec = scene.row_font.with_color(scene.detail_color);
    let detail_font = Typesetter::new(fonts, &detail_spec).tabular();

    let mut column_x = x;
    for (column, paragraphs) in scene.columns.iter().zip(&arrangement.columns) {
        let mut y = top;
        for (index, (row, label)) in column.iter().zip(paragraphs).enumerate() {
            let emphasized =
                row.emphasized_font.as_ref().map(|spec| Typesetter::new(fonts, spec).tabular());
            let label_font = emphasized.as_ref().unwrap_or(&row_font);
            let mut baseline = y + label_font.baseline(label.line_height);
            for line in &label.lines {
                label_font.draw(canvas, line, column_x, baseline, Align::Left);
                baseline += label.line_height;
            }
            if !row.detail.is_empty() {
                let baseline = y + row_font.baseline(label.line_height);
                detail_font.draw(canvas, &row.detail, column_x + width, baseline, Align::Right);
            }
            y += label.height();
            if index + 1 < column.len() {
                y += metrics.row_gap;
            }
        }
        column_x += width + metrics.column_gap;
    }
}
