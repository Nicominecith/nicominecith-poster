# Poster renderer

The Rust workspace that draws every poster, compiled to WebAssembly for the
web app's preview and exports.

| Crate            | Does                                                           |
| ---------------- | -------------------------------------------------------------- |
| `poster-model`   | The scene the app sends, as plain data (`serde`).              |
| `poster-canvas`  | Pixel primitives: a banded `Canvas`, box blur, shadows, alpha. |
| `poster-text`    | Fonts, fallback chains, shaping, line breaking, glyphs.        |
| `poster-render`  | Lays out and paints a scene, whole or band by band.            |
| `poster-wasm`    | The WebAssembly entry points, JSON in and RGBA or JPEG out.    |
| `poster-testkit` | Fonts and fixture scenes for the tests.                        |

Each crate depends only on the ones above it. The renderer knows nothing about
music, films or books: the app turns each workshop's content into the same
scene, and what differs between them (a soundwave, numbered rows, which
credits print) is data in that scene.

The `scripts` feature adds shaping, bidi, grapheme clusters and WOFF2. The
app ships two builds and loads the heavier one only for text that needs it.

```sh
bun run rust:check   # rustfmt and Clippy, both builds
bun run rust:test    # tests, both builds
bun run build:wasm   # rebuild libs/renderer/wasm (needs wasm-bindgen-cli 0.2.100)
```

After an intended visual change, refresh the pixel snapshots:

```sh
UPDATE_SNAPSHOTS=1 cargo test --manifest-path rust/Cargo.toml -p poster-render --release
UPDATE_SNAPSHOTS=1 cargo test --manifest-path rust/Cargo.toml -p poster-render --release --no-default-features
```
