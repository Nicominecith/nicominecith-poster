//! Fonts as the app ships them. A font's path doubles as its asset key.

use std::{fs, path::PathBuf};

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../../..")
}

fn bundled(file: &str) -> String {
    repo_root().join("libs/fonts/assets").join(file).to_string_lossy().into_owned()
}

fn fontsource(package: &str, file: &str) -> String {
    let path = format!("node_modules/@fontsource/{package}/files/{file}");
    repo_root().join(path).to_string_lossy().into_owned()
}

#[must_use]
pub fn lato() -> String {
    bundled("Lato-Regular.sfnt.ttf")
}

#[must_use]
pub fn lato_bold() -> String {
    bundled("Lato-Bold.sfnt.ttf")
}

#[must_use]
pub fn bebas() -> String {
    bundled("BebasNeue-Regular.sfnt.ttf")
}

#[must_use]
pub fn mono() -> String {
    bundled("JetBrainsMono-Regular.sfnt.ttf")
}

#[must_use]
pub fn dejavu_sans() -> String {
    bundled("DejaVuSans.fallback.ttf")
}

#[must_use]
pub fn dejavu_serif() -> String {
    bundled("DejaVuSerif.fallback.ttf")
}

#[must_use]
pub fn devanagari() -> String {
    fontsource("noto-sans-devanagari", "noto-sans-devanagari-devanagari-400-normal.woff2")
}

#[must_use]
pub fn arabic() -> String {
    fontsource("noto-sans-arabic", "noto-sans-arabic-arabic-400-normal.woff2")
}

/// Every regular-weight Japanese subset Fontsource splits the face into.
#[must_use]
pub fn japanese() -> Vec<String> {
    let dir = repo_root().join("node_modules/@fontsource/noto-sans-jp/files");
    let mut files: Vec<String> = fs::read_dir(&dir)
        .map(|entries| {
            entries
                .filter_map(|entry| entry.ok()?.file_name().into_string().ok())
                .filter(|name| name.ends_with("-400-normal.woff2"))
                .map(|name| dir.join(name).to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    files.sort();
    files
}

/// Each key with its bytes, as a render request's font arena carries them.
#[must_use]
pub fn read(keys: &[String]) -> Vec<(String, Vec<u8>)> {
    keys.iter().map(|key| (key.clone(), fs::read(key).expect(key))).collect()
}
