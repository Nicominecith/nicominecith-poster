use std::{collections::BTreeMap, env, fmt::Write, fs, path::PathBuf};

use poster_model::Request;
use poster_render::{to_straight_rgba, Band, FontLibrary, Poster};
use poster_testkit::scenes::{self, Fixture};

struct Loaded {
    request: Request,
    fonts: FontLibrary,
}

fn load(fixture: &Fixture) -> Loaded {
    let request: Request = serde_json::from_str(&fixture.request).unwrap();
    let fonts = FontLibrary::load(request.font_assets(&fixture.fonts));
    Loaded { request, fonts }
}

fn render(fixture: &Fixture) -> Vec<u8> {
    let loaded = load(fixture);
    let pixmap = Poster::new(&loaded.request.scene, &loaded.fonts).render(&fixture.pixels).unwrap();
    to_straight_rgba(&pixmap)
}

fn fixtures() -> Vec<Fixture> {
    let mut all = scenes::latin();
    if cfg!(feature = "scripts") {
        all.extend(scenes::scripts());
    }
    all
}

/// FNV-1a: stable across platforms and enough to notice a changed pixel.
fn fingerprint(bytes: &[u8]) -> String {
    let hash = bytes.iter().fold(0xcbf2_9ce4_8422_2325_u64, |hash, &byte| {
        (hash ^ u64::from(byte)).wrapping_mul(0x0100_0000_01b3)
    });
    format!("{hash:016x}")
}

fn snapshot_file() -> PathBuf {
    let build = if cfg!(feature = "scripts") { "scripts" } else { "latin" };
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(format!("tests/snapshots/{build}.txt"))
}

/// Every scene paints exactly the pixels it painted when the snapshot was
/// taken. Run with `UPDATE_SNAPSHOTS=1` after an intended visual change.
#[test]
fn scenes_match_their_snapshots() {
    let actual: BTreeMap<&str, String> =
        fixtures().iter().map(|fixture| (fixture.name, fingerprint(&render(fixture)))).collect();
    let file = snapshot_file();
    if env::var_os("UPDATE_SNAPSHOTS").is_some() {
        let lines = actual.iter().fold(String::new(), |mut lines, (name, hash)| {
            writeln!(lines, "{name} {hash}").unwrap();
            lines
        });
        fs::write(&file, lines).unwrap();
        return;
    }
    let stored = fs::read_to_string(&file).expect("snapshots; run with UPDATE_SNAPSHOTS=1");
    let expected: BTreeMap<&str, String> = stored
        .lines()
        .filter_map(|line| line.split_once(' '))
        .map(|(name, hash)| (name, hash.to_owned()))
        .collect();
    assert_eq!(expected, actual);
}

/// Bands painted apart and laid together are the whole poster: no glyph is
/// cut or shifted at a seam. Images scaled across a seam may differ by one
/// level of rounding.
#[test]
fn bands_stitch_into_the_whole_poster() {
    const ROWS: u32 = 97;
    for fixture in fixtures() {
        let loaded = load(&fixture);
        let poster = Poster::new(&loaded.request.scene, &loaded.fonts);
        let prepared = poster.prepare(&fixture.pixels);
        let stitched: Vec<u8> = (0..fixture.height())
            .step_by(ROWS as usize)
            .flat_map(|top| {
                to_straight_rgba(&poster.paint(&prepared, Band { top, rows: ROWS }).unwrap())
            })
            .collect();
        let whole = render(&fixture);
        assert_eq!(stitched.len(), whole.len());
        let worst = stitched.iter().zip(&whole).map(|(a, b)| a.abs_diff(*b)).max().unwrap_or(0);
        assert!(worst <= 1, "{}: a seam differs by {worst}", fixture.name);
    }
}

#[test]
fn a_band_past_the_bottom_is_empty() {
    let fixture = scenes::latin().remove(0);
    let loaded = load(&fixture);
    let poster = Poster::new(&loaded.request.scene, &loaded.fonts);
    let prepared = poster.prepare(&fixture.pixels);
    assert!(poster.paint(&prepared, Band { top: fixture.height(), rows: 10 }).is_none());
}

/// The share of dark pixels, a rough measure of how much text was printed.
fn ink(rgba: &[u8]) -> f32 {
    let pixels = rgba.chunks_exact(4);
    let count = pixels.len() as f32;
    pixels.filter(|pixel| pixel[0] < 128).count() as f32 / count
}

fn without_fallbacks(fixture: &Fixture) -> Fixture {
    let mut request: serde_json::Value = serde_json::from_str(&fixture.request).unwrap();
    for font in ["title_font", "artist_font", "track_font", "credit_value_font"] {
        request["scene"][font]["fallbacks"] = serde_json::json!([]);
    }
    Fixture { request: request.to_string(), ..fixture.clone() }
}

#[test]
fn fallbacks_print_what_the_family_cannot() {
    let fixture = scenes::latin().into_iter().find(|fixture| fixture.name == "fallback").unwrap();
    let with = ink(&render(&fixture));
    let without = ink(&render(&without_fallbacks(&fixture)));
    assert!((with - without).abs() > 0.0005, "fallbacks changed nothing: {without} vs {with}");
}

#[test]
fn fallbacks_change_nothing_the_family_can_set() {
    let fixture = scenes::latin().into_iter().find(|fixture| fixture.name == "gallery").unwrap();
    let mut request: serde_json::Value = serde_json::from_str(&fixture.request).unwrap();
    request["scene"]["title_font"]["fallbacks"] =
        serde_json::json!([poster_testkit::fonts::dejavu_sans()]);
    request["fonts"][poster_testkit::fonts::dejavu_sans()] =
        serde_json::json!({ "offset": fixture.fonts.len(), "length": 0 });
    let with = Fixture { request: request.to_string(), ..fixture.clone() };
    assert_eq!(fingerprint(&render(&with)), fingerprint(&render(&fixture)));
}
