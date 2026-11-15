import type { ResolvedLayout } from "./layout";
import type { PosterTheme } from "./theme";
import type { PosterFontId } from "@freetsy/fonts";

export const MAX_PALETTE_COLORS = 10;
export const DEFAULT_PALETTE_COUNT = 5;

export const PALETTE_SHAPES = ["bar", "block", "round", "circle"] as const;
export type PaletteShape = (typeof PALETTE_SHAPES)[number];

export type AdvancedPosterDesign = {
  outerPad: number;
  innerPad: number;
  coverSize: number;
  coverGap: number;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  metadataSize: number;
  titleGap: number;
  paletteGap: number;
  contentGap: number;
  columnGap: number;
  rowGap: number;
  sideGap: number;
  durationGap: number;
  codeSize: number;
  sideColumnWidth: number;
  columns: number;
  backdropBlur: number;
  titleFont: PosterFontId;
  subtitleFont: PosterFontId;
  bodyFont: PosterFontId;
  metadataFont: PosterFontId;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  bodyColor: string;
  durationColor: string;
  metadataLabelColor: string;
  metadataValueColor: string;
  codeColor: string;
  paletteCount: number;
  paletteShape: PaletteShape;
  paletteBarStretch: boolean;
  paletteSwatchWidth: number;
  paletteSwatchHeight: number;
  paletteSwatchLinked: boolean;
  paletteSwatchGap: number;
  paletteNumbers: boolean;
  paletteNumberSize: number;
  paletteNumberFont: PosterFontId;
  paletteNumberColor: string;
  paletteColors: string[];
};

const COLOR_VALUES: Record<string, string> = {
  "var(--print-paper)": "#fbf9f5",
  "var(--print-mat)": "#ded5c4",
  "var(--print-classic-mat)": "#f4f1ea",
  "var(--print-ink)": "#2c2822",
  "var(--print-muted)": "#9a9182",
  "var(--print-sand)": "#e4dac7",
  "var(--print-onyx)": "#1a1917",
  "var(--print-onyx-ink)": "#f2efe8",
  "var(--print-onyx-muted)": "#797774",
  "var(--print-black)": "#000000",
  "var(--print-white)": "#ffffff",
  "var(--print-white-muted)": "#8c8c8c",
  "var(--print-white-soft)": "#b3b3b3",
  "var(--primary)": "#16140f",
  "var(--secondary)": "#4a4638",
};

export const posterUnits = (percent: number) => finiteNumber(percent, 0) * 10;

function posterColor(value: string, fallback: string): string {
  return COLOR_VALUES[value] ?? (value.startsWith("#") ? value : fallback);
}

const PALETTE_FALLBACK = ["#f2efe8", "#b3b3b3", "#797774", "#4a4638", "#16140f"];

function presetPalette(colors: string[]): string[] {
  return Array.from(
    { length: MAX_PALETTE_COLORS },
    (_, index) =>
      colors[index] ?? colors.at(-1) ?? PALETTE_FALLBACK[index % PALETTE_FALLBACK.length],
  );
}

function finiteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, finiteNumber(value, min)));
}

const PRESET_FONT_IDS: Record<string, PosterFontId> = {
  "var(--font-anton)": "anton",
  "var(--font-archivo-black)": "archivo",
  "var(--font-inter)": "inter",
  "var(--font-mono-ui-family)": "mono",
};

function fontId(family: string): PosterFontId {
  return PRESET_FONT_IDS[family] ?? "archivo";
}

export function posterDesignFontIds(
  theme: PosterTheme,
  design?: AdvancedPosterDesign,
): PosterFontId[] {
  return design
    ? [
        design.titleFont,
        design.subtitleFont,
        design.bodyFont,
        design.metadataFont,
        design.paletteNumberFont,
      ]
    : [
        theme.titleFont,
        theme.subtitleFont,
        theme.bodyFont,
        theme.metadataFont,
        theme.paletteIndexFont ?? theme.bodyFont,
      ].map(fontId);
}

export function advancedDesignFromPreset(
  theme: PosterTheme,
  layout: ResolvedLayout,
  columns: number,
  palette: string[] = [],
): AdvancedPosterDesign {
  return {
    outerPad: layout.outerPad / 10,
    innerPad: layout.innerPad / 10,
    coverSize: layout.coverSize / 10,
    coverGap: theme.coverGap / 10,
    titleSize: theme.titleSize / 10,
    subtitleSize: theme.artistSize / 10,
    bodySize: layout.trackSize / 10,
    metadataSize: layout.creditValueSize / 10,
    titleGap: theme.artistGap / 10,
    paletteGap: theme.paletteTop / 10,
    contentGap: layout.contentGap / 10,
    columnGap: layout.trackColumnGap / 10,
    rowGap: layout.trackGap / 10,
    sideGap: theme.sideGap / 10,
    durationGap: layout.durationGap / 10,
    codeSize: theme.qrSize / 10,
    sideColumnWidth: theme.sideColumnWidth / 10,
    columns: Math.max(1, columns),
    backdropBlur: theme.backdropBlur / 10,
    titleFont: fontId(theme.titleFont),
    subtitleFont: fontId(theme.subtitleFont),
    bodyFont: fontId(theme.bodyFont),
    metadataFont: fontId(theme.metadataFont),
    backgroundColor: posterColor(theme.paper, "#fbf9f5"),
    titleColor: posterColor(theme.ink, "#16140f"),
    subtitleColor: posterColor(theme.ink, "#16140f"),
    bodyColor: posterColor(theme.ink, "#16140f"),
    durationColor: posterColor(theme.muted, "#4a4638"),
    metadataLabelColor: posterColor(theme.creditInk, "#16140f"),
    metadataValueColor: posterColor(theme.creditMuted, "#4a4638"),
    codeColor: theme.codeVariant === "dark" ? "#ffffff" : "#000000",
    paletteCount: theme.paletteCount,
    paletteShape: theme.paletteShape,
    paletteBarStretch: theme.paletteBarStretch,
    paletteSwatchWidth: theme.paletteWidth / 10,
    paletteSwatchHeight: theme.paletteHeight / 10,
    paletteSwatchLinked: theme.paletteWidth === theme.paletteHeight,
    paletteSwatchGap: theme.paletteGap / 10,
    paletteNumbers: theme.paletteNumbers,
    paletteNumberSize: theme.paletteIndexSize / 10,
    paletteNumberFont: fontId(theme.paletteIndexFont ?? theme.bodyFont),
    paletteNumberColor: posterColor(theme.paletteIndexColor ?? theme.muted, "#4a4638"),
    paletteColors: presetPalette(palette),
  };
}
