//! Requests in, pixels or JPEG bytes out, with nothing tied to WebAssembly,
//! so it runs and is tested natively.

use std::fmt;

use jpeg_encoder::{ColorType, Density, Encoder};
use poster_model::Request;
use poster_render::{to_straight_rgba, Band, FontLibrary, Pixmap, Poster, Prepared};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    Request(String),
    EmptyPoster,
    InvalidBand,
    Jpeg(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Request(reason) => f.write_str(reason),
            Self::EmptyPoster => f.write_str("Poster has no pixels"),
            Self::InvalidBand => f.write_str("Invalid poster strip"),
            Self::Jpeg(reason) => write!(f, "JPEG encoding failed: {reason}"),
        }
    }
}

impl std::error::Error for Error {}

/// Painted pixels, ready to hand back in the format the caller asked for.
#[derive(Debug)]
pub struct Rendered(Pixmap);

impl Rendered {
    #[must_use]
    pub fn into_rgba(self) -> Vec<u8> {
        to_straight_rgba(&self.0)
    }

    /// The painter starts from an opaque mat, so every pixel is opaque and the
    /// premultiplied bytes are the straight ones; the encoder skips alpha.
    pub fn into_jpeg(self, dpi: u16, quality: u8) -> Result<Vec<u8>, Error> {
        let pixmap = self.0;
        let mut jpeg = Vec::new();
        let mut encoder = Encoder::new(&mut jpeg, quality);
        encoder.set_density(Density::Inch { x: dpi, y: dpi });
        encoder
            .encode(pixmap.data(), pixmap.width() as u16, pixmap.height() as u16, ColorType::Rgba)
            .map_err(|error| Error::Jpeg(error.to_string()))?;
        Ok(jpeg)
    }
}

/// A parsed request with its fonts loaded.
#[derive(Debug)]
struct Loaded {
    request: Request,
    fonts: FontLibrary,
}

impl Loaded {
    fn parse(request_json: &str, font_arena: &[u8]) -> Result<Self, Error> {
        let request: Request = serde_json::from_str(request_json)
            .map_err(|error| Error::Request(error.to_string()))?;
        let fonts = FontLibrary::load(request.font_assets(font_arena));
        Ok(Self { request, fonts })
    }

    fn poster(&self) -> Poster<'_> {
        Poster::new(&self.request.scene, &self.fonts)
    }
}

/// Renders a whole poster.
pub fn render(
    request_json: &str,
    pixel_arena: &[u8],
    font_arena: &[u8],
) -> Result<Rendered, Error> {
    let loaded = Loaded::parse(request_json, font_arena)?;
    loaded.poster().render(pixel_arena).map(Rendered).ok_or(Error::EmptyPoster)
}

/// A poster prepared once and painted band by band.
#[derive(Debug)]
pub struct Session {
    loaded: Loaded,
    prepared: Prepared,
}

impl Session {
    pub fn open(request_json: &str, pixel_arena: &[u8], font_arena: &[u8]) -> Result<Self, Error> {
        let loaded = Loaded::parse(request_json, font_arena)?;
        let prepared = loaded.poster().prepare(pixel_arena);
        Ok(Self { loaded, prepared })
    }

    /// Rows `top..top + rows`, clipped to the poster.
    pub fn band(&self, top: u32, rows: u32) -> Result<Rendered, Error> {
        if rows == 0 || top >= self.loaded.request.scene.height {
            return Err(Error::InvalidBand);
        }
        let band = Band { top, rows };
        self.loaded.poster().paint(&self.prepared, band).map(Rendered).ok_or(Error::InvalidBand)
    }
}
