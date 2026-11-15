use tiny_skia::Pixmap;

use crate::{box_blur, canvas::fill_area, Area};

/// A blurred shadow carries no detail, so it is built at this blur radius and
/// scaled up to print size; blurring at print size directly takes seconds.
const WORKING_BLUR: f32 = 16.0;

/// A CSS `box-shadow` with no spread or horizontal offset.
#[derive(Debug, Clone, Copy)]
pub struct Shadow {
    pub offset_y: f32,
    pub blur: f32,
    pub color: tiny_skia::Color,
}

impl Shadow {
    /// The blurred silhouette of `area` and the box it prints in.
    pub(crate) fn render(&self, area: Area) -> Option<(Pixmap, Area)> {
        let scale = (WORKING_BLUR / self.blur).min(1.0);
        let blur = (self.blur * scale).round().max(1.0);
        let width = (area.width * scale).max(1.0);
        let height = (area.height * scale).max(1.0);
        let pad = blur * 2.0;
        let extent_x = (width + pad * 2.0).ceil() as u32;
        let extent_y = (height + pad * 2.0).ceil() as u32;
        let mut image = Pixmap::new(extent_x, extent_y)?;
        fill_area(&mut image, Area::new(pad, pad, width, height), self.color);
        box_blur(&mut image, blur as u32);
        let printed_pad = pad / scale;
        let placed = Area::new(
            area.x - printed_pad,
            area.y - printed_pad + self.offset_y,
            extent_x as f32 / scale,
            extent_y as f32 / scale,
        );
        Some((image, placed))
    }
}
