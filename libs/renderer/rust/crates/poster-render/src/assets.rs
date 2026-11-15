use poster_canvas::{pixmap_from_rgba, Pixmap};
use poster_model::{Bitmap, Scene};

use crate::backdrop;

/// The scene's images in tiny-skia's storage, converted once, so painting
/// another band never repeats the work.
#[derive(Debug)]
pub(crate) struct Assets {
    pub(crate) cover: Option<Pixmap>,
    pub(crate) backdrop: Option<Pixmap>,
    pub(crate) code: Option<Pixmap>,
}

impl Assets {
    pub(crate) fn prepare(scene: &Scene, arena: &[u8]) -> Self {
        let image =
            |bitmap: &Bitmap| pixmap_from_rgba(bitmap.width, bitmap.height, bitmap.pixels(arena)?);
        Self {
            cover: scene.cover.as_ref().and_then(|cover| image(&cover.bitmap)),
            backdrop: scene
                .backdrop
                .as_ref()
                .and_then(|backdrop| backdrop::prepare(scene, &backdrop.bitmap, arena)),
            code: scene.code.as_ref().and_then(|code| image(&code.bitmap)),
        }
    }
}
