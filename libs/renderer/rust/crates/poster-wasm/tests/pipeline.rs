use poster_testkit::scenes;
use poster_wasm::pipeline::{render, Error, Session};

#[test]
fn a_malformed_request_is_an_error() {
    let error = render("{}", &[], &[]).unwrap_err();
    assert!(matches!(error, Error::Request(_)), "{error}");
}

#[test]
fn preview_pixels_are_straight_rgba_of_the_poster_size() {
    let fixture = scenes::latin().remove(0);
    let rgba = render(&fixture.request, &fixture.pixels, &fixture.fonts).unwrap().into_rgba();
    assert_eq!(rgba.len(), 500 * fixture.height() as usize * 4);
    assert!(rgba.chunks_exact(4).all(|pixel| pixel[3] == u8::MAX), "the mat is opaque");
}

#[test]
fn jpeg_exports_carry_their_resolution() {
    let fixture = scenes::latin().remove(0);
    let jpeg = render(&fixture.request, &fixture.pixels, &fixture.fonts)
        .unwrap()
        .into_jpeg(300, 92)
        .unwrap();
    assert_eq!(&jpeg[..2], [0xFF, 0xD8], "a JPEG starts with SOI");
    // JFIF APP0 density: units 1 (dots per inch), then 300 × 300.
    let density = jpeg.windows(5).position(|window| window == [1, 1, 44, 1, 44]);
    assert!(density.is_some(), "no 300 DPI density in the JFIF header");
}

#[test]
fn bands_outside_the_poster_are_refused() {
    let fixture = scenes::latin().remove(0);
    let session = Session::open(&fixture.request, &fixture.pixels, &fixture.fonts).unwrap();
    assert_eq!(session.band(0, 0).unwrap_err(), Error::InvalidBand);
    assert_eq!(session.band(fixture.height(), 10).unwrap_err(), Error::InvalidBand);
    assert!(session.band(fixture.height() - 5, 100).is_ok(), "a band is clipped to the poster");
}
