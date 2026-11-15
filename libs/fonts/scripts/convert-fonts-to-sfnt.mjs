// One-time conversion so the Rust renderer can parse every poster font: fontdue
// reads TrueType/OpenType (sfnt), not woff2, and most of the bundled families
// are woff2. Output lands next to the source as `<name>.sfnt.ttf` (an OTF's
// magic bytes still call it fine as a `.ttf` on disk; fontdue only inspects
// the bytes) and is committed like the fonts themselves, not regenerated at
// build time, so the wasm crate can `include_bytes!` it directly.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { decompress } from "wawoff2";
import { woff1ToSfnt } from "./woff1-to-sfnt.mjs";

const FONTS_DIR = join(import.meta.dirname, "..", "assets");

async function main() {
  const entries = await readdir(FONTS_DIR);
  for (const entry of entries) {
    const ext = extname(entry).toLowerCase();
    if (ext !== ".woff2" && ext !== ".woff") continue;
    const source = join(FONTS_DIR, entry);
    const bytes = await readFile(source);
    // eslint-disable-next-line no-await-in-loop
    const sfnt = ext === ".woff2" ? Buffer.from(await decompress(bytes)) : woff1ToSfnt(bytes);
    const out = join(FONTS_DIR, `${basename(entry, ext)}.sfnt.ttf`);
    // eslint-disable-next-line no-await-in-loop
    await writeFile(out, sfnt);
    console.log(`${entry} -> ${basename(out)} (${sfnt.length} bytes)`);
  }
}

await main();
