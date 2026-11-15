//! The wire format between the web app and the renderer: one [`Request`]
//! carries a [`Scene`] plus where each font's bytes sit in the font arena.
//! Every size is already resolved to output pixels or poster units; nothing
//! here computes layout.

mod color;
mod font;
mod request;
mod scene;

pub use color::Color;
pub use font::FontSpec;
pub use request::{FontSlice, Request};
pub use scene::{
    Bitmap, CodeImage, CodeKind, Credit, Image, Layout, PaletteShape, Row, Scene, TextAlign, Theme,
};
