use poster_canvas::Canvas;
use poster_text::{Paragraph, Typesetter};

use crate::{
    context::Context,
    paragraph::{anchor, draw_paragraph},
};

/// The title and subtitle, swapped for an eyebrow style, both following the
/// title alignment. Returns the bottom reached.
pub(crate) fn paint(
    canvas: &mut Canvas,
    context: &Context,
    (x, top, width): (f32, f32, f32),
) -> f32 {
    let Context { scene, fonts, metrics, arrangement } = context;
    let title = (Typesetter::new(fonts, &scene.title_font), &arrangement.title);
    let subtitle = (Typesetter::new(fonts, &scene.subtitle_font), &arrangement.subtitle);
    let order: [(Typesetter, &Paragraph); 2] =
        if scene.subtitle_first { [subtitle, title] } else { [title, subtitle] };
    let x = anchor(scene.title_align, x, width);
    let mut y = top;
    for (index, (font, paragraph)) in
        order.iter().filter(|(_, paragraph)| !paragraph.is_blank()).enumerate()
    {
        if index > 0 {
            y += metrics.title_gap;
        }
        y = draw_paragraph(canvas, font, paragraph, (x, y), scene.title_align);
    }
    y
}
