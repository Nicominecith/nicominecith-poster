//! Pixel primitives on top of tiny-skia: the [`Canvas`] a poster band is
//! painted on, a fast box blur, drop shadows, and conversion between the
//! browser's straight alpha and tiny-skia's premultiplied pixels.

mod alpha;
mod area;
mod blur;
mod canvas;
mod shadow;

pub use alpha::{pixmap_from_rgba, to_straight_rgba};
pub use area::Area;
pub use blur::box_blur;
pub use canvas::Canvas;
pub use shadow::Shadow;
pub use tiny_skia::{Color, Path, PathBuilder, Pixmap, Rect};
