# Poster rendering

One renderer draws the poster, and it is written in Rust (the `rust/` workspace,
compiled to wasm). The preview on screen and the file that downloads are the
same call with a different output: `renderPosterToPixels` for the canvas,
`renderPosterToJpeg` for the export, `measurePosterFits` for the overflow
warning. Whatever the preview shows is what the export contains, because
nothing else can draw a poster.

This replaced a pipeline that captured the live React preview as an SVG
`foreignObject`, loaded it as an `<img>` and drew it to a canvas. That pipeline
depended on how each engine rasterizes an SVG image, and Firefox is where it
broke: data: URLs are capped at 32 MB (`network.url.max-length`, raised to
512 MB only in Firefox 136), and a snapshot carrying a full-resolution cover —
twice over, for the backdrop styles — went past that and failed every export on
machines that had no trouble doing the work. Gecko also rasterizes an SVG image
at its intrinsic size and scales the bitmap (Bugzilla 647485), so a capture that
did fit printed blurred. Neither failure mode exists here: no snapshot, no data:
URL, no engine-specific rasterization.

## Division of labour

The browser decodes bitmaps and resamples them; Rust does everything else.

- **Browser** (`pixel-source.ts`): decodes the cover through `createImageBitmap`
  — any format the browser reads, including the original upload — applies the
  user's crop, and resamples to exactly the box it prints in, with canvas
  smoothing. It builds the blurred backdrop's own smaller copy and rasterizes
  the QR/Spotify code. Ceilings: `MAX_COVER_PIXELS` 4000, and for the backdrop
  whichever is smaller of `MAX_BACKDROP_PIXELS` 1400 and the width at which its
  blur radius reaches `BACKDROP_WORKING_BLUR`. The backdrop is blurred before
  anything sees it, so a copy fine enough to out-resolve its own blur only
  costs the blur passes and every export worker another copy. A print-size
  poster is wider than a canvas can be (A1 at 600 DPI is 14031 px), so bitmaps
  arrive bounded and Rust scales them into place.
- **Rust**: text measurement, shaping and wrapping, layout, every painted
  pixel, and the JPEG. Fonts are parsed by `fontdue` from sfnt bytes and
  rasterization is `tiny-skia`; text in a script face is shaped by `rustybuzz`
  (see [Every script](#every-script)). `jpeg-encoder` writes the file: an `OffscreenCanvas` was tried
  and measured an order of magnitude slower on a print-size frame, needed three
  more full-frame buffers to be handed the pixels, and could only report a
  refusal by throwing — which left the whole poster to be painted a second time
  for the fallback. Above `PARALLEL_JPEG_MIN_PIXELS` the poster is split into
  full-width horizontal bands. Several ordinary Web Workers paint and
  JPEG-encode those bands concurrently, then `jpeg-stream.ts` joins their
  compatible scans at restart boundaries. This needs neither
  `SharedArrayBuffer` nor COOP/COEP headers and keeps working on static hosts
  and iOS.

Both halves work from the app's existing data structures. `src/scene.ts`
calls the same `customizePosterTheme`, `customizePosterSpec`, `resolveLayout`
and `posterDesignFontIds` the editor uses, and serializes the result to the
`Scene` in `rust/crates/poster-model`. There is no second description of
a poster to keep in sync.

## Request shape

`buildRequest` builds the scene twice. The first pass has no bitmaps and exists
only to read the layout numbers — the cover's box, the code's width — that
decide what size the browser must resample to; the second carries the pixels.

Three things cross into the worker per render: the scene as JSON, one pixel
arena (every bitmap concatenated, addressed by byte offset) and one font arena
(the same, for font files). Both arenas are transferred, not copied.
`PixelArenaBuilder` fills them with `.set()`; spreading megapixels into `push`
overflows the call stack.

## Worker and cancellation

`src/wasm-renderer.ts` keeps separate preview and export module workers
(`render.worker.ts`) and matches replies to requests by id. Terminating a
worker is the only way to stop a wasm call already running. A new preview value
therefore cancels only stale preview work; it cannot cancel or queue behind a
file export. Its render response carries the overflow measurement beside the
pixels, so one edit creates one worker job, and prepared preview bitmaps and
parsed fonts are reused while their inputs stay unchanged.

`poster-canvas.tsx` keeps exactly one preview frame in flight and never
cancels it: a frame is short, and abandoning one that is nearly finished only
means the next edit starts from nothing again. While edits keep arriving it
paints at `PREVIEW_DRAFT_SCALE` of the canvas width, blitted up through a
scratch canvas so the visible one is never resized, and follows with the sharp
frame once they stop. A frame that is already an edit behind is still drawn:
holding it back until nothing newer exists is exactly what makes a dragged
slider show nothing until it is let go.

Magnifying the preview raises that width ceiling to
`PREVIEW_MAX_ZOOMED_WIDTH_PX` rather than enlarging pixels the canvas already
has, so zooming in shows what the poster really says at print size. The
magnified poster scrolls inside the box it already occupied — dragged with the
left mouse button, or by touch, which the platform scrolls itself.

The small-export worker is short-lived. It drops the idle preview worker before
a print render and terminates itself after returning the file. Large exports
use `parallel-jpeg.ts` and `strip.worker.ts`. Their concurrency scales up to
`navigator.hardwareConcurrency - 1`, retaining one logical processor for the
UI/browser. A second input-aware limit divides an adaptive memory budget by the
source arena plus the bounded band working set; `navigator.deviceMemory` is
used where available, with core-sensitive mobile and conservative fallbacks
where Safari does not expose it. A third gives every worker at least
`MIN_PIXELS_PER_WORKER` to paint: starting one costs a thread, a copy of the
source bitmaps and its own backdrop blur, and past that point the copies cost
more than the extra core saves. The band height then follows from the worker
count, at roughly `STRIPS_PER_WORKER` turns each, so a band that runs long is
covered by the others rather than by everyone waiting for it. Each worker
receives the scene, fonts and
source pixels once through a worker-local `PosterStripRenderer`; subsequent
bands pass only their row range. Cover, backdrop and code are converted to
tiny-skia pixmaps once per worker, including the backdrop blur and scrim, then
reused by every band assigned to it. All workers terminate as soon as the JPEG
is assembled or cancellation fires.

## Fonts

`fontdue` reads sfnt (TrueType/OpenType), not woff2, and most bundled families
are woff2 — Inter is woff1, which `wawoff2` cannot convert. `bun run build:fonts`
writes a `<name>.sfnt.ttf` next to each source font
(`libs/fonts/scripts/convert-fonts-to-sfnt.mjs`, with `woff1-to-sfnt.mjs` for the woff1
pair). Those files are committed and imported by
`@freetsy/fonts` (`sfnt-faces.ts`); only the families a poster actually uses are
fetched and sent.

### Glyph fallback

Those subsets are latin, and between them they cover exactly
`POSTER_FONT_COMMON_COVERAGE` (`@freetsy/fonts` (`coverage.ts`)). Nothing else has a
glyph: a Polish, Turkish, Greek, Cyrillic or Vietnamese title, or a ★ in a
track name, drew whatever the family keeps at glyph 0 — usually an empty box.
The DOM renderer never showed that, because a browser silently walks past the
requested family into the rest of its font list; a wasm renderer has no list to
walk unless it is handed one.

So each `FontSpec` carries its own `fallbacks`: the faces `poster-text` tries, in
order, for a grapheme cluster its family is short of, with the run's own face
always winning when it can set the whole cluster. The first of them are
`*.fallback.ttf`, cut from DejaVu by `libs/fonts/scripts/build-fallback-fonts.py` — sans,
serif and mono, each in regular and bold, chained so the sans face backs the
other two for the symbol blocks they were not cut with. `src/scene.ts`
decides once per poster whether its text needs any fallback and leaves the
chains empty when it does not, so an English or German poster downloads
nothing extra. Its text reaches the scene composed to NFC first: a pasted "ö"
can arrive as an "o" plus a combining diaeresis, and a family's own text is
placed one character at a time with no mark positioning of its own.

### Every script

Behind DejaVu come the Noto faces for everything else: Devanagari and the other
Indic scripts, Arabic, Hebrew, Thai, Khmer, Ethiopic, Chinese, Japanese,
Korean, the historic scripts, maths, music and monochrome emoji — 168 families,
installed as `@fontsource/noto-*` packages and fetched as the WOFF2 slices
Fontsource publishes, so a Chinese title fetches the handful of its hundred
slices that its characters are in, not the whole face.

`libs/fonts/scripts/build-script-faces.mjs` reads every slice's `cmap` and writes
`script-faces/`: an index with each family's outline, and per family the exact
map from a code point to its slice. Characters a poster family or DejaVu
already carries are left out of both. `@freetsy/fonts` (`script-resolver.ts`) turns a poster's
text into the faces it needs — loading the index only when the text reaches
past DejaVu, and a family's map only when a character leads to it — and
`src/scene.ts` appends them to every run's chain. Where two families carry
a character, the one listed first in the script wins; the four CJK families are
reordered per poster, so kanji beside kana print from the Japanese face and
hanja beside hangul from the Korean one. A character several scripts share (a
danda, a CJK comma) goes to a face the poster loads anyway.

These scripts cannot be set a character at a time: Devanagari reorders vowel
signs and joins conjuncts, Arabic joins its letters and runs right to left. So
`poster-text` splits each line into directional runs (Unicode bidi, on a
left-to-right paragraph, as the page was), each run into same-face segments at
grapheme boundaries, and sends every segment set in a script face — or running
right to left — through `rustybuzz` (`poster-text`'s `script` module). Text a family sets on its own
is placed exactly as before, one character at a time, so latin posters print
pixel for pixel as they did. Letter spacing follows grapheme clusters and is
left out of cursive scripts, whose joins it would tear apart; a word too long
for its line is split between clusters, never inside one, which is also how a
Chinese or Japanese title without spaces finds its breaks.

Shaping, bidi and WOFF2 unpacking more than double the wasm, so the crate is
built twice — see [Building](#building). `renderer-engine.ts` picks the
`scripts` build only for a poster that has script faces; every other poster
runs on the `latin` build, which is what the renderer was before.

## CSS the renderer reproduces

The Rust painter re-implements what the DOM did, deliberately and by hand: flex
`gap` between items only, half-leading baseline placement, `text-transform:
uppercase` (including ß → SS), tabular figures, `object-fit: cover`, the
backdrop's blur, `brightness(0.75)` and scrim gradient, and the cover's
box-shadow. Two of those are optimizations rather than transcriptions: the
shadow is blurred small and scaled up (a blurred rectangle carries no detail),
and `blur.rs` is a moving-sum box blur run three times, because a naive window
at print size is billions of operations and reads as a hang.

## Building

`bun run build:wasm` — needs the `wasm32-unknown-unknown` target and
`wasm-bindgen-cli` at the version pinned in `Cargo.toml` (`=0.2.100`; a mismatch
between crate and CLI fails the build). It builds the crate twice: without its
default `scripts` feature into `wasm/poster-render` (the `latin` build) and
with it into `wasm/poster-render-scripts`. Both workers bundle both glue
modules and fetch a build's wasm the first time a poster needs it. `.cargo/config.toml` builds the wasm
with `+simd128` and `tiny-skia` keeps its own `simd` feature, which together
roughly halve a print-size render; every engine the app supports has shipped
baseline wasm SIMD since 2023 (Safari 16.4, Chrome 91, Firefox 89). Output lands in `wasm/poster-render`
and is committed, so a normal `bun run build` needs no Rust toolchain. Vite
consumes the `--target web` glue directly; no wasm plugin is involved.

## Memory and large-export scheduling

Small exports allocate one full-size pixmap. The parallel path never allocates
the complete print raster: every worker holds its immutable input plus at most
a 32 MiB band, and completed bands are retained only as compressed JPEG scans.
Band height is aligned to the encoder's MCU size and also capped so the JPEG
restart interval stays within its 16-bit format limit. The source-arena size is
part of worker-count selection, so a 4000-pixel upload creates fewer worker
copies than the small cover used by the browser benchmark. A1 at 600 DPI is
about 279 megapixels; it still has to compute that many pixels, but no longer
requires the former ~1.1 GB full-frame allocation or serial compression pass.

## Verification

- `bun test` — cancellation, and that the PDF embeds the renderer's JPEG bytes
  unchanged on a correctly sized page; that every script resolves to faces that
  really carry its characters, and that a latin poster loads none.
- `bun run rust:test` (the Noto cases read `node_modules`) — fallback chains,
  Devanagari, Arabic and Japanese shaped, spaced and wrapped; every fixture
  scene against its pixel snapshot; bands stitched back into the whole poster.
  It runs once with the `scripts` build and once without. `bun run rust:check`
  runs rustfmt and Clippy. See `rust/README.md` for the crates.
