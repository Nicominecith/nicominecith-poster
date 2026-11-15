use poster_model::Scene;
use poster_text::FontLibrary;

use crate::{arrangement::Arrangement, metrics::Metrics};

/// Everything a section of the poster is painted from.
pub(crate) struct Context<'a> {
    pub(crate) scene: &'a Scene,
    pub(crate) fonts: &'a FontLibrary,
    pub(crate) metrics: Metrics,
    pub(crate) arrangement: &'a Arrangement,
}
