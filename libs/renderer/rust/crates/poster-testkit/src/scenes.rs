//! Scenes that between them reach every branch of the painter, each with the
//! pixel and font arenas a render request carries.

use std::collections::BTreeSet;

use serde_json::{json, Value};

use crate::fonts;

/// One render request, ready to hand to the renderer.
#[derive(Debug, Clone)]
pub struct Fixture {
    pub name: &'static str,
    pub request: String,
    pub pixels: Vec<u8>,
    pub fonts: Vec<u8>,
}

impl Fixture {
    #[must_use]
    pub fn height(&self) -> u32 {
        let request: Value = serde_json::from_str(&self.request).expect("fixture json");
        request["scene"]["height"].as_u64().expect("scene height") as u32
    }
}

/// Every fixture the plain build can render.
#[must_use]
pub fn latin() -> Vec<Fixture> {
    vec![classic(), bloom(), noir(), gallery(), sized_bar(), fallback()]
}

/// Fixtures that need the `scripts` build.
#[must_use]
pub fn scripts() -> Vec<Fixture> {
    vec![devanagari_and_arabic()]
}

/// Collects bitmaps into one arena, as the app transfers them.
#[derive(Default)]
struct Pixels {
    arena: Vec<u8>,
}

impl Pixels {
    fn add(&mut self, width: u32, height: u32, pixel: impl Fn(u32, u32) -> [u8; 4]) -> Value {
        let offset = self.arena.len();
        for y in 0..height {
            for x in 0..width {
                self.arena.extend_from_slice(&pixel(x, y));
            }
        }
        json!({ "width": width, "height": height, "offset": offset })
    }

    /// An opaque diagonal gradient, like a cover photograph.
    fn photo(&mut self, width: u32, height: u32, tint: [u8; 3]) -> Value {
        self.add(width, height, |x, y| {
            let t = (x + y) * 255 / (width + height).max(1);
            [tint[0] ^ t as u8, tint[1].wrapping_add(t as u8 / 2), tint[2], 255]
        })
    }

    /// A blocky code with a transparent quiet zone.
    fn code(&mut self, width: u32, height: u32) -> Value {
        self.add(width, height, |x, y| {
            let margin = 4;
            if x < margin || y < margin || x >= width - margin || y >= height - margin {
                return [0, 0, 0, 0];
            }
            let on = ((x / 5) * 7 + (y / 5) * 3) % 4 == 0;
            if on {
                [20, 20, 20, 255]
            } else {
                [255, 255, 255, 180]
            }
        })
    }
}

fn color(r: u8, g: u8, b: u8, a: f32) -> Value {
    json!({ "r": r, "g": g, "b": b, "a": a })
}

fn font(asset: &str, size: f32, rgb: [u8; 3], fallbacks: &[String]) -> Value {
    json!({
        "asset": asset,
        "size": size,
        "letter_spacing": 0.0,
        "uppercase": false,
        "color": color(rgb[0], rgb[1], rgb[2], 1.0),
        "fallbacks": fallbacks,
    })
}

fn spaced(mut font: Value, letter_spacing: f32, uppercase: bool) -> Value {
    font["letter_spacing"] = json!(letter_spacing);
    font["uppercase"] = json!(uppercase);
    font
}

fn rows(labels: &[&str], details: &[&str], emphasized: Option<&(usize, Value)>) -> Value {
    let rows: Vec<Value> = labels
        .iter()
        .zip(details.iter().chain(std::iter::repeat(&"")))
        .enumerate()
        .map(|(index, (label, detail))| {
            let bold = emphasized.as_ref().filter(|(at, _)| *at == index).map(|(_, font)| font);
            json!({ "label": label, "duration": detail, "emphasized_font": bold })
        })
        .collect();
    Value::Array(rows)
}

fn credits(entries: &[(&str, &str)]) -> Value {
    entries.iter().map(|(label, value)| json!({ "label": label, "value": value })).collect()
}

fn palette(colors: &[[u8; 3]]) -> Value {
    colors.iter().map(|[r, g, b]| color(*r, *g, *b, 1.0)).collect()
}

const PALETTE: [[u8; 3]; 5] =
    [[242, 239, 232], [179, 179, 179], [121, 119, 116], [74, 70, 56], [22, 20, 15]];

#[allow(clippy::too_many_lines, reason = "one scene, field by field, as the app sends it")]
fn base(width: u32, height: u32) -> Value {
    let ink = [20, 18, 14];
    json!({
        "width": width,
        "height": height,
        "scale": width as f32 / 1000.0,
        "theme": {
            "paper": color(242, 239, 232, 1.0),
            "mat": color(230, 225, 214, 1.0),
            "ink": color(ink[0], ink[1], ink[2], 1.0),
            "frame_border": 6.0,
            "palette_shape": "bar",
            "palette_bar_stretch": true,
            "palette_top": 20.0,
            "palette_width": 24.0,
            "palette_height": 18.0,
            "palette_gap": 8.0,
            "backdrop": false,
            "backdrop_blur": 0.0,
            "title_leading": 1.05,
        },
        "layout": {
            "outer_pad": 42.0,
            "inner_pad": 18.0,
            "content_width": 880.0,
            "cover_size": 760.0,
            "cover_gap": 36.0,
            "title_gap": 6.0,
            "side_column_width": 155.0,
            "qr_size": 95.0,
            "side_gap": 14.0,
            "track_gap": 9.0,
            "track_column_gap": 28.0,
            "content_gap": 24.0,
            "duration_gap": 12.0,
        },
        "title": "Paper Planes",
        "title_font": font(&fonts::bebas(), 50.0, ink, &[]),
        "artist": "The Night Shift",
        "artist_font": font(&fonts::lato_bold(), 22.0, ink, &[]),
        "eyebrow_first": false,
        "title_align": "left",
        "cover": null,
        "backdrop": null,
        "brand": null,
        "show_palette": true,
        "palette": palette(&PALETTE),
        "palette_index_font": null,
        "columns": [],
        "track_font": font(&fonts::lato(), 15.5, ink, &[]),
        "duration_color": color(140, 140, 140, 1.0),
        "credits": [],
        "credit_label_font": spaced(font(&fonts::lato_bold(), 11.0, ink, &[]), 1.1, true),
        "credit_value_font": font(&fonts::lato(), 12.5, [90, 90, 90], &[]),
        "show_soundwave": false,
        "code": null,
    })
}

/// Collects every font a scene names and lays their bytes into one arena.
fn finish(name: &'static str, scene: &Value, pixels: Pixels) -> Fixture {
    let mut keys = BTreeSet::new();
    collect_fonts(scene, &mut keys);
    let mut arena = Vec::new();
    let mut slices = serde_json::Map::new();
    for key in keys {
        let bytes = std::fs::read(&key).expect(&key);
        slices.insert(key, json!({ "offset": arena.len(), "length": bytes.len() }));
        arena.extend_from_slice(&bytes);
    }
    let request = json!({ "scene": scene, "fonts": slices }).to_string();
    Fixture { name, request, pixels: pixels.arena, fonts: arena }
}

fn collect_fonts(value: &Value, keys: &mut BTreeSet<String>) {
    match value {
        Value::Object(map) => {
            if let (Some(Value::String(asset)), Some(Value::Array(fallbacks))) =
                (map.get("asset"), map.get("fallbacks"))
            {
                keys.insert(asset.clone());
                keys.extend(fallbacks.iter().filter_map(|key| key.as_str().map(str::to_owned)));
            }
            map.values().for_each(|child| collect_fonts(child, keys));
        }
        Value::Array(items) => items.iter().for_each(|child| collect_fonts(child, keys)),
        _ => {}
    }
}

/// Framed paper, a square cover, a numbered stretched bar, two columns with
/// durations and an emphasized row, credits, a soundwave and a QR code.
fn classic() -> Fixture {
    let mut pixels = Pixels::default();
    let mut scene = base(500, 720);
    scene["cover"] = json!({ "bitmap": pixels.photo(330, 330, [40, 90, 160]) });
    scene["palette_index_font"] = json!(font(&fonts::lato(), 9.0, [120, 120, 120], &[]));
    let bold = font(&fonts::lato_bold(), 15.5, [20, 18, 14], &[]);
    scene["columns"] = json!([
        rows(
            &["Intro", "Paper Planes", "Night Drive", "Afterglow", "Static", "Satellites"],
            &["0:42", "3:18", "4:05", "12:57", "2:31", "5:00"],
            Some(&(1, bold)),
        ),
        rows(
            &["Undertow", "A Very Long Song Title That Has To Wrap", "Coda", "Outro"],
            &["3:33", "6:01", "1:10", "1:57"],
            None,
        ),
    ]);
    scene["credits"] = credits(&[
        ("Released", "10 October 2007"),
        ("Length", "48 min"),
        ("Producers", "Christopher Nolan, Jonathan Nolan, Emma Thomas"),
    ]);
    scene["show_soundwave"] = json!(true);
    scene["code"] = json!({ "kind": "qr", "bitmap": pixels.code(48, 48) });
    finish("classic", &scene, pixels)
}

/// A blurred backdrop with scrim, a shadowed upright cover with the brand
/// plate, circle swatches, an eyebrow subtitle, centred uppercase text and a
/// Spotify code.
fn bloom() -> Fixture {
    let mut pixels = Pixels::default();
    let mut scene = base(480, 860);
    let white = [255, 255, 255];
    scene["theme"]["backdrop"] = json!(true);
    scene["theme"]["backdrop_blur"] = json!(30.0);
    scene["theme"]["frame_border"] = json!(0.0);
    scene["theme"]["palette_shape"] = json!("circle");
    scene["theme"]["palette_bar_stretch"] = json!(false);
    scene["theme"]["mat"] = color(16, 14, 12, 1.0);
    scene["layout"]["cover_size"] = json!(420.0);
    scene["layout"]["cover_height"] = json!(630.0);
    scene["backdrop"] = json!({ "bitmap": pixels.photo(240, 430, [200, 60, 30]) });
    scene["cover"] = json!({ "bitmap": pixels.photo(200, 300, [10, 140, 90]) });
    scene["brand"] = json!("freetsy.de");
    scene["eyebrow_first"] = json!(true);
    scene["title_align"] = json!("center");
    scene["title"] = json!("Straße der Lichter");
    scene["title_font"] = spaced(font(&fonts::bebas(), 46.0, white, &[]), 0.6, true);
    scene["artist_font"] = spaced(font(&fonts::lato_bold(), 16.0, white, &[]), 3.2, true);
    scene["palette_index_font"] = json!(font(&fonts::lato(), 9.0, [200, 200, 200], &[]));
    scene["track_font"] = font(&fonts::lato(), 14.0, white, &[]);
    scene["columns"] = json!([rows(
        &["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
        &["Dominick Cobb", "Mal", "Eames"],
        None
    )]);
    scene["credits"] = credits(&[("Premiere", "8 July 2010"), ("Runtime", "148 min")]);
    scene["credit_label_font"] = spaced(font(&fonts::lato_bold(), 10.0, white, &[]), 1.0, true);
    scene["credit_value_font"] = font(&fonts::lato(), 11.0, [200, 200, 200], &[]);
    scene["code"] = json!({ "kind": "spotify", "bitmap": pixels.code(120, 30) });
    finish("bloom", &scene, pixels)
}

/// No cover image (the mat fills its box), block swatches with gaps, right
/// alignment, an empty subtitle and one column of long wrapping rows.
fn noir() -> Fixture {
    let pixels = Pixels::default();
    let mut scene = base(420, 620);
    let paper = [235, 235, 235];
    scene["theme"]["paper"] = color(8, 8, 8, 1.0);
    scene["theme"]["frame_border"] = json!(0.0);
    scene["theme"]["palette_shape"] = json!("block");
    scene["theme"]["palette_bar_stretch"] = json!(false);
    scene["title_align"] = json!("right");
    scene["artist"] = json!("");
    scene["title_font"] = font(&fonts::bebas(), 54.0, paper, &[]);
    scene["track_font"] = font(&fonts::lato(), 15.0, paper, &[]);
    scene["layout"]["cover_size"] = json!(520.0);
    scene["columns"] = json!([rows(
        &[
            "Cobb steals secrets from dreams and is offered one last job that could give him his life back.",
            "Saito",
        ],
        &[],
        None
    )]);
    finish("noir", &scene, pixels)
}

/// Rounded swatches, a 1.5-unit frame, centred title, three columns with
/// tabular numbers in a monospace face, and letter spacing.
fn gallery() -> Fixture {
    let mut pixels = Pixels::default();
    let mut scene = base(600, 780);
    let ink = [30, 30, 30];
    scene["theme"]["frame_border"] = json!(1.5);
    scene["theme"]["palette_shape"] = json!("round");
    scene["theme"]["palette_bar_stretch"] = json!(false);
    scene["title_align"] = json!("center");
    scene["cover"] = json!({ "bitmap": pixels.photo(360, 360, [200, 180, 40]) });
    scene["track_font"] = spaced(font(&fonts::mono(), 12.0, ink, &[]), 0.4, false);
    let labels = ["01. Ein unerwartetes Fest", "02. Hammelbraten", "03. Eine kurze Rast"];
    scene["columns"] = json!([
        rows(&labels, &["13", "47", "68"], None),
        rows(&labels, &["80", "96", "124"], None),
        rows(&labels, &["150", "184", "221"], None),
    ]);
    scene["credits"] = credits(&[("Erschienen", "1937"), ("Umfang", "331 Seiten")]);
    finish("gallery", &scene, pixels)
}

/// A bar whose swatches keep their own width instead of stretching.
fn sized_bar() -> Fixture {
    let mut pixels = Pixels::default();
    let mut scene = base(400, 560);
    scene["theme"]["palette_bar_stretch"] = json!(false);
    scene["title_align"] = json!("center");
    scene["cover"] = json!({ "bitmap": pixels.photo(250, 250, [90, 30, 120]) });
    finish("sized-bar", &scene, pixels)
}

/// Text the Latin poster families cannot set, printed through fallbacks.
fn fallback() -> Fixture {
    let pixels = Pixels::default();
    let mut scene = base(460, 640);
    let ink = [20, 18, 14];
    let fallbacks = vec![fonts::dejavu_serif(), fonts::dejavu_sans()];
    scene["title"] = json!("Пикник ★ Łódź");
    scene["title_font"] = font(&fonts::lato(), 40.0, ink, &fallbacks);
    scene["artist"] = json!("Ωμέγα · Đặng");
    scene["artist_font"] = font(&fonts::lato_bold(), 18.0, ink, &fallbacks);
    scene["track_font"] = font(&fonts::lato(), 14.0, ink, &fallbacks);
    scene["columns"] =
        json!([rows(&["★★★★★ Lieblingssong", "Ünïcödé — „Zitat“"], &["★", "3:00"], None)]);
    scene["credits"] = credits(&[("Meine Bewertung", "★★★★☆")]);
    scene["credit_value_font"] = font(&fonts::lato(), 12.0, [90, 90, 90], &fallbacks);
    finish("fallback", &scene, pixels)
}

/// Shaped scripts: a Devanagari title and an Arabic row beside Latin text.
fn devanagari_and_arabic() -> Fixture {
    let pixels = Pixels::default();
    let mut scene = base(460, 640);
    let ink = [20, 18, 14];
    let fallbacks = vec![fonts::dejavu_sans(), fonts::devanagari(), fonts::arabic()];
    scene["title"] = json!("अहंकार Freestyle");
    scene["title_font"] = font(&fonts::lato(), 40.0, ink, &fallbacks);
    scene["track_font"] = spaced(font(&fonts::lato(), 15.0, ink, &fallbacks), 0.8, false);
    scene["columns"] = json!([rows(&["سلام AB", "क्षत्रियकुलावतंस", "कि क्ष"], &["1:00"], None)]);
    finish("scripts", &scene, pixels)
}
