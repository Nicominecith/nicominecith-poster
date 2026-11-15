import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { cn } from "@freetsy/ui/lib/utils";

void test("print font sizes and frame widths survive merging with color utilities", () => {
  for (const [size, color] of [
    ["text-poster-credit-label", "text-poster-credit-ink"],
    ["text-poster-credit-value", "text-poster-credit-muted"],
    ["text-poster-palette-index", "text-poster-muted"],
    ["text-poster-brand", "text-print-brand-ink"],
    ["border-poster-frame", "border-poster-ink"],
  ])
    assert.equal(cn(size, color), `${size} ${color}`);
  assert.equal(cn("text-poster-title", "text-poster-track"), "text-poster-track");
});

void test("component styling uses named tokens instead of literal print colors and dimensions", () => {
  const root = path.join(import.meta.dirname, "../src");
  const files = readdirSync(root, { recursive: true, encoding: "utf8" }).filter((file) =>
    file.endsWith(".tsx"),
  );
  const literalStyle =
    /(?:bg|text|border|shadow)-\[(?:#|rgba)|\b\d+(?:\.\d+)?cqw\b|(?:min-h|grid-cols)-\[[^\]]*(?:vh|px)/;
  for (const file of files)
    assert.equal(
      literalStyle.test(readFileSync(path.join(root, file), "utf8")),
      false,
      `${file}: use a named style token`,
    );
});
