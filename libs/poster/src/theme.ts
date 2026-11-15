import type { CSSProperties } from "react";
import type { CodeVariant } from "./code/poster-code";
import type { PosterStyleId } from "./styles";
import type { ResolvedLayout } from "./layout";
import {
  clampNumber,
  DEFAULT_PALETTE_COUNT,
  MAX_PALETTE_COLORS,
  posterUnits,
  type AdvancedPosterDesign,
  type PaletteShape,
} from "./design";
import { posterFontFamily } from "@freetsy/fonts";

export const LAYOUT_BASE_WIDTH = 1000;
export const BODY_LINE_HEIGHT = 1.5;
export const POSTER_TOKENS = {
  trackSize: 15.5,
  trackGap: 9,
  trackColumnGap: 28,
  durationGap: 12,
  contentGap: 24,
  creditLabelSize: 11,
  creditValueSize: 12.5,
  waveHeight: 30,
  waveWidth: 5,
  waveGap: 4,
  waveBars: [0.45, 0.75, 1, 0.6, 0.35],
  brandInset: 14,
  brandPaddingY: 6,
  brandSize: 15,
  paletteIndexSize: 11,
  paletteIndexGap: 4,
  glyphWidthRatio: 0.62,
  condensedGlyphWidthRatio: 0.56,
  bodyGlyphWidthRatio: 0.55,
  estimateSafetyFactor: 1.05,
} as const;

export type PosterTheme = {
  outerPad: number;
  frameBorder: number;
  innerPad: number;
  titleSize: number;
  titleLeading: number;
  artistSize: number;
  artistGap: number;
  coverGap: number;
  qrSize: number;
  sideColumnWidth: number;
  sideGap: number;
  paletteTop: number;
  paletteWidth: number;
  paletteHeight: number;
  paletteGap: number;
  paletteShape: PaletteShape;
  paletteBarStretch: boolean;
  paletteCount: number;
  paletteNumbers: boolean;
  paletteIndexSize: number;
  paletteIndexFont?: string;
  paletteIndexColor?: string;
  eyebrow: boolean;
  uppercase: boolean;
  condensed: boolean;
  backdrop: boolean;
  backdropBlur: number;
  codeVariant: CodeVariant;
  codeColor?: string;
  paper: string;
  mat: string;
  ink: string;
  muted: string;
  titleInk?: string;
  subtitleInk?: string;
  creditInk: string;
  creditMuted: string;
  titleFont: string;
  subtitleFont: string;
  bodyFont: string;
  metadataFont: string;
  titleTracking: string;
};

const BASE: PosterTheme = {
  outerPad: 56,
  frameBorder: 0,
  innerPad: 0,
  titleSize: 54,
  titleLeading: 1.02,
  artistSize: 20,
  artistGap: 8,
  coverGap: 44,
  qrSize: 90,
  sideColumnWidth: 150,
  sideGap: 14,
  paletteTop: 22,
  paletteWidth: 26,
  paletteHeight: 12,
  paletteGap: 6,
  paletteShape: "block",
  paletteBarStretch: true,
  paletteCount: DEFAULT_PALETTE_COUNT,
  paletteNumbers: false,
  paletteIndexSize: POSTER_TOKENS.paletteIndexSize,
  eyebrow: false,
  uppercase: true,
  condensed: true,
  backdrop: false,
  backdropBlur: 15,
  codeVariant: "light",
  paper: "var(--print-paper)",
  mat: "var(--print-mat)",
  ink: "var(--print-ink)",
  muted: "var(--print-muted)",
  creditInk: "var(--primary)",
  creditMuted: "var(--secondary)",
  titleFont: "var(--font-anton)",
  subtitleFont: "var(--font-inter)",
  bodyFont: "var(--font-inter)",
  metadataFont: "var(--font-inter)",
  titleTracking: "var(--tracking-wide)",
};
const DISPLAY: Partial<PosterTheme> = {
  titleSize: 50,
  titleLeading: 1.05,
  artistSize: 22,
  artistGap: 6,
  coverGap: 36,
  qrSize: 95,
  sideColumnWidth: 155,
  uppercase: false,
  condensed: false,
  titleFont: "var(--font-archivo-black)",
  titleTracking: "var(--tracking-tight)",
};
const DARK: Partial<PosterTheme> = {
  paper: "var(--print-black)",
  mat: "var(--print-black)",
  ink: "var(--print-white)",
  muted: "var(--print-white-muted)",
  creditInk: "var(--print-white)",
  creditMuted: "var(--print-white-soft)",
  codeVariant: "dark",
};
export const POSTER_THEMES: Record<PosterStyleId, PosterTheme> = {
  classic: {
    ...BASE,
    ...DISPLAY,
    outerPad: 34,
    frameBorder: 2.5,
    innerPad: 34,
    titleSize: 52,
    artistSize: 24,
    coverGap: 38,
    qrSize: 100,
    sideColumnWidth: 168,
    sideGap: 10,
    paletteHeight: 14,
    paletteShape: "bar",
    paper: "var(--print-white)",
    mat: "var(--print-classic-mat)",
    ink: "var(--primary)",
    muted: "var(--secondary)",
  },
  gallery: { ...BASE, outerPad: 44, frameBorder: 2, innerPad: 44 },
  sand: { ...BASE, paper: "var(--print-sand)" },
  paper: { ...BASE },
  onyx: {
    ...BASE,
    ...DARK,
    paper: "var(--print-onyx)",
    ink: "var(--print-onyx-ink)",
    muted: "var(--print-onyx-muted)",
  },
  noir: {
    ...BASE,
    ...DISPLAY,
    ...DARK,
    outerPad: 36,
    sideGap: 16,
    paletteWidth: 16,
    paletteHeight: 16,
    paletteShape: "block",
  },
  mono: {
    ...BASE,
    ...DISPLAY,
    outerPad: 50,
    titleSize: 46,
    artistSize: 15,
    artistGap: 4,
    eyebrow: true,
    paletteTop: 20,
    paletteWidth: 14,
    paletteHeight: 14,
    paletteGap: 8,
    paletteShape: "circle",
    paper: "var(--print-white)",
    ink: "var(--primary)",
    muted: "var(--secondary)",
  },
  bloom: {
    ...BASE,
    ...DISPLAY,
    ...DARK,
    outerPad: 42,
    backdrop: true,
    paletteTop: 20,
    paletteWidth: 20,
    paletteHeight: 20,
    paletteGap: 14,
    paletteShape: "block",
    paletteNumbers: true,
  },
};

const posterLength = (base: number) => `${(base / LAYOUT_BASE_WIDTH) * 100}cqw`;

export function customizePosterTheme(
  theme: PosterTheme,
  design?: AdvancedPosterDesign,
): PosterTheme {
  if (!design) return theme;
  return {
    ...theme,
    outerPad: posterUnits(design.outerPad),
    innerPad: posterUnits(design.innerPad),
    coverGap: posterUnits(design.coverGap),
    titleSize: posterUnits(design.titleSize),
    artistSize: posterUnits(design.subtitleSize),
    artistGap: posterUnits(design.titleGap),
    qrSize: posterUnits(design.codeSize),
    sideColumnWidth: posterUnits(design.sideColumnWidth),
    sideGap: posterUnits(design.sideGap),
    paletteTop: posterUnits(design.paletteGap),
    paletteShape: design.paletteShape,
    paletteBarStretch: design.paletteBarStretch,
    paletteCount: clampNumber(Math.round(design.paletteCount), 0, MAX_PALETTE_COLORS),
    paletteWidth: posterUnits(design.paletteSwatchWidth),
    paletteHeight: posterUnits(design.paletteSwatchHeight),
    paletteGap: posterUnits(design.paletteSwatchGap),
    paletteNumbers: design.paletteNumbers,
    paletteIndexSize: posterUnits(design.paletteNumberSize),
    paletteIndexFont: posterFontFamily(design.paletteNumberFont),
    paletteIndexColor: design.paletteNumberColor,
    titleFont: posterFontFamily(design.titleFont),
    subtitleFont: posterFontFamily(design.subtitleFont),
    bodyFont: posterFontFamily(design.bodyFont),
    metadataFont: posterFontFamily(design.metadataFont),
    backdropBlur: posterUnits(design.backdropBlur),
    paper: design.backgroundColor,
    mat: design.backgroundColor,
    ink: design.bodyColor,
    muted: design.durationColor,
    titleInk: design.titleColor,
    subtitleInk: design.subtitleColor,
    creditInk: design.metadataLabelColor,
    creditMuted: design.metadataValueColor,
    codeColor: design.codeColor,
  };
}

export function posterCssVariables(theme: PosterTheme, layout: ResolvedLayout): CSSProperties {
  const lengths = {
    outer: layout.outerPad,
    inner: layout.innerPad,
    frame: layout.frameBorder,
    cover: layout.coverSize,
    coverGap: layout.coverGap,
    title: layout.titleSize,
    artist: layout.subtitleSize,
    artistGap: layout.titleGap,
    side: layout.sideColumnWidth,
    sideGap: layout.sideGap,
    paletteTop: layout.paletteGap,
    paletteWidth: theme.paletteWidth,
    paletteHeight: theme.paletteHeight,
    paletteGap: theme.paletteGap,
    paletteIndex: theme.paletteIndexSize,
    paletteIndexGap: POSTER_TOKENS.paletteIndexGap,
    track: layout.trackSize,
    trackGap: layout.trackGap,
    trackColumnGap: layout.trackColumnGap,
    contentGap: layout.contentGap,
    durationGap: layout.durationGap,
    creditLabel: layout.creditLabelSize,
    creditValue: layout.creditValueSize,
    waveHeight: POSTER_TOKENS.waveHeight,
    waveWidth: POSTER_TOKENS.waveWidth,
    waveGap: POSTER_TOKENS.waveGap,
    brandInset: POSTER_TOKENS.brandInset,
    brandPaddingY: POSTER_TOKENS.brandPaddingY,
    brand: POSTER_TOKENS.brandSize,
    backdropBlur: theme.backdropBlur,
  };
  const css: CSSProperties & Record<`--${string}`, string | number> = {
    ...Object.fromEntries(
      Object.entries(lengths).map(([key, value]) => [
        `--poster-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`,
        posterLength(value),
      ]),
    ),
    "--poster-paper": theme.paper,
    "--poster-mat": theme.frameBorder ? theme.mat : theme.paper,
    "--poster-ink": theme.ink,
    "--poster-muted": theme.muted,
    "--poster-title-ink": theme.titleInk ?? theme.ink,
    "--poster-subtitle-ink": theme.subtitleInk ?? theme.ink,
    "--poster-body-ink": theme.ink,
    "--poster-duration-ink": theme.muted,
    "--poster-credit-ink": theme.creditInk,
    "--poster-credit-muted": theme.creditMuted,
    "--poster-title-leading": theme.titleLeading,
    "--poster-body-leading": BODY_LINE_HEIGHT,
    "--poster-title-font": theme.titleFont,
    "--poster-subtitle-font": theme.subtitleFont,
    "--poster-body-font": theme.bodyFont,
    "--poster-metadata-font": theme.metadataFont,
    "--poster-title-tracking": theme.titleTracking,
  };
  return css;
}
