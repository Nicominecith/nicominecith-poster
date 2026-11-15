//! Text for the poster: a [`FontLibrary`] of parsed faces, and the
//! [`Typesetter`] that measures, wraps and draws a run in one face and the
//! fallback chain behind it. With the `scripts` feature, runs are shaped,
//! split into bidi runs and broken between grapheme clusters.

mod chain;
mod face;
mod glyphs;
mod layout;
mod library;
mod paragraph;
mod script;
mod typesetter;
mod wrap;

pub use library::FontLibrary;
pub use paragraph::Paragraph;
pub use poster_model::TextAlign as Align;
pub use typesetter::Typesetter;

#[cfg(test)]
mod tests;
