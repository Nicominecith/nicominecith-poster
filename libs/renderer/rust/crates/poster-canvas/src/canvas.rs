use tiny_skia::{
    FillRule, FilterQuality, IntRect, Paint, Path, Pixmap, PixmapPaint, PixmapRef, Rect, Transform,
};

use crate::{Area, Shadow};

/// A horizontal band of a poster. Everything is placed in whole-poster
/// coordinates; the canvas shifts it into the rows it holds, so a large
/// export can paint its bands independently.
#[derive(Debug)]
pub struct Canvas {
    pixmap: Pixmap,
    top: f32,
    width: f32,
    height: f32,
}

impl Canvas {
    /// The rows `top..top + rows` of a `width × height` poster.
    #[must_use]
    pub fn band(width: u32, height: u32, top: u32, rows: u32) -> Option<Self> {
        Some(Self {
            pixmap: Pixmap::new(width, rows)?,
            top: top as f32,
            width: width as f32,
            height: height as f32,
        })
    }

    /// The whole poster's size, not the band's.
    #[must_use]
    pub fn poster(&self) -> Area {
        Area::new(0.0, 0.0, self.width, self.height)
    }

    /// Converts a poster `y` into this band's rows.
    #[must_use]
    pub fn local_y(&self, y: f32) -> f32 {
        y - self.top
    }

    /// The band's rows, as `[top, bottom)` in poster pixels.
    #[must_use]
    pub fn rows(&self) -> (f32, f32) {
        (self.top, self.top + self.pixmap.height() as f32)
    }

    /// Whether anything spanning `top..bottom` reaches this band. Worth asking
    /// before work that is costly to build even when clipped away.
    #[must_use]
    pub fn covers(&self, top: f32, bottom: f32) -> bool {
        bottom > self.top && top < self.top + self.pixmap.height() as f32
    }

    #[must_use]
    pub fn into_pixmap(self) -> Pixmap {
        self.pixmap
    }

    pub fn fill(&mut self, area: Area, color: tiny_skia::Color) {
        let local = Area { y: self.local_y(area.y), ..area };
        fill_area(&mut self.pixmap, local, color);
    }

    /// A CSS border: inside the box, on whole pixels, square corners, its
    /// width rounded down but never below one pixel.
    pub fn fill_border(&mut self, area: Area, width: f32, color: tiny_skia::Color) {
        if width <= 0.0 || area.is_empty() {
            return;
        }
        let left = area.x.round();
        let top = area.y.round();
        let right = area.right().round();
        let bottom = area.bottom().round();
        let span_x = right - left;
        let span_y = bottom - top;
        let rule = width.floor().max(1.0).min((span_x / 2.0).min(span_y / 2.0));
        let side = span_y - rule * 2.0;
        self.fill(Area::new(left, top, span_x, rule), color);
        self.fill(Area::new(left, bottom - rule, span_x, rule), color);
        self.fill(Area::new(left, top + rule, rule, side), color);
        self.fill(Area::new(right - rule, top + rule, rule, side), color);
    }

    pub fn fill_path(&mut self, path: &Path, color: tiny_skia::Color) {
        let paint = solid(color);
        let shift = Transform::from_translate(0.0, -self.top);
        self.pixmap.fill_path(path, &paint, FillRule::Winding, shift, None);
    }

    /// Draws `image` at its own size, snapped to whole poster pixels, so a
    /// band paints exactly the rows the whole poster would.
    pub fn draw(&mut self, image: &Pixmap, x: f32, y: f32) {
        if !self.covers(y, y + image.height() as f32) {
            return;
        }
        let left = x.round() as i32;
        let top = (y.round() - self.top) as i32;
        // tiny-skia pads an image drawn past the top or left edge with its
        // edge pixels, so the part outside is cut off here instead.
        let (skip_x, skip_y) = (left.min(0).unsigned_abs(), top.min(0).unsigned_abs());
        if skip_x == 0 && skip_y == 0 {
            self.blit(image.as_ref(), left, top);
            return;
        }
        let visible = IntRect::from_xywh(
            skip_x as i32,
            skip_y as i32,
            image.width().saturating_sub(skip_x),
            image.height().saturating_sub(skip_y),
        );
        if let Some(cropped) = visible.and_then(|rect| image.clone_rect(rect)) {
            self.blit(cropped.as_ref(), left.max(0), top.max(0));
        }
    }

    fn blit(&mut self, image: PixmapRef, x: i32, y: i32) {
        let paint = PixmapPaint::default();
        self.pixmap.draw_pixmap(x, y, image, &paint, Transform::identity(), None);
    }

    /// Draws `image` stretched over `area`. Images arrive smaller than print
    /// size when a browser canvas could not hold them, and are scaled here.
    pub fn draw_scaled(&mut self, image: &Pixmap, area: Area) {
        if !self.covers(area.y, area.bottom()) {
            return;
        }
        let scale_x = area.width / image.width() as f32;
        let scale_y = area.height / image.height() as f32;
        if is_unit(scale_x) && is_unit(scale_y) {
            self.draw(image, area.x, area.y);
            return;
        }
        let paint = PixmapPaint { quality: FilterQuality::Bilinear, ..PixmapPaint::default() };
        let transform =
            Transform::from_row(scale_x, 0.0, 0.0, scale_y, area.x, self.local_y(area.y));
        self.pixmap.draw_pixmap(0, 0, image.as_ref(), &paint, transform, None);
    }

    /// A blurred silhouette of `area` under it, as a CSS `box-shadow`.
    pub fn draw_shadow(&mut self, area: Area, shadow: &Shadow) {
        if area.is_empty() || shadow.blur <= 0.0 {
            return;
        }
        let spread = shadow.blur * 2.0;
        let shifted = area.y + shadow.offset_y;
        if !self.covers(shifted - spread, shifted + area.height + spread) {
            return;
        }
        if let Some((image, placed)) = shadow.render(area) {
            self.draw_scaled(&image, placed);
        }
    }
}

fn is_unit(scale: f32) -> bool {
    (scale - 1.0).abs() < f32::EPSILON
}

fn solid(color: tiny_skia::Color) -> Paint<'static> {
    let mut paint = Paint::default();
    paint.set_color(color);
    paint.anti_alias = true;
    paint
}

pub(crate) fn fill_area(pixmap: &mut Pixmap, area: Area, color: tiny_skia::Color) {
    if area.is_empty() {
        return;
    }
    if let Some(rect) = Rect::from_xywh(area.x, area.y, area.width, area.height) {
        pixmap.fill_rect(rect, &solid(color), Transform::identity(), None);
    }
}
