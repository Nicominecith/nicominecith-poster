// Generates the lookup tables that let a poster print any script.
//
// The bundled poster families are latin subsets, and the DejaVu fallback faces
// behind them (`build-fallback-fonts.py`) add Latin-ext, Greek, Cyrillic and the
// common symbol blocks. Everything past that — Devanagari, Arabic, Hebrew, Thai,
// Chinese, Japanese, Korean, emoji and every other script Noto covers — comes
// from the Noto faces Fontsource publishes, installed as npm packages and listed
// in `SCRIPT_FAMILIES` below.
//
// Those packages ship each face as WOFF2 slices, one per `unicode-range` a
// browser would download separately: a whole Devanagari face is one small file,
// Chinese is a hundred frequency-ordered ones. The renderer keeps that split, so
// a poster fetches only the slices its own text touches. What this script
// writes is the map from a code point to the slice that carries it:
//
//   libs/fonts/src/script-faces/index.ts        every family's outline
//                                                     (loaded with the app)
//   libs/fonts/src/script-faces/<family>.ts     that family's exact map
//                                                     and file URLs (loaded
//                                                     only by a poster that
//                                                     needs the family)
//
// Coverage is read from each slice's own `cmap`, not from the `unicode-range`
// Fontsource declares, and anything the poster families or DejaVu already carry
// is left out, so a poster never downloads a face for a character it can
// already print.
//
// Run after adding a family or bumping the @fontsource packages:
//
//     node scripts/build-script-faces.mjs
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { decompress } from "wawoff2";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const FONTS_DIR = join(import.meta.dirname, "..", "assets");
const OUT_DIR = join(import.meta.dirname, "..", "src", "script-faces");

/**
 * In priority order: where two families carry the same character, the one
 * listed first prints it. Living scripts come before historic ones, symbols
 * before the CJK faces (whose own arrows and circled numbers would otherwise
 * pull a Chinese slice into a German poster), and emoji last, so a character
 * with both a text and an emoji form keeps the text form a title expects.
 *
 * The four CJK families are reordered per poster in `poster-font-scripts.ts`:
 * Japanese text gets its kanji from the Japanese face, Korean from the Korean.
 */
const SCRIPT_FAMILIES = [
  // Living scripts with the most readers first.
  "noto-sans-arabic",
  "noto-sans-hebrew",
  "noto-sans-devanagari",
  "noto-sans-bengali",
  "noto-sans-gurmukhi",
  "noto-sans-gujarati",
  "noto-sans-oriya",
  "noto-sans-tamil",
  "noto-sans-telugu",
  "noto-sans-kannada",
  "noto-sans-malayalam",
  "noto-sans-sinhala",
  "noto-sans-thai",
  "noto-sans-lao",
  "noto-sans-khmer",
  "noto-sans-myanmar",
  "noto-sans-armenian",
  "noto-sans-georgian",
  "noto-sans-ethiopic",
  "noto-serif-tibetan",
  "noto-sans-thaana",
  "noto-sans-syriac",
  "noto-sans-mongolian",
  "noto-sans-nko",
  "noto-sans-tifinagh",
  "noto-sans-cherokee",
  "noto-sans-canadian-aboriginal",
  "noto-sans-yi",
  "noto-sans-adlam",
  "noto-sans-javanese",
  "noto-sans-balinese",
  "noto-sans-sundanese",
  "noto-sans-ol-chiki",
  "noto-sans-lisu",
  "noto-sans-vai",
  "noto-sans-bamum",
  "noto-sans-osage",
  "noto-sans-tai-viet",
  "noto-sans-tai-le",
  "noto-sans-tai-tham",
  "noto-sans-new-tai-lue",
  "noto-sans-buginese",
  "noto-sans-batak",
  "noto-sans-cham",
  "noto-sans-chakma",
  "noto-sans-meetei-mayek",
  "noto-sans-lepcha",
  "noto-sans-limbu",
  "noto-sans-saurashtra",
  "noto-sans-syloti-nagri",
  "noto-sans-kayah-li",
  "noto-sans-rejang",
  "noto-sans-tagalog",
  "noto-sans-hanunoo",
  "noto-sans-buhid",
  "noto-sans-tagbanwa",
  "noto-sans-samaritan",
  "noto-sans-mandaic",
  "noto-sans-hanifi-rohingya",
  "noto-sans-wancho",
  "noto-sans-nag-mundari",
  "noto-sans-tangsa",
  "noto-sans-sunuwar",
  "noto-sans-kawi",
  "noto-sans-medefaidrin",
  "noto-sans-mende-kikakui",
  "noto-sans-miao",
  "noto-sans-mro",
  "noto-sans-pahawh-hmong",
  "noto-serif-np-hmong",
  "noto-sans-pau-cin-hau",
  "noto-sans-bassa-vah",
  "noto-sans-masaram-gondi",
  "noto-sans-gunjala-gondi",
  "noto-sans-warang-citi",
  "noto-sans-sora-sompeng",
  "noto-serif-toto",
  "noto-serif-yezidi",
  "noto-sans-vithkuqi",
  "noto-serif-ottoman-siyaq",
  "noto-sans-indic-siyaq-numbers",
  "noto-sans-tamil-supplement",
  // Historic and liturgical scripts.
  "noto-sans-newa",
  "noto-sans-tirhuta",
  "noto-sans-sharada",
  "noto-sans-siddham",
  "noto-sans-modi",
  "noto-sans-takri",
  "noto-sans-khojki",
  "noto-sans-khudawadi",
  "noto-sans-mahajani",
  "noto-sans-multani",
  "noto-sans-marchen",
  "noto-sans-bhaiksuki",
  "noto-sans-zanabazar-square",
  "noto-sans-soyombo",
  "noto-sans-nandinagari",
  "noto-sans-grantha",
  "noto-sans-kaithi",
  "noto-sans-brahmi",
  "noto-sans-kharoshthi",
  "noto-serif-ahom",
  "noto-serif-dives-akuru",
  "noto-serif-dogra",
  "noto-serif-makasar",
  "noto-serif-todhri",
  "noto-sans-phags-pa",
  "noto-sans-coptic",
  "noto-sans-glagolitic",
  "noto-sans-gothic",
  "noto-sans-runic",
  "noto-sans-ogham",
  "noto-sans-deseret",
  "noto-sans-shavian",
  "noto-sans-duployan",
  "noto-sans-elbasan",
  "noto-sans-caucasian-albanian",
  "noto-sans-old-italic",
  "noto-sans-old-hungarian",
  "noto-sans-old-turkic",
  "noto-sans-old-persian",
  "noto-sans-old-permic",
  "noto-sans-old-north-arabian",
  "noto-sans-old-south-arabian",
  "noto-sans-old-sogdian",
  "noto-sans-sogdian",
  "noto-serif-old-uyghur",
  "noto-sans-ugaritic",
  "noto-sans-cuneiform",
  "noto-sans-egyptian-hieroglyphs",
  "noto-sans-anatolian-hieroglyphs",
  "noto-sans-linear-a",
  "noto-sans-linear-b",
  "noto-sans-cypriot",
  "noto-sans-cypro-minoan",
  "noto-sans-phoenician",
  "noto-sans-imperial-aramaic",
  "noto-sans-avestan",
  "noto-sans-chorasmian",
  "noto-sans-elymaic",
  "noto-sans-hatran",
  "noto-sans-nabataean",
  "noto-sans-palmyrene",
  "noto-sans-manichaean",
  "noto-sans-psalter-pahlavi",
  "noto-sans-inscriptional-pahlavi",
  "noto-sans-inscriptional-parthian",
  "noto-sans-meroitic",
  "noto-sans-carian",
  "noto-sans-lycian",
  "noto-sans-lydian",
  "noto-sans-osmanya",
  "noto-sans-signwriting",
  "noto-sans-mayan-numerals",
  "noto-sans-nushu",
  "noto-serif-tangut",
  "noto-serif-khitan-small-script",
  // Symbols, maths and notation.
  "noto-sans-symbols",
  "noto-sans-symbols-2",
  "noto-sans-math",
  "noto-music",
  "noto-znamenny-musical-notation",
  // Chinese, Japanese and Korean; reordered per poster.
  "noto-sans-sc",
  "noto-sans-tc",
  "noto-sans-jp",
  "noto-sans-kr",
  "noto-serif-hentaigana",
  // Monochrome emoji: a poster prints in its own ink, never in colour.
  "noto-emoji",
];

/**
 * An outline merges ranges this close together, so it stays a few entries per
 * family and is cheap to ship with the app. It only decides whether a
 * family's exact map is worth loading; the map decides the rest.
 */
const OUTLINE_GAP = 256;

/** The code points one sfnt file maps, read from its best Unicode `cmap`. */
function codePoints(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tableCount = view.getUint16(4);
  let cmap = -1;
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + 16 * i;
    const tag = String.fromCharCode(...bytes.subarray(record, record + 4));
    if (tag === "cmap") cmap = view.getUint32(record + 8);
  }
  if (cmap === -1) throw new Error("font has no cmap table");

  let best = -1;
  for (let i = 0; i < view.getUint16(cmap + 2); i++) {
    const subtable = cmap + view.getUint32(cmap + 4 + 8 * i + 4);
    const format = view.getUint16(subtable);
    if (format === 12) {
      best = subtable;
      break;
    }
    if (format === 4 && best === -1) best = subtable;
  }
  if (best === -1) throw new Error("font maps no characters through a format 4 or 12 subtable");

  const covered = new Set();
  if (view.getUint16(best) === 12) {
    const groups = view.getUint32(best + 12);
    for (let i = 0; i < groups; i++) {
      const group = best + 16 + 12 * i;
      const start = view.getUint32(group);
      const end = view.getUint32(group + 4);
      const glyph = view.getUint32(group + 8);
      for (let c = start; c <= end; c++) if (glyph + (c - start) !== 0) covered.add(c);
    }
    return covered;
  }

  const segments = view.getUint16(best + 6) / 2;
  const ends = best + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  for (let i = 0; i < segments; i++) {
    const end = view.getUint16(ends + i * 2);
    const start = view.getUint16(starts + i * 2);
    const delta = view.getInt16(deltas + i * 2);
    const rangeOffset = view.getUint16(rangeOffsets + i * 2);
    for (let c = start; c <= Math.min(end, 0xfffe); c++) {
      let glyph;
      if (rangeOffset === 0) glyph = (c + delta) & 0xffff;
      else {
        const at = rangeOffsets + i * 2 + rangeOffset + (c - start) * 2;
        if (at + 2 > bytes.byteLength) continue;
        glyph = view.getUint16(at);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) covered.add(c);
    }
  }
  return covered;
}

function ranges(codes, gap = 1) {
  const sorted = [...codes].sort((a, b) => a - b);
  const out = [];
  for (const code of sorted) {
    const last = out.at(-1);
    if (last && code - last[1] <= gap) last[1] = code;
    else out.push([code, code]);
  }
  return out;
}

const hex = (code) => `0x${code.toString(16)}`;
const rangeList = (list) => list.map(([start, end]) => `[${hex(start)}, ${hex(end)}]`).join(", ");

/**
 * What a poster can already print without any script face: every code point the
 * bundled families share, plus what both DejaVu Sans faces carry — the sans
 * face ends every fallback chain, and the regular and bold cuts have to agree
 * for the choice not to depend on weight.
 */
async function alreadyPrintable() {
  const files = (await readdir(FONTS_DIR)).filter((name) => name.endsWith(".ttf"));
  const read = async (name) => codePoints(await readFile(join(FONTS_DIR, name)));

  const families = await Promise.all(
    files.filter((name) => !name.endsWith(".fallback.ttf")).map(read),
  );
  const common = families.reduce((all, one) => new Set([...all].filter((c) => one.has(c))));

  const [sans, sansBold] = await Promise.all([
    read("DejaVuSans.fallback.ttf"),
    read("DejaVuSans-Bold.fallback.ttf"),
  ]);
  const dejaVu = new Set([...sans].filter((code) => sansBold.has(code)));
  return { common, dejaVu };
}

/** One family's slices, as `<subset>` → `{ 400, 700 }` file names. */
async function slicesOf(family) {
  const dir = join(ROOT, "node_modules", "@fontsource", family, "files");
  const names = await readdir(dir);
  const slices = new Map();
  const pattern = new RegExp(`^${family}-(.+)-(400|700)-normal\\.woff2$`);
  for (const name of names) {
    const match = pattern.exec(name);
    if (!match) continue;
    const [, subset, weight] = match;
    if (!slices.has(subset)) slices.set(subset, {});
    slices.get(subset)[weight] = name;
  }
  return slices;
}

/** Numbered CJK slices sort by number, named subsets alphabetically. */
function compareSubsets(a, b) {
  const [na, nb] = [Number(a.replace(/^\[|\]$/g, "")), Number(b.replace(/^\[|\]$/g, ""))];
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

/**
 * A family's exact map as one compact string: for each run of consecutive code
 * points in the same slice, the gap since the previous run, its length and the
 * slice index, in base 36 — `gap.length.slice` runs joined by spaces, with the
 * slice left out when it is the same as the previous run's.
 */
function encodeCoverage(owner) {
  const codes = [...owner.keys()].sort((a, b) => a - b);
  const runs = [];
  for (const code of codes) {
    const last = runs.at(-1);
    if (last && code === last.end + 1 && owner.get(code) === last.slice) last.end = code;
    else runs.push({ start: code, end: code, slice: owner.get(code) });
  }
  let previousEnd = -1;
  let previousSlice = -1;
  return runs
    .map(({ start, end, slice }) => {
      const parts = [(start - previousEnd - 1).toString(36), (end - start).toString(36)];
      if (slice !== previousSlice) parts.push(slice.toString(36));
      previousEnd = end;
      previousSlice = slice;
      return parts.join(".");
    })
    .join(" ");
}

function moduleName(family) {
  return family.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

async function main() {
  const { common, dejaVu } = await alreadyPrintable();
  // Control characters never reach a glyph, whatever a face maps them to.
  const control = (code) => code < 0x20 || (code >= 0x7f && code < 0xa0);
  const printable = (code) => control(code) || common.has(code) || dejaVu.has(code);

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const index = [];
  for (const family of SCRIPT_FAMILIES) {
    // eslint-disable-next-line no-await-in-loop
    const slices = [...(await slicesOf(family))].sort(([a], [b]) => compareSubsets(a, b));
    const owner = new Map();
    const kept = [];
    for (const [subset, files] of slices) {
      if (!files["400"]) continue;
      const path = join(ROOT, "node_modules", "@fontsource", family, "files", files["400"]);
      // eslint-disable-next-line no-await-in-loop
      const sfnt = await decompress(await readFile(path));
      const fresh = [...codePoints(new Uint8Array(sfnt))].filter(
        (code) => !printable(code) && !owner.has(code),
      );
      // A latin or cyrillic slice every Noto face repeats adds nothing here.
      if (fresh.length === 0) continue;
      for (const code of fresh) owner.set(code, kept.length);
      kept.push({ subset, files });
    }
    if (kept.length === 0) throw new Error(`${family} adds no character a poster lacks`);

    const imports = [];
    const faces = kept.map(({ files }, i) => {
      const url = (weight) => {
        if (!files[weight]) return "null";
        imports.push(
          // `no-inline`: Vite would turn a slice under 4 kB into a data: URL,
          // and the URL is also the face's name in every run that uses it.
          `import s${i}w${weight} from "@fontsource/${family}/files/${files[weight]}?url&no-inline";`,
        );
        return `s${i}w${weight}`;
      };
      return `    { 400: ${url("400")}, 700: ${url("700")} },`;
    });
    await writeFile(
      join(OUT_DIR, `${family}.ts`),
      [
        `// Generated by scripts/build-script-faces.mjs from @fontsource/${family}; do not edit.`,
        ...imports,
        `import type { ScriptFamilyMap } from "./types";`,
        ``,
        `const map: ScriptFamilyMap = {`,
        `  faces: [`,
        ...faces,
        `  ],`,
        `  coverage: ${JSON.stringify(encodeCoverage(owner))},`,
        `};`,
        `export default map;`,
        ``,
      ].join("\n"),
    );

    const outline = ranges(owner.keys(), OUTLINE_GAP);
    index.push(
      `  {\n    id: ${JSON.stringify(family)},\n    outline: [${rangeList(outline)}],\n` +
        `    load: async () => (await import("./${family}")).default,\n  },`,
    );
    console.log(`${family}: ${kept.length} slice(s), ${owner.size} code points`);
  }

  await writeFile(
    join(OUT_DIR, "index.ts"),
    [
      `// Generated by scripts/build-script-faces.mjs; do not edit.`,
      `import type { ScriptFamily } from "./types";`,
      ``,
      `/** Every code point DejaVu Sans carries in both weights: what the fallback chain prints before any script face. */`,
      `export const DEJAVU_COVERAGE: ReadonlyArray<readonly [number, number]> = [`,
      `  ${rangeList(ranges([...dejaVu].filter((code) => !common.has(code))))},`,
      `];`,
      ``,
      `/** In priority order; see SCRIPT_FAMILIES in the script. */`,
      `export const SCRIPT_FAMILIES: readonly ScriptFamily[] = [`,
      ...index,
      `];`,
      ``,
    ].join("\n"),
  );

  await writeFile(
    join(OUT_DIR, "types.ts"),
    [
      `// Generated by scripts/build-script-faces.mjs; do not edit.`,
      ``,
      `/** One slice of a family at the two weights a poster prints in; \`null\` where the family has no bold. */`,
      `export type ScriptFace = { 400: string; 700: string | null };`,
      ``,
      `/** A family's exact map: its slices, and which slice carries each code point (see \`decodeCoverage\`). */`,
      `export type ScriptFamilyMap = { faces: readonly ScriptFace[]; coverage: string };`,
      ``,
      `export type ScriptFamily = {`,
      `  /** The Fontsource package the family is installed from. */`,
      `  id: string;`,
      `  /** Merged ranges around every code point the family adds: a superset, for deciding whether to load it. */`,
      `  outline: ReadonlyArray<readonly [number, number]>;`,
      `  load: () => Promise<ScriptFamilyMap>;`,
      `};`,
      ``,
    ].join("\n"),
  );
}

await main();
