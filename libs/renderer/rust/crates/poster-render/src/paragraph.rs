use poster_canvas::Canvas;
use poster_text::{Align, Paragraph, Typesetter};

/// Draws `paragraph` top-down from `top`, anchored at `x`, and returns the
/// bottom it reaches.
pub(crate) fn draw_paragraph(
    canvas: &mut Canvas,
    font: &Typesetter,
    paragraph: &Paragraph,
    (x, top): (f32, f32),
    align: Align,
) -> f32 {
    let mut baseline = top + font.baseline(paragraph.line_height);
    for line in &paragraph.lines {
        font.draw(canvas, line, x, baseline, align);
        baseline += paragraph.line_height;
    }
    top + paragraph.height()
}

/// The x a line is anchored at to sit `align`ed in a column.
pub(crate) fn anchor(align: Align, x: f32, width: f32) -> f32 {
    match align {
        Align::Left => x,
        Align::Center => x + width / 2.0,
        Align::Right => x + width,
    }
}

/// Where a box `inner` wide starts to sit `align`ed in a column.
pub(crate) fn start(align: Align, x: f32, width: f32, inner: f32) -> f32 {
    match align {
        Align::Left => x,
        Align::Center => x + (width - inner) / 2.0,
        Align::Right => x + width - inner,
    }
}

/// A flex column's height: its items plus one gap between each pair.
pub(crate) fn stacked(heights: &[f32], gap: f32) -> f32 {
    heights.iter().sum::<f32>() + gap * (heights.len().max(1) as f32 - 1.0)
}
