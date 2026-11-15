import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { decompress } from "wawoff2";
import { z } from "zod";
import { decodeCoverage, NO_SCRIPT_FACES, resolveScriptFaces } from "../src/script-resolver";
import { DEJAVU_COVERAGE, SCRIPT_FAMILIES } from "../src/script-faces";
import { POSTER_FONT_COMMON_COVERAGE } from "../src/coverage";
import { codePoints } from "./cmap";

async function cmapsOf(files: readonly string[]): Promise<Set<number>> {
  const carried = new Set<number>();
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const sfnt = (await decompress(readFileSync(file))).slice();
    for (const code of codePoints(sfnt)) carried.add(code);
  }
  return carried;
}

function family(file: string): string {
  return path.basename(path.dirname(path.dirname(file)));
}

const covered = (ranges: ReadonlyArray<readonly [number, number]>, code: number) =>
  ranges.some(([start, end]) => code >= start && code <= end);

void test("a poster its own families and DejaVu can print loads no script face", async () => {
  for (const text of ["Rumours", "Bläck Fööss", "Łódź", "Пикник", "Ωμέγα", "★ Hits ★"]) {
    // eslint-disable-next-line no-await-in-loop
    assert.deepEqual(await resolveScriptFaces([text]), NO_SCRIPT_FACES, text);
  }
});

void test("a Hindi title loads the Devanagari face and nothing else", async () => {
  const faces = await resolveScriptFaces(["अहंकार Freestyle"]);
  assert.deepEqual(faces[400].map(family), ["noto-sans-devanagari"]);
  assert.deepEqual(faces[700].map(family), ["noto-sans-devanagari"]);
  assert.match(faces[700][0], /-700-normal\.woff2$/);
});

void test("every character of every script resolves to a face that really carries it", async () => {
  const probes = [
    "अहंकार",
    "আমার সোনার বাংলা",
    "ਪੰਜਾਬੀ",
    "ગુજરાતી",
    "தமிழ்",
    "తెలుగు",
    "ಕನ್ನಡ",
    "മലയാളം",
    "සිංහල",
    "مرحبا بالعالم",
    "اردو",
    "שלום עולם",
    "ภาษาไทย",
    "ພາສາລາວ",
    "ភាសាខ្មែរ",
    "မြန်မာ",
    "ქართული",
    "Հայերեն",
    "አማርኛ",
    "བོད་ཡིག",
    "ᏣᎳᎩ",
    "ᠮᠣᠩᠭᠣᠯ",
    "千と千尋の神隠し",
    "我爱你中国",
    "방탄소년단",
    "🎵🔥🎸",
    "𝄞 ∮ ⌘",
  ];
  const faces = await resolveScriptFaces(probes);
  const carried = await cmapsOf(faces[400]);

  for (const char of probes.join("")) {
    const code = char.codePointAt(0) ?? 0;
    if (/\s/u.test(char) || covered(POSTER_FONT_COMMON_COVERAGE, code)) continue;
    if (covered(DEJAVU_COVERAGE, code)) continue;
    assert.ok(carried.has(code), `no resolved face carries ${char} (U+${code.toString(16)})`);
  }
});

void test("kana make a kanji Japanese and hangul Korean; without either it is Chinese", async () => {
  const families = async (text: string) =>
    new Set((await resolveScriptFaces([text]))[400].map(family));
  assert.deepEqual(await families("中国"), new Set(["noto-sans-sc"]));
  assert.deepEqual(await families("中国の歌"), new Set(["noto-sans-jp"]));
  assert.deepEqual(await families("中國 음악"), new Set(["noto-sans-kr"]));
});

void test("punctuation shared by several scripts comes from the face the text already needs", async () => {
  const faces = await resolveScriptFaces(["আমার সোনার বাংলা।"]);
  assert.deepEqual(faces[400].map(family), ["noto-sans-bengali"]);
});

void test("each family's map decodes to sorted runs inside its own outline", async () => {
  for (const scriptFamily of SCRIPT_FAMILIES) {
    // eslint-disable-next-line no-await-in-loop
    const map = await scriptFamily.load();
    const runs = decodeCoverage(map.coverage);
    let previous = -1;
    for (let i = 0; i < runs.length; i += 3) {
      const [start, end, slice] = [runs[i], runs[i + 1], runs[i + 2]];
      assert.ok(start > previous && end >= start, `${scriptFamily.id}: runs out of order`);
      assert.ok(slice < map.faces.length, `${scriptFamily.id}: slice ${slice} out of range`);
      assert.ok(covered(scriptFamily.outline, start), `${scriptFamily.id}: outside its outline`);
      previous = end;
    }
  }
});

void test("the generated families are exactly the Fontsource packages the app installs", () => {
  const { dependencies } = z
    .object({ dependencies: z.record(z.string(), z.string()) })
    .parse(
      JSON.parse(readFileSync(path.join(import.meta.dirname, "../../../package.json"), "utf8")),
    );
  const installed = Object.keys(dependencies)
    .filter((name) => name.startsWith("@fontsource/noto-"))
    .map((name) => name.slice("@fontsource/".length))
    .sort();
  assert.deepEqual(SCRIPT_FAMILIES.map((scriptFamily) => scriptFamily.id).sort(), installed);
});

void test("a Japanese title loads the Japanese map, not every map its kanji fall in", async () => {
  const loads: string[] = [];
  const cjk = SCRIPT_FAMILIES.filter((scriptFamily) => scriptFamily.id.startsWith("noto-sans-"))
    .filter((scriptFamily) => ["sc", "tc", "jp", "kr"].some((id) => scriptFamily.id.endsWith(id)))
    .map((scriptFamily) => ({ scriptFamily, load: scriptFamily.load }));
  for (const { scriptFamily, load } of cjk) {
    (scriptFamily as { load: typeof load }).load = async () => {
      loads.push(scriptFamily.id);
      return load();
    };
  }
  try {
    await resolveScriptFaces(["千と千尋の神隠し"]);
  } finally {
    for (const { scriptFamily, load } of cjk) (scriptFamily as { load: typeof load }).load = load;
  }
  assert.deepEqual(loads, ["noto-sans-jp"]);
});
