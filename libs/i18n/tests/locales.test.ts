import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { de } from "../src/resources";
import { en } from "../src/english";

const LOCALES = join(import.meta.dirname, "..", "locales");

const files = (language: string): string[] => readdirSync(join(LOCALES, language)).sort();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const load = (language: string, file: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(readFileSync(join(LOCALES, language, file), "utf8"));
  assert.ok(isRecord(parsed), file);
  return parsed;
};

const shape = (value: unknown): unknown => {
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return value.map(shape);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, shape(entry)]),
    );
  }
  return typeof value;
};

const strings = (value: unknown, path = ""): Array<[string, string]> => {
  if (typeof value === "string") return [[path, value]];
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      strings(entry, path ? `${path}.${key}` : key),
    );
  }
  return [];
};

const tokens = (text: string, pattern: RegExp): string[] =>
  [...text.matchAll(pattern)].map((match) => match[0]).sort();

const PLACEHOLDER = /\{\{[^}]+\}\}/g;
const TAG = /<\/?[a-zA-Z0-9]+\s*\/?>/g;

void test("both languages ship the same locale files", () => {
  assert.deepEqual(files("en"), files("de"));
  assert.ok(files("de").length > 0);
});

void test("every locale file has the same keys in both languages", () => {
  for (const file of files("de")) {
    assert.deepEqual(shape(load("en", file)), shape(load("de", file)), file);
  }
});

void test("no section is split or duplicated across files", () => {
  const sections = files("de").flatMap((file) => Object.keys(load("de", file)));
  assert.equal(new Set(sections).size, sections.length);
  assert.deepEqual([...sections].sort(), Object.keys(de).sort());
});

void test("the merged resources are exactly the locale files", () => {
  const merge = (language: string) =>
    Object.assign({}, ...files(language).map((file) => load(language, file))) as unknown;
  assert.deepEqual(de, merge("de"));
  assert.deepEqual(en, merge("en"));
});

void test("english keeps every placeholder and tag of the german original", () => {
  for (const file of files("de")) {
    const english = new Map(strings(load("en", file)));
    for (const [path, german] of strings(load("de", file))) {
      const translation = english.get(path) ?? "";
      assert.deepEqual(tokens(translation, PLACEHOLDER), tokens(german, PLACEHOLDER), path);
      assert.deepEqual(tokens(translation, TAG), tokens(german, TAG), path);
    }
  }
});
