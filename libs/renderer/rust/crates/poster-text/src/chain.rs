use std::ptr;

use poster_model::FontSpec;

use crate::{
    face::{is_ignorable, Face},
    FontLibrary,
};

/// A run's own face and the fallbacks behind it. The bundled poster families
/// are Latin subsets; every other script reaches into the chain.
pub(crate) struct FontChain<'a> {
    pub(crate) own: &'a Face,
    fallbacks: Vec<&'a Face>,
}

impl<'a> FontChain<'a> {
    /// `None` when the run's own asset is missing; missing fallbacks are skipped.
    pub(crate) fn resolve(fonts: &'a FontLibrary, spec: &FontSpec) -> Option<Self> {
        let own = fonts.face(&spec.asset)?;
        let fallbacks = spec.fallbacks.iter().filter_map(|key| fonts.face(key)).collect();
        Some(Self { own, fallbacks })
    }

    pub(crate) fn is_own(&self, face: &Face) -> bool {
        ptr::eq(face, self.own)
    }

    /// The first face with a glyph for `ch`, else the run's own (which then
    /// draws its missing-glyph box, as a browser would).
    pub(crate) fn face_for_char(&self, ch: char) -> &'a Face {
        if self.own.has(ch) {
            return self.own;
        }
        self.fallbacks.iter().copied().find(|face| face.has(ch)).unwrap_or(self.own)
    }

    /// The face a grapheme cluster prints in, never split across faces.
    /// Punctuation stays in the previous cluster's face when that face has it,
    /// so a line does not borrow its full stop from another script's font.
    pub(crate) fn face_for_cluster(&self, cluster: &str, previous: Option<&'a Face>) -> &'a Face {
        if self.own.covers(cluster) {
            return self.own;
        }
        let has_letters = cluster.chars().any(char::is_alphabetic);
        if let Some(previous) = previous.filter(|face| !has_letters && face.covers(cluster)) {
            return previous;
        }
        if let Some(face) = self.fallbacks.iter().copied().find(|face| face.covers(cluster)) {
            return face;
        }
        let base = cluster.chars().find(|ch| !is_ignorable(*ch)).unwrap_or(' ');
        self.face_for_char(base)
    }

    /// The widest digit, which tabular figures all advance by.
    pub(crate) fn digit_advance(&self, size: f32) -> f32 {
        ('0'..='9').map(|digit| self.face_for_char(digit).advance(digit, size)).fold(0.0, f32::max)
    }
}
