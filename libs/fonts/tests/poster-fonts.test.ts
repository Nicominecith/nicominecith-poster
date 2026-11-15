import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { needsFallbackFaces, POSTER_FONT_COMMON_COVERAGE } from "../src/coverage";
import { codePoints } from "./cmap";

const FONT_DIR = path.join(import.meta.dirname, "../assets");

function ranges(codes: Iterable<number>): Array<[number, number]> {
  const sorted = [...codes].sort((a, b) => a - b);
  const out: Array<[number, number]> = [];
  for (const code of sorted) {
    const last = out.at(-1);
    if (last && code === last[1] + 1) last[1] = code;
    else out.push([code, code]);
  }
  return out;
}

const familyFiles = readdirSync(FONT_DIR)
  .filter((name) => name.endsWith(".ttf") && !name.endsWith(".fallback.ttf"))
  .sort();

void test("the declared common coverage is exactly what every poster family carries", () => {
  assert.ok(familyFiles.length > 0);
  const common = familyFiles
    .map((name) => codePoints(readFileSync(path.join(FONT_DIR, name))))
    .reduce((all, one) => new Set([...all].filter((code) => one.has(code))));

  assert.deepEqual(
    ranges(common),
    POSTER_FONT_COMMON_COVERAGE.map(([start, end]) => [start, end]),
  );
});

void test("the fallback faces cover the scripts and symbols the families do not", () => {
  const chains = {
    sans: ["DejaVuSans"],
    serif: ["DejaVuSerif", "DejaVuSans"],
    mono: ["DejaVuSansMono", "DejaVuSans"],
  };
  const probes = ["Łódź", "Ağrı", "Dvořák", "Ωμέγα", "Пикник", "Đặng", "★☆♥♪→∞"];

  for (const [category, faces] of Object.entries(chains)) {
    for (const weight of ["", "-Bold"]) {
      const covered = faces
        .map((face) =>
          codePoints(readFileSync(path.join(FONT_DIR, `${face}${weight}.fallback.ttf`))),
        )
        .reduce((all, one) => new Set([...all, ...one]));
      for (const char of probes.join("")) {
        assert.ok(
          covered.has(char.codePointAt(0) ?? 0),
          `the ${category}${weight} fallback chain has no glyph for ${char}`,
        );
      }
    }
  }
});

void test("only text a bundled family cannot set asks for a fallback face", () => {
  for (const text of [
    "Rumours",
    "Bläck Fööss",
    "Sigur Rós — Ágætis byrjun",
    "Édith Piaf",
    "Straße",
    "Motörhead (No Sleep 'til Hammersmith)",
  ])
    assert.equal(needsFallbackFaces([text]), false, text);

  for (const text of ["Łódź", "Ağrı", "Dvořák", "Пикник", "Ωμέγα", "Đặng", "★ Hits ★", "日本"])
    assert.equal(needsFallbackFaces([text]), true, text);

  assert.equal(needsFallbackFaces(["ǳena"]), true);
});

void test("a decomposed umlaut is composed before it is measured for coverage", () => {
  const decomposed = "Bjo\u0308rk";
  assert.equal(needsFallbackFaces([decomposed]), true);
  assert.equal(needsFallbackFaces([decomposed.normalize("NFC")]), false);
  assert.equal(decomposed.normalize("NFC"), "Björk");
});
