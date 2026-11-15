//! The column beside the rows: a soundwave, the scannable code and the
//! credits, stacked with one gap between each. Measuring and painting walk
//! the same items, so the measured height is the painted one.

use poster_canvas::{Area, Canvas, Pixmap};
use poster_model::{CodeKind, Scene};
use poster_text::{Align, FontLibrary, Paragraph, Typesetter};

use crate::{
    metrics::Metrics,
    paragraph::{draw_paragraph, stacked},
    BODY_LEADING,
};

/// One block of the side column, painted into `area`, which is the column's
/// width and this item's own height.
trait SideItem {
    fn height(&self) -> f32;
    fn paint(&self, canvas: &mut Canvas, area: Area);
}

/// Five bars of a stylised soundwave, centred vertically, right-aligned.
struct Soundwave {
    scale: f32,
    ink: poster_canvas::Color,
}

impl Soundwave {
    const HEIGHT: f32 = 30.0;
    const BAR_WIDTH: f32 = 5.0;
    const BAR_GAP: f32 = 4.0;
    /// Each bar's height as a share of the wave's.
    const BARS: [f32; 5] = [0.45, 0.75, 1.0, 0.6, 0.35];
}

impl SideItem for Soundwave {
    fn height(&self) -> f32 {
        Self::HEIGHT * self.scale
    }

    fn paint(&self, canvas: &mut Canvas, area: Area) {
        let bar_width = Self::BAR_WIDTH * self.scale;
        let bar_gap = Self::BAR_GAP * self.scale;
        let height = self.height();
        let bars = Self::BARS.len() as f32;
        let total = bar_width * bars + bar_gap * (bars - 1.0);
        let mut x = area.right() - total;
        for share in Self::BARS {
            let top = area.y + height * (1.0 - share) / 2.0;
            canvas.fill(Area::new(x, top, bar_width, height * share), self.ink);
            x += bar_width + bar_gap;
        }
    }
}

/// A QR code at its own size, or a Spotify code across the column.
struct Code<'a> {
    width: f32,
    aspect: f32,
    image: Option<&'a Pixmap>,
}

impl SideItem for Code<'_> {
    fn height(&self) -> f32 {
        self.width * self.aspect
    }

    fn paint(&self, canvas: &mut Canvas, area: Area) {
        if let Some(image) = self.image {
            let placed = Area::new(area.right() - self.width, area.y, self.width, self.height());
            canvas.draw_scaled(image, placed);
        }
    }
}

/// A label over its value, both right-aligned and wrapped to the column.
struct Credit<'a> {
    label: Paragraph,
    value: Paragraph,
    label_font: Typesetter<'a>,
    value_font: Typesetter<'a>,
}

impl SideItem for Credit<'_> {
    fn height(&self) -> f32 {
        self.label.height() + self.value.height()
    }

    fn paint(&self, canvas: &mut Canvas, area: Area) {
        let right = area.right();
        let value_top =
            draw_paragraph(canvas, &self.label_font, &self.label, (right, area.y), Align::Right);
        draw_paragraph(canvas, &self.value_font, &self.value, (right, value_top), Align::Right);
    }
}

pub(crate) struct SideColumn<'a> {
    items: Vec<Box<dyn SideItem + 'a>>,
    gap: f32,
}

impl<'a> SideColumn<'a> {
    /// The column for `scene`; `code` is the code's pixels, when painting.
    pub(crate) fn new(
        scene: &'a Scene,
        fonts: &'a FontLibrary,
        metrics: &Metrics,
        code: Option<&'a Pixmap>,
    ) -> Self {
        let mut items: Vec<Box<dyn SideItem + 'a>> = Vec::new();
        if scene.show_soundwave {
            items.push(Box::new(Soundwave { scale: scene.scale, ink: scene.theme.ink.to_skia() }));
        }
        if let Some(image) = &scene.code {
            let width = match image.kind {
                CodeKind::Qr => metrics.qr_size,
                CodeKind::Spotify => metrics.side_width,
            };
            items.push(Box::new(Code { width, aspect: image.bitmap.aspect(), image: code }));
        }
        for credit in &scene.credits {
            let label_font = Typesetter::new(fonts, &scene.credit_label_font);
            let value_font = Typesetter::new(fonts, &scene.credit_value_font);
            items.push(Box::new(Credit {
                label: label_font.wrap(&credit.label, metrics.side_width, BODY_LEADING),
                value: value_font.wrap(&credit.value, metrics.side_width, BODY_LEADING),
                label_font,
                value_font,
            }));
        }
        Self { items, gap: metrics.side_gap }
    }

    pub(crate) fn height(&self) -> f32 {
        let heights: Vec<f32> = self.items.iter().map(|item| item.height()).collect();
        stacked(&heights, self.gap)
    }

    pub(crate) fn paint(&self, canvas: &mut Canvas, x: f32, top: f32, width: f32) {
        let mut y = top;
        for (index, item) in self.items.iter().enumerate() {
            if index > 0 {
                y += self.gap;
            }
            let height = item.height();
            item.paint(canvas, Area::new(x, y, width, height));
            y += height;
        }
    }
}

#[cfg(test)]
mod tests {
    use poster_model::{Credit, Request};
    use poster_testkit::scenes;
    use poster_text::FontLibrary;

    use super::SideColumn;
    use crate::metrics::Metrics;

    fn height_with(value: &str) -> f32 {
        let fixture = scenes::latin().remove(0);
        let mut request: Request = serde_json::from_str(&fixture.request).unwrap();
        let fonts = FontLibrary::load(request.font_assets(&fixture.fonts));
        let scene = &mut request.scene;
        scene.credits = vec![Credit { label: "Regie".into(), value: value.into() }];
        let metrics = Metrics::of(scene);
        let column = SideColumn::new(scene, &fonts, &metrics, None);
        column.height()
    }

    #[test]
    fn a_long_credit_wraps_and_the_column_grows_with_it() {
        let short = height_with("Nolan");
        let long = height_with("Christopher Nolan, Jonathan Nolan, Emma Thomas");
        assert!(long > short, "{short} vs {long}");
    }
}
