"""One-time build of the renderer's glyph-fallback faces.

The bundled poster families are latin subsets: between them they cover
`POSTER_FONT_COMMON_COVERAGE` in `poster-font-fallback.ts` and nothing else, so
a Polish, Turkish, Greek, Cyrillic or Vietnamese title — or a star, a heart, an
arrow — has no glyph to draw. The DOM renderer never showed that because a
browser silently reaches past the requested family; the Rust renderer has to be
handed the faces it may reach for.

DejaVu is what those faces are cut from: one file per style already covers
Latin-ext, Greek, Cyrillic, Vietnamese, punctuation, currency and the symbol
blocks, so a fallback never needs a second hop, and its licence (Bitstream Vera
+ Arev, both permissive) lets the app ship it like every other bundled face.

Run once, from the repo root, and commit the result next to the fonts it backs:

    pip install fonttools brotli
    python scripts/build-fallback-fonts.py

Output lands in `src/assets/fonts/<Face>.fallback.ttf`. The `.fallback.ttf`
suffix keeps `convert-fonts-to-sfnt.mjs` — which only walks woff/woff2 — from
treating these as sources of its own.
"""

import io
import os
import urllib.request
import zipfile

from fontTools import subset

RELEASE = (
    "https://github.com/dejavu-fonts/dejavu-fonts/releases/download/"
    "version_2_37/dejavu-fonts-ttf-2.37.zip"
)

# Everything the latin subsets leave out that a poster can plausibly print:
# Latin-A/B and the combining marks a decomposed title carries, Greek, Cyrillic,
# Vietnamese, general punctuation, currency, arrows, maths, and the geometric,
# miscellaneous and dingbat symbol blocks a ★ or a ♥ comes from.
UNICODES = ",".join(
    [
        "U+0000-02FF",
        "U+0300-036F",
        "U+0370-03FF",
        "U+0400-052F",
        "U+1E00-1EFF",
        "U+2000-206F",
        "U+2070-209F",
        "U+20A0-20BF",
        "U+2100-214F",
        "U+2150-218F",
        "U+2190-21FF",
        "U+2200-22FF",
        "U+25A0-25FF",
        "U+2600-26FF",
        "U+2700-27BF",
    ]
)

FACES = [
    "DejaVuSans",
    "DejaVuSans-Bold",
    "DejaVuSerif",
    "DejaVuSerif-Bold",
    "DejaVuSansMono",
    "DejaVuSansMono-Bold",
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")


def main() -> None:
    with urllib.request.urlopen(RELEASE) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))

    for face in FACES:
        entry = next(n for n in archive.namelist() if n.endswith(f"/ttf/{face}.ttf"))
        source = os.path.join(OUT_DIR, f".{face}.source.ttf")
        with open(source, "wb") as handle:
            handle.write(archive.read(entry))

        out = os.path.join(OUT_DIR, f"{face}.fallback.ttf")
        subset.main(
            [
                source,
                f"--unicodes={UNICODES}",
                f"--output-file={out}",
                # fontdue reads outlines and horizontal metrics only: it shapes
                # nothing, so every layout and hinting table is dead weight in a
                # file the browser downloads before a poster can be painted.
                "--layout-features=",
                "--no-hinting",
                "--drop-tables+=GSUB,GPOS,GDEF,DSIG,LTSH,VDMX,hdmx,kern,FFTM",
            ]
        )
        os.remove(source)
        print(f"{face} -> {os.path.basename(out)} ({os.path.getsize(out)} bytes)")


if __name__ == "__main__":
    main()
