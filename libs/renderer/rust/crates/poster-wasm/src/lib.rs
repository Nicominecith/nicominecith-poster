//! The renderer's WebAssembly entry points, as the web app's workers call
//! them. Everything here only crosses the boundary; the work is in
//! [`pipeline`].

pub mod pipeline;

use wasm_bindgen::prelude::*;

use pipeline::{Error, Rendered, Session};

impl From<Error> for JsValue {
    fn from(error: Error) -> Self {
        JsValue::from_str(&error.to_string())
    }
}

/// The poster as straight-alpha RGBA rows, for the live preview's canvas.
#[wasm_bindgen]
pub fn render_rgba(
    request_json: &str,
    pixel_arena: &[u8],
    font_arena: &[u8],
) -> Result<Vec<u8>, JsValue> {
    console_error_panic_hook::set_once();
    Ok(pipeline::render(request_json, pixel_arena, font_arena)?.into_rgba())
}

/// The poster as JPEG bytes at the given DPI and quality.
#[wasm_bindgen]
pub fn render_jpeg(
    request_json: &str,
    pixel_arena: &[u8],
    font_arena: &[u8],
    dpi: u16,
    quality: u8,
) -> Result<Vec<u8>, JsValue> {
    console_error_panic_hook::set_once();
    let rendered: Rendered = pipeline::render(request_json, pixel_arena, font_arena)?;
    Ok(rendered.into_jpeg(dpi, quality)?)
}

/// A worker-local renderer for large exports: the scene, pixels and fonts
/// cross the boundary once, then each band is a call with four integers.
#[wasm_bindgen]
#[derive(Debug)]
pub struct PosterStripRenderer {
    session: Session,
}

#[wasm_bindgen]
impl PosterStripRenderer {
    #[wasm_bindgen(constructor)]
    pub fn new(
        request_json: &str,
        pixel_arena: &[u8],
        font_arena: &[u8],
    ) -> Result<PosterStripRenderer, JsValue> {
        console_error_panic_hook::set_once();
        Ok(Self { session: Session::open(request_json, pixel_arena, font_arena)? })
    }

    pub fn render_jpeg(
        &self,
        y: u32,
        height: u32,
        dpi: u16,
        quality: u8,
    ) -> Result<Vec<u8>, JsValue> {
        Ok(self.session.band(y, height)?.into_jpeg(dpi, quality)?)
    }
}
