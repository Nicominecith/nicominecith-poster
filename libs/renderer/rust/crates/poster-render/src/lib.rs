//! Lays out and paints a [`poster_model::Scene`]. Layout is measured once
//! from the real wrapped text ([`Prepared`]), then any band of the poster can
//! be painted from it, so a large export can be split across workers.

mod arrangement;
mod assets;
mod backdrop;
mod brand;
mod context;
mod cover;
mod frame;
mod heading;
mod metrics;
mod palette;
mod paragraph;
mod poster;
mod rows;
mod side;

pub use poster::{Band, Poster, Prepared};
pub use poster_canvas::{to_straight_rgba, Pixmap};
pub use poster_text::FontLibrary;

/// The line height every run but the title is set in, as the app's
/// `BODY_LINE_HEIGHT`.
const BODY_LEADING: f32 = 1.5;
