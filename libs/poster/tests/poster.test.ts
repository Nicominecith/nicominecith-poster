import { test } from "node:test";
import assert from "node:assert/strict";
import { FormApi, FieldApi } from "@tanstack/react-form";
import {
  albumContent,
  contentAlbumDetail,
  isValidDuration,
  isValidReleaseDate,
} from "../src/album/content";
import type { AlbumDetail } from "../src/album/types";
import { editableContent } from "../src/content";
import { resolveSize, isValidCustomMm, MAX_CUSTOM_MM, SOCIAL_FORMAT_ID } from "../src/formats";
import { hasValidPosterInput, POSTER_FORM_DEFAULTS } from "../src/form";
import { contentTextInfo, buildPosterSpec } from "../src/spec";
import { customizePosterSpec, resolveLayout } from "../src/layout";
import {
  customizePosterTheme,
  POSTER_THEMES,
  POSTER_TOKENS,
  posterCssVariables,
} from "../src/theme";
import { POSTER_STYLES } from "../src/styles";
import { posterFontFamily } from "@freetsy/fonts";
import { pixelUnder, toHexColor } from "../src/color-sample";
import { advancedDesignFromPreset, MAX_PALETTE_COLORS, posterDesignFontIds } from "../src/design";

const album: AlbumDetail = {
  id: "fixture",
  source: "itunes",
  name: "Album",
  artist: "Artist",
  releaseDate: "2007-10",
  releaseDatePrecision: "month",
  sourceUrl: "https://example.com/album",
  recordLabel: "",
  numbered: true,
  tracks: Array.from({ length: 10 }, (_, index) => ({
    number: index + 1,
    name: `Track ${index + 1}`,
    durationMs: 176_600,
  })),
  totalDurationMs: 1_766_000,
};

void test("prefilling preserves the exact total and printed minute count", () => {
  const content = editableContent(albumContent(album));
  const result = contentAlbumDetail(content);
  assert.equal(result.totalDurationMs, album.totalDurationMs);
  assert.equal(Math.round(result.totalDurationMs / 60_000), 29);
  assert.equal(result.releaseDatePrecision, "month");
  assert.equal(result.sourceUrl, album.sourceUrl);
});

void test("editing a title preserves precision; editing a duration uses the new value", () => {
  const content = editableContent(albumContent(album));
  content.tracks[0].title = "Renamed";
  assert.equal(contentAlbumDetail(content).tracks[0].durationMs, 176_600);
  content.tracks[0].duration = "4:00";
  assert.equal(contentAlbumDetail(content).tracks[0].durationMs, 240_000);
});

void test("a track emphasis reaches the printable poster row", () => {
  const content = editableContent(albumContent(album));
  content.tracks[0].emphasized = true;
  assert.equal(contentTextInfo(content).columns[0][0].emphasized, true);
  assert.equal(contentTextInfo(content).columns[0][1].emphasized, false);
});

void test("manual and prefilled content go through the same printable mapping", () => {
  const content = editableContent(albumContent(album));
  const manual = {
    ...content,
    tracks: content.tracks.map((track) => ({ title: track.title, duration: track.duration })),
  };
  assert.deepEqual(contentTextInfo(content).columns, contentTextInfo(manual).columns);
  assert.equal(contentTextInfo({ ...content, format: "freeform" }).numbered, false);
});

void test("invalid dimensions cannot be exported, even if a field is unmounted", () => {
  for (const value of ["", 0, 20, 1001, Number.NaN, Number.POSITIVE_INFINITY] as const) {
    assert.equal(isValidCustomMm(value), false);
    assert.equal(
      hasValidPosterInput({ ...POSTER_FORM_DEFAULTS, formatId: "custom", customWidthMm: value }),
      false,
    );
    const size = resolveSize({ formatId: "custom", customWidthMm: value });
    assert.ok(Number.isFinite(size.widthMm) && size.widthMm >= 50 && size.widthMm <= 1000);
  }
});

void test("print formats retain the requested resolution", () => {
  const a1 = resolveSize({ formatId: "a1", dpi: 600 });
  assert.equal(a1.widthPx, 14031);
  assert.equal(a1.heightPx, 19866);
  assert.equal(a1.effectiveDpi, 600);
  const largest = resolveSize({
    formatId: "custom",
    dpi: 600,
    customWidthMm: MAX_CUSTOM_MM,
    customHeightMm: MAX_CUSTOM_MM,
  });
  assert.equal(largest.effectiveDpi, 600);
  const social = resolveSize({ formatId: SOCIAL_FORMAT_ID, dpi: 600 });
  assert.equal(social.widthPx, 1080);
  assert.equal(social.heightPx, 1920);
});

void test("optional dates and durations distinguish empty from invalid input", () => {
  for (const date of ["", "2007", "2007-10", "10.10.2007", "2024-02-29"])
    assert.equal(isValidReleaseDate(date), true);
  for (const date of ["2025-02-31", "2025-13", "not a date"])
    assert.equal(isValidReleaseDate(date), false);
  for (const duration of ["", "0:00", "3:45", "100:00", "1:02:30"])
    assert.equal(isValidDuration(duration), true);
  for (const duration of ["3:99", "1:99:00", "oops"])
    assert.equal(isValidDuration(duration), false);
});

void test("every style uses the same typography tokens for layout and CSS", () => {
  const spec = buildPosterSpec(contentTextInfo(albumContent(album)), "test-cover", []);
  for (const { id } of POSTER_STYLES) {
    const layout = resolveLayout({ spec, style: id, widthMm: 210, heightMm: 297 });
    assert.equal(layout.trackSize, POSTER_TOKENS.trackSize);
    const css = posterCssVariables(POSTER_THEMES[id], layout);
    assert.ok(JSON.stringify(css).includes("--poster-track"));
  }
});

void test("advanced design values drive layout, fonts, and balanced columns", () => {
  const spec = buildPosterSpec(contentTextInfo(albumContent(album)), "test-cover", []);
  const design = {
    ...POSTER_FORM_DEFAULTS.advancedDesign,
    coverSize: 50,
    titleSize: 8,
    bodySize: 2,
    columns: 3,
    titleFont: "anton" as const,
    metadataFont: "mono" as const,
    backgroundColor: "#123456",
    titleColor: "#abcdef",
    paletteColors: ["#111111", "#222222", "#333333", "#444444", "#555555"],
  };
  const distributed = customizePosterSpec(spec, design);
  assert.deepEqual(
    distributed.columns.map((column) => column.length),
    [4, 3, 3],
  );
  assert.deepEqual(distributed.palette, design.paletteColors);
  const layout = resolveLayout({
    spec: distributed,
    style: "bloom",
    widthMm: 210,
    heightMm: 297,
    advancedDesign: design,
  });
  assert.equal(layout.coverSize, 500);
  assert.equal(layout.titleSize, 80);
  assert.equal(layout.trackSize, 20);
  const theme = customizePosterTheme(POSTER_THEMES.bloom, design);
  assert.equal(theme.backdrop, true);
  assert.equal(theme.paper, design.backgroundColor);
  const css = Object.fromEntries(Object.entries(posterCssVariables(theme, layout)));
  assert.equal(css["--poster-cover"], "50cqw");
  assert.equal(css["--poster-title-font"], posterFontFamily("anton"));
  assert.equal(css["--poster-metadata-font"], posterFontFamily("mono"));
  assert.equal(css["--poster-title-ink"], design.titleColor);
});

void test("the palette's count, shape and numbering carry from a style into custom editing", () => {
  const cover = Array.from({ length: MAX_PALETTE_COLORS }, (_, index) => `#0000${index}${index}`);
  const spec = buildPosterSpec(contentTextInfo(albumContent(album)), "test-cover", cover);
  for (const { id } of POSTER_STYLES) {
    const theme = POSTER_THEMES[id];
    const layout = resolveLayout({ spec, style: id, widthMm: 210, heightMm: 297 });
    const design = advancedDesignFromPreset(theme, layout, spec.columns.length, spec.palette);
    assert.equal(design.paletteColors.length, MAX_PALETTE_COLORS);
    assert.deepEqual(design.paletteColors, cover);
    const custom = customizePosterTheme(theme, design);
    assert.equal(custom.paletteShape, theme.paletteShape);
    assert.equal(custom.paletteBarStretch, theme.paletteBarStretch);
    assert.equal(
      design.paletteSwatchLinked,
      design.paletteSwatchWidth === design.paletteSwatchHeight,
    );
    assert.equal(custom.paletteCount, theme.paletteCount);
    assert.equal(custom.paletteNumbers, theme.paletteNumbers);
    assert.equal(custom.paletteWidth, theme.paletteWidth);
    assert.equal(custom.paletteHeight, theme.paletteHeight);
    assert.equal(custom.paletteGap, theme.paletteGap);
    assert.equal(custom.paletteIndexSize, theme.paletteIndexSize);
    assert.ok(posterDesignFontIds(theme, design).includes(design.paletteNumberFont));
  }
  const numbered = POSTER_STYLES.filter(({ id }) => POSTER_THEMES[id].paletteNumbers);
  assert.deepEqual(
    numbered.map(({ id }) => id),
    ["bloom"],
  );
});

void test("a raised swatch count leaves room for itself in the layout budget", () => {
  const spec = buildPosterSpec(contentTextInfo(albumContent(album)), "test-cover", []);
  const design = { ...POSTER_FORM_DEFAULTS.advancedDesign, paletteNumbers: false };
  const size = { spec, style: "bloom", widthMm: 210, heightMm: 297 } as const;
  const plain = resolveLayout({ ...size, advancedDesign: design });
  const withNumbers = resolveLayout({
    ...size,
    advancedDesign: { ...design, paletteNumbers: true },
  });
  assert.equal(plain.coverSize, withNumbers.coverSize);
  const presetPlain = resolveLayout({ ...size, showPalette: false });
  const presetPalette = resolveLayout({ ...size, showPalette: true });
  assert.ok(presetPalette.coverSize < presetPlain.coverSize);
});

void test("TanStack prefills survive default updates and reset restores the current default", () => {
  const form = new FormApi({ defaultValues: { title: "" } });
  const disposeForm = form.mount();
  const field = new FieldApi({ form, name: "title", defaultValue: "Sample" });
  const disposeField = field.mount();
  form.setFieldValue("title", "Imported");
  field.update({ form, name: "title", defaultValue: "Beispiel" });
  assert.equal(form.state.values.title, "Imported");
  form.resetField("title");
  assert.equal(form.state.values.title, "Beispiel");
  disposeField();
  disposeForm();
});

void test("a pixel picked off the preview maps to the poster and reads back as a hex color", () => {
  assert.equal(pixelUnder(0, 600, 900), 0);
  assert.equal(pixelUnder(300, 600, 900), 450);
  assert.equal(pixelUnder(600, 600, 900), 899);
  assert.equal(pixelUnder(-5, 600, 900), 0);
  assert.equal(pixelUnder(120, 0, 900), 0);
  assert.equal(toHexColor(0, 0, 0), "#000000");
  assert.equal(toHexColor(255, 255, 255), "#ffffff");
  assert.equal(toHexColor(22, 20, 15), "#16140f");
  assert.equal(toHexColor(-1, 300, Number.NaN), "#00ff00");
});
