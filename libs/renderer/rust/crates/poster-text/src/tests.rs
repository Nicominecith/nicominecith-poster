use std::ptr;

use poster_canvas::Canvas;
use poster_model::{Color, FontSpec};
use poster_testkit::fonts;

use crate::{
    chain::FontChain,
    layout::{lay_out, width, Line, Setting},
    wrap::wrap,
    Align, FontLibrary, Typesetter,
};

const SIZE: f32 = 64.0;

fn library(keys: &[String]) -> FontLibrary {
    FontLibrary::load(fonts::read(keys))
}

fn spec(fallbacks: &[String]) -> FontSpec {
    FontSpec {
        asset: fonts::lato(),
        size: SIZE,
        letter_spacing: 0.0,
        uppercase: false,
        color: Color::BLACK,
        fallbacks: fallbacks.to_vec(),
    }
}

fn plain(letter_spacing: f32) -> Setting {
    Setting { size: SIZE, letter_spacing, tabular_advance: 0.0 }
}

fn line<'a>(chain: &FontChain<'a>, text: &str) -> Line<'a> {
    lay_out(chain, text, plain(0.0))
}

#[test]
fn the_family_sets_its_own_characters() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_sans()]);
    let spec = spec(&[fonts::dejavu_sans()]);
    let chain = FontChain::resolve(&fonts, &spec).unwrap();
    for ch in "Bläck Fööss & Sigur Rós".chars() {
        assert!(chain.is_own(chain.face_for_char(ch)), "{ch:?} left the family");
    }
}

#[test]
fn characters_the_family_lacks_come_from_the_fallback() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_sans()]);
    let spec = spec(&[fonts::dejavu_sans()]);
    let chain = FontChain::resolve(&fonts, &spec).unwrap();
    for ch in "Łódź Пикник Ωμέγα Đặng ★".chars().filter(|ch| !ch.is_whitespace())
    {
        assert!(chain.face_for_char(ch).has(ch), "{ch:?} found no glyph");
    }
}

#[test]
fn the_chain_is_tried_in_order() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_serif(), fonts::dejavu_sans()]);
    let spec = spec(&[fonts::dejavu_serif(), fonts::dejavu_sans()]);
    let chain = FontChain::resolve(&fonts, &spec).unwrap();
    let serif = fonts.face(&fonts::dejavu_serif()).unwrap();
    let sans = fonts.face(&fonts::dejavu_sans()).unwrap();
    assert!(ptr::eq(chain.face_for_char('Ł'), serif));
    assert!(ptr::eq(chain.face_for_char('★'), sans), "DejaVu Serif has no star");
}

#[test]
fn a_letter_keeps_its_face_whatever_precedes_it() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_serif(), fonts::dejavu_sans()]);
    let spec = spec(&[fonts::dejavu_serif(), fonts::dejavu_sans()]);
    let chain = FontChain::resolve(&fonts, &spec).unwrap();
    let serif = fonts.face(&fonts::dejavu_serif()).unwrap();
    for text in ["Ł", "★Ł"] {
        let last = line(&chain, text).glyphs.pop().unwrap();
        assert!(ptr::eq(last.face, serif), "Ł left the serif face in {text:?}");
    }
}

#[test]
fn a_character_no_face_has_stays_with_the_family() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_sans()]);
    let spec = spec(&[fonts::dejavu_sans()]);
    let chain = FontChain::resolve(&fonts, &spec).unwrap();
    assert!(chain.is_own(chain.face_for_char('日')));
}

#[test]
fn a_fallback_glyph_is_measured_and_drawn_at_its_own_width() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_sans()]);
    let bare = spec(&[]);
    let filled = spec(&[fonts::dejavu_sans()]);
    let bare_width = width(&FontChain::resolve(&fonts, &bare).unwrap(), "★★", plain(0.0));
    let filled_width = width(&FontChain::resolve(&fonts, &filled).unwrap(), "★★", plain(0.0));
    assert!(filled_width > 0.0);
    assert!((filled_width - bare_width).abs() > 0.5, "{bare_width} vs {filled_width}");

    let mut canvas = Canvas::band(400, 200, 0, 200).unwrap();
    let drawn = Typesetter::new(&fonts, &filled).draw(&mut canvas, "★★", 10.0, 120.0, Align::Left);
    assert!((drawn - filled_width).abs() < 0.01);
    let pixmap = canvas.into_pixmap();
    assert!(pixmap.pixels().iter().any(|pixel| pixel.alpha() > 0), "nothing was drawn");
}

#[test]
fn wrapping_measures_fallback_glyphs() {
    let fonts = library(&[fonts::lato(), fonts::dejavu_sans()]);
    let spec = spec(&[fonts::dejavu_sans()]);
    let chain = FontChain::resolve(&fonts, &spec).unwrap();
    let lines = wrap(&chain, "Пикник на обочине", plain(0.0), 400.0);
    assert!(lines.len() > 1, "never wrapped: {lines:?}");
    assert_eq!(lines.join(" "), "Пикник на обочине");
}

#[test]
fn a_word_wider_than_the_line_is_split() {
    let fonts = library(&[fonts::lato()]);
    let spec = spec(&[]);
    let paragraph = Typesetter::new(&fonts, &spec).wrap("Donaudampfschifffahrt", 200.0, 1.5);
    assert!(paragraph.lines.len() > 1);
    assert_eq!(paragraph.lines.concat(), "Donaudampfschifffahrt");
    assert!((paragraph.height() - SIZE * 1.5 * paragraph.lines.len() as f32).abs() < 0.01);
}

#[test]
fn a_missing_asset_measures_as_empty_and_draws_nothing() {
    let fonts = library(&[]);
    let spec = spec(&[]);
    let font = Typesetter::new(&fonts, &spec);
    assert!(!font.is_available());
    assert!(font.wrap("Anything", 100.0, 1.5).lines.is_empty());
    assert!((font.baseline(96.0) - SIZE * 0.8).abs() < f32::EPSILON);
    let mut canvas = Canvas::band(10, 10, 0, 10).unwrap();
    assert!(font.draw(&mut canvas, "A", 0.0, 5.0, Align::Left).abs() < f32::EPSILON);
}

#[test]
fn uppercase_follows_unicode_like_css() {
    let fonts = library(&[fonts::lato()]);
    let spec = FontSpec { uppercase: true, ..spec(&[]) };
    let paragraph = Typesetter::new(&fonts, &spec).wrap("straße", 10_000.0, 1.0);
    assert_eq!(paragraph.lines, ["STRASSE"]);
}

#[cfg(feature = "scripts")]
mod scripts {
    use super::*;

    fn ids(chain: &FontChain, text: &str, letter_spacing: f32) -> (Vec<u16>, f32) {
        let line = lay_out(chain, text, plain(letter_spacing));
        (line.glyphs.iter().map(|glyph| glyph.id).collect(), line.width)
    }

    #[test]
    fn a_woff2_face_is_unpacked() {
        let fonts = library(&[fonts::devanagari()]);
        assert!(fonts.face(&fonts::devanagari()).unwrap().has('अ'));
    }

    #[test]
    fn a_hindi_title_has_no_missing_glyph() {
        let fonts = library(&[fonts::lato(), fonts::dejavu_sans(), fonts::devanagari()]);
        let spec = spec(&[fonts::dejavu_sans(), fonts::devanagari()]);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        let line = line(&chain, "अहंकार Freestyle");
        assert!(line.glyphs.iter().all(|glyph| glyph.id != 0), "a glyph printed as a box");
        assert!(line.glyphs.iter().filter(|glyph| chain.is_own(glyph.face)).count() >= 10);
        let devanagari = fonts.face(&fonts::devanagari()).unwrap();
        assert!(line.glyphs.iter().any(|glyph| ptr::eq(glyph.face, devanagari)));
    }

    #[test]
    fn devanagari_is_shaped() {
        let fonts = library(&[fonts::lato(), fonts::devanagari()]);
        let spec = spec(&[fonts::devanagari()]);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        let face = fonts.face(&fonts::devanagari()).unwrap();
        let (glyphs, _) = ids(&chain, "कि", 0.0);
        assert_eq!(glyphs.len(), 2);
        assert_ne!(glyphs[0], face.raster.lookup_glyph_index('क'), "ि was not reordered");
        let (glyphs, _) = ids(&chain, "क्ष", 0.0);
        assert!(glyphs.len() < 3, "क्ष formed no conjunct: {glyphs:?}");
    }

    #[test]
    fn arabic_joins_right_to_left_without_letter_spacing() {
        let fonts = library(&[fonts::lato(), fonts::arabic()]);
        let spec = spec(&[fonts::arabic()]);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        let face = fonts.face(&fonts::arabic()).unwrap();
        let text = "سلام";
        let (glyphs, width) = ids(&chain, text, 0.0);
        assert!(width > 0.0 && glyphs.iter().all(|id| *id != 0));
        let isolated: Vec<u16> =
            text.chars().map(|ch| face.raster.lookup_glyph_index(ch)).collect();
        let reversed: Vec<u16> = isolated.iter().rev().copied().collect();
        assert_ne!(glyphs, isolated, "neither joined nor reversed");
        assert_ne!(glyphs, reversed, "reversed but never joined");
        let (_, spaced) = ids(&chain, text, 12.0);
        assert!((spaced - width).abs() < 0.01, "{width} vs {spaced}");
    }

    #[test]
    fn latin_inside_arabic_keeps_its_order() {
        let fonts = library(&[fonts::lato(), fonts::arabic()]);
        let spec = spec(&[fonts::arabic()]);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        let line = line(&chain, "سلام AB");
        let x_of = |ch| {
            let id = chain.own.raster.lookup_glyph_index(ch);
            line.glyphs.iter().find(|glyph| chain.is_own(glyph.face) && glyph.id == id).unwrap().x
        };
        assert!(x_of('A') < x_of('B'), "AB printed backwards");
    }

    #[test]
    fn letter_spacing_follows_whole_clusters() {
        let fonts = library(&[fonts::lato(), fonts::devanagari()]);
        let spec = spec(&[fonts::devanagari()]);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        // अ | हं | का | र: four clusters, three gaps.
        let (_, plain_width) = ids(&chain, "अहंकार", 0.0);
        let (_, spaced) = ids(&chain, "अहंकार", 10.0);
        assert!((spaced - plain_width - 30.0).abs() < 0.01, "{plain_width} vs {spaced}");
    }

    #[test]
    fn japanese_without_spaces_wraps_between_characters() {
        let files = fonts::japanese();
        let mut keys = vec![fonts::lato()];
        keys.extend(files.iter().cloned());
        let fonts = library(&keys);
        let spec = spec(&files);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        let title = "千と千尋の神隠しサウンドトラック";
        assert!(line(&chain, title).glyphs.iter().all(|glyph| glyph.id != 0));
        let lines = wrap(&chain, title, plain(0.0), 400.0);
        assert!(lines.len() > 1, "never wrapped: {lines:?}");
        assert_eq!(lines.concat(), title);
    }

    #[test]
    fn a_line_never_breaks_inside_a_syllable() {
        let fonts = library(&[fonts::lato(), fonts::devanagari()]);
        let spec = spec(&[fonts::devanagari()]);
        let chain = FontChain::resolve(&fonts, &spec).unwrap();
        let lines = wrap(&chain, "क्षत्रियकुलावतंस", plain(0.0), 120.0);
        assert!(lines.len() > 1);
        for line in &lines {
            let first = u32::from(line.chars().next().unwrap());
            let dependent =
                (0x093E..=0x094D).contains(&first) || (0x0901..=0x0903).contains(&first);
            assert!(!dependent, "a line began with a dependent sign: {lines:?}");
        }
    }
}
