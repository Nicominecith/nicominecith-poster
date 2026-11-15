use std::{cell::RefCell, collections::HashMap, fmt, rc::Rc};

use crate::face::Face;

thread_local! {
    /// Faces are immutable and keyed by their bundled URL, so each is parsed
    /// once per worker rather than once per render.
    static PARSED: RefCell<HashMap<String, Rc<Face>>> = RefCell::new(HashMap::new());
}

/// The faces one render may use, by asset key.
pub struct FontLibrary {
    faces: HashMap<String, Rc<Face>>,
}

impl FontLibrary {
    /// Parses every asset not parsed before; unreadable ones are left out.
    pub fn load(assets: impl IntoIterator<Item = (String, Vec<u8>)>) -> Self {
        let faces = PARSED.with(|parsed| {
            let mut parsed = parsed.borrow_mut();
            assets
                .into_iter()
                .filter_map(|(key, bytes)| {
                    if let Some(face) = parsed.get(&key) {
                        return Some((key, Rc::clone(face)));
                    }
                    let face = Rc::new(Face::parse(&bytes)?);
                    parsed.insert(key.clone(), Rc::clone(&face));
                    Some((key, face))
                })
                .collect()
        });
        Self { faces }
    }

    pub(crate) fn face(&self, key: &str) -> Option<&Face> {
        self.faces.get(key).map(Rc::as_ref)
    }
}

impl fmt::Debug for FontLibrary {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_set().entries(self.faces.keys()).finish()
    }
}
