use std::collections::HashMap;

use serde::Deserialize;

use crate::Scene;

/// Where one font's bytes sit in the shared font arena.
#[derive(Debug, Clone, Copy, Deserialize)]
pub struct FontSlice {
    pub offset: u32,
    pub length: u32,
}

/// One render call: the scene and the byte ranges of every font it names.
#[derive(Debug, Clone, Deserialize)]
pub struct Request {
    pub scene: Scene,
    pub fonts: HashMap<String, FontSlice>,
}

impl Request {
    /// Each named font's bytes, cut out of the arena they were sent in. A
    /// range that runs past the arena is skipped.
    pub fn font_assets<'a>(
        &'a self,
        arena: &'a [u8],
    ) -> impl Iterator<Item = (String, Vec<u8>)> + 'a {
        self.fonts.iter().filter_map(|(name, slice)| {
            let start = slice.offset as usize;
            let end = start + slice.length as usize;
            arena.get(start..end).map(|bytes| (name.clone(), bytes.to_vec()))
        })
    }
}
