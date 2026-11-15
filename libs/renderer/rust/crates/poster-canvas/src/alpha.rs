use tiny_skia::Pixmap;

const OPAQUE: u8 = u8::MAX;
const CHANNELS: usize = 4;
const ALPHA: usize = 3;

fn premultiply(channel: u8, alpha: u8) -> u8 {
    ((u32::from(channel) * u32::from(alpha)) / u32::from(OPAQUE)) as u8
}

fn unpremultiply(channel: u8, alpha: u8) -> u8 {
    ((u32::from(channel) * u32::from(OPAQUE)) / u32::from(alpha)).min(u32::from(OPAQUE)) as u8
}

/// Straight-alpha RGBA, as the browser decodes it, in tiny-skia's
/// premultiplied storage. `None` when the size is invalid or `rgba` is short.
#[must_use]
pub fn pixmap_from_rgba(width: u32, height: u32, rgba: &[u8]) -> Option<Pixmap> {
    let mut pixmap = Pixmap::new(width, height)?;
    let rgba = rgba.get(..pixmap.data().len())?;
    let data = pixmap.data_mut();
    // Photographs are opaque, and opaque pixels need no conversion.
    if rgba.chunks_exact(CHANNELS).all(|px| px[ALPHA] == OPAQUE) {
        data.copy_from_slice(rgba);
        return Some(pixmap);
    }
    for (dst, src) in data.chunks_exact_mut(CHANNELS).zip(rgba.chunks_exact(CHANNELS)) {
        let alpha = src[ALPHA];
        for channel in 0..ALPHA {
            dst[channel] = premultiply(src[channel], alpha);
        }
        dst[ALPHA] = alpha;
    }
    Some(pixmap)
}

/// The pixmap as straight-alpha RGBA, ready for `ImageData`.
#[must_use]
pub fn to_straight_rgba(pixmap: &Pixmap) -> Vec<u8> {
    let mut rgba = vec![0; pixmap.data().len()];
    for (dst, src) in rgba.chunks_exact_mut(CHANNELS).zip(pixmap.data().chunks_exact(CHANNELS)) {
        let alpha = src[ALPHA];
        if alpha == 0 {
            continue;
        }
        for channel in 0..ALPHA {
            dst[channel] = unpremultiply(src[channel], alpha);
        }
        dst[ALPHA] = alpha;
    }
    rgba
}
