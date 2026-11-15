import { needsFallbackFaces, POSTER_FONT_COMMON_COVERAGE } from "./coverage";
import type { ScriptFace, ScriptFamily, ScriptFamilyMap } from "./script-faces/types";

export type ScriptFaces = { 400: string[]; 700: string[] };

export const NO_SCRIPT_FACES: ScriptFaces = { 400: [], 700: [] };

type Ranges = ReadonlyArray<readonly [number, number]>;

function inRanges(ranges: Ranges, code: number): boolean {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const [start, end] = ranges[mid];
    if (code < start) high = mid - 1;
    else if (code > end) low = mid + 1;
    else return true;
  }
  return false;
}

export function decodeCoverage(encoded: string): Int32Array {
  const runs = encoded.split(" ");
  const out = new Int32Array(runs.length * 3);
  let previousEnd = -1;
  let slice = 0;
  runs.forEach((run, i) => {
    const [gap, length, sliceIndex] = run.split(".");
    const start = previousEnd + 1 + parseInt(gap, 36);
    const end = start + parseInt(length, 36);
    if (sliceIndex !== undefined) slice = parseInt(sliceIndex, 36);
    out.set([start, end, slice], i * 3);
    previousEnd = end;
  });
  return out;
}

const decoded = new WeakMap<ScriptFamilyMap, Int32Array>();

function sliceOf(map: ScriptFamilyMap, code: number): number {
  let runs = decoded.get(map);
  if (!runs) {
    runs = decodeCoverage(map.coverage);
    decoded.set(map, runs);
  }
  let low = 0;
  let high = runs.length / 3 - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (code < runs[mid * 3]) high = mid - 1;
    else if (code > runs[mid * 3 + 1]) low = mid + 1;
    else return runs[mid * 3 + 2];
  }
  return -1;
}

const IGNORABLE: Ranges = [
  [0xad, 0xad],
  [0x34f, 0x34f],
  [0x61c, 0x61c],
  [0x115f, 0x1160],
  [0x17b4, 0x17b5],
  [0x180b, 0x180f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x206f],
  [0x3164, 0x3164],
  [0xfe00, 0xfe0f],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
  [0x1bca0, 0x1bca3],
  [0x1d173, 0x1d17a],
  [0xe0000, 0xe0fff],
];

function uncoveredCodePoints(texts: readonly string[], dejaVu: Ranges): number[] {
  const codes = new Set<number>();
  for (const text of texts) {
    for (const char of `${text}${text.toUpperCase()}`) {
      if (/\s/u.test(char)) continue;
      const code = char.codePointAt(0) ?? 0;
      if (inRanges(IGNORABLE, code)) continue;
      if (inRanges(POSTER_FONT_COMMON_COVERAGE, code) || inRanges(dejaVu, code)) continue;
      codes.add(code);
    }
  }
  return [...codes];
}

const CJK_FAMILIES = ["noto-sans-sc", "noto-sans-tc", "noto-sans-jp", "noto-sans-kr"];
const KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/u;
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/u;

function familyOrder(families: readonly ScriptFamily[], texts: readonly string[]): ScriptFamily[] {
  const joined = texts.join("");
  const lead = KANA.test(joined) ? "noto-sans-jp" : HANGUL.test(joined) ? "noto-sans-kr" : null;
  if (!lead) return [...families];
  const leader = families.find((family) => family.id === lead);
  const firstCjk = families.findIndex((family) => CJK_FAMILIES.includes(family.id));
  if (!leader || firstCjk === -1) return [...families];
  const rest = families.filter((family) => family !== leader);
  rest.splice(firstCjk, 0, leader);
  return rest;
}

function chooseFaces(
  families: ReadonlyArray<{ family: ScriptFamily; map: ScriptFamilyMap }>,
  codes: readonly number[],
): ScriptFace[] {
  const candidates = codes
    .map((code) =>
      families.flatMap(({ map }, rank) => {
        const slice = sliceOf(map, code);
        return slice === -1 ? [] : [{ rank, slice, face: map.faces[slice] }];
      }),
    )
    .filter((options) => options.length > 0)
    .sort((a, b) => a.length - b.length);

  const chosen = new Map<ScriptFace, { rank: number; slice: number }>();
  for (const options of candidates) {
    if (options.some(({ face }) => chosen.has(face))) continue;
    const [first] = options;
    chosen.set(first.face, first);
  }
  return [...chosen]
    .sort(([, a], [, b]) => a.rank - b.rank || a.slice - b.slice)
    .map(([face]) => face);
}

async function loadFamilies(
  families: readonly ScriptFamily[],
  codes: readonly number[],
): Promise<Array<{ family: ScriptFamily; map: ScriptFamilyMap }>> {
  const loaded: Array<{ family: ScriptFamily; map: ScriptFamilyMap }> = [];
  const tried = new Set<ScriptFamily>();
  let remaining = [...codes];
  while (remaining.length > 0) {
    const wave = new Set<ScriptFamily>();
    for (const code of remaining) {
      const first = families.find((family) => !tried.has(family) && inRanges(family.outline, code));
      if (first) wave.add(first);
    }
    if (wave.size === 0) break;
    for (const family of wave) tried.add(family);
    // eslint-disable-next-line no-await-in-loop
    const maps = await Promise.all(
      [...wave].map(async (family) => ({ family, map: await family.load() })),
    );
    loaded.push(...maps);
    remaining = remaining.filter((code) => maps.every(({ map }) => sliceOf(map, code) === -1));
  }
  return loaded.sort((a, b) => families.indexOf(a.family) - families.indexOf(b.family));
}

export async function resolveScriptFaces(texts: readonly string[]): Promise<ScriptFaces> {
  if (!needsFallbackFaces(texts)) return NO_SCRIPT_FACES;
  const { DEJAVU_COVERAGE, SCRIPT_FAMILIES } = await import("./script-faces");
  const codes = uncoveredCodePoints(texts, DEJAVU_COVERAGE);
  if (codes.length === 0) return NO_SCRIPT_FACES;

  const families = await loadFamilies(familyOrder(SCRIPT_FAMILIES, texts), codes);
  const faces = chooseFaces(families, codes);
  return {
    400: faces.map((face) => face[400]),
    700: faces.map((face) => face[700] ?? face[400]),
  };
}
