import type { PosterSpec } from "./spec";
import type { PosterStyleId } from "./styles";
import { POSTER_THEMES, POSTER_TOKENS, LAYOUT_BASE_WIDTH, BODY_LINE_HEIGHT } from "./theme";
import { clampNumber, posterUnits, type AdvancedPosterDesign } from "./design";
import { posterFontWidthRatio } from "@freetsy/fonts";
export const MIN_PAD_SCALE = 0.5;
export const MAX_PAD_SCALE = 2;
export const DEFAULT_PAD_SCALE = 1;
export type ResolvedLayout = {
  outerPad: number;
  frameBorder: number;
  innerPad: number;
  contentWidth: number;
  coverSize: number;
  coverHeight: number;
  coverGap: number;
  titleSize: number;
  subtitleSize: number;
  titleGap: number;
  titleLines: number;
  qrSize: number;
  sideColumnWidth: number;
  sideGap: number;
  paletteGap: number;
  trackSize: number;
  trackGap: number;
  trackColumnGap: number;
  contentGap: number;
  durationGap: number;
  creditLabelSize: number;
  creditValueSize: number;
};

function redistributePosterColumns(spec: PosterSpec, requested?: number): PosterSpec {
  if (requested === undefined) return spec;
  const columnCount = clampNumber(Math.round(requested), 1, 12);
  const tracks = spec.columns.flat();
  const baseLength = Math.floor(tracks.length / columnCount);
  const longerColumns = tracks.length % columnCount;
  let offset = 0;
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const length = baseLength + (index < longerColumns ? 1 : 0);
    const column = tracks.slice(offset, offset + length);
    offset += length;
    return column;
  });
  return { ...spec, columns };
}

export function customizePosterSpec(spec: PosterSpec, design?: AdvancedPosterDesign): PosterSpec {
  const distributed = redistributePosterColumns(spec, design?.columns);
  return design ? { ...distributed, palette: [...design.paletteColors] } : distributed;
}

function wrappedLines(text: string, chars: number): number {
  if (!text.trim()) return 0;
  const capacity = Math.max(1, Math.floor(chars));
  let lines = 1;
  let used = 0;
  for (const word of text.trim().split(/\s+/)) {
    if (used && used + 1 + word.length > capacity) {
      lines += 1;
      used = 0;
    }
    if (used) used += 1;
    used += word.length;
    while (used > capacity) {
      lines += 1;
      used -= capacity;
    }
  }
  return lines;
}

type LayoutMetrics = Pick<
  ResolvedLayout,
  | "outerPad"
  | "innerPad"
  | "coverGap"
  | "titleSize"
  | "subtitleSize"
  | "titleGap"
  | "qrSize"
  | "sideColumnWidth"
  | "sideGap"
  | "paletteGap"
  | "trackSize"
  | "trackGap"
  | "trackColumnGap"
  | "contentGap"
  | "durationGap"
  | "creditLabelSize"
  | "creditValueSize"
>;

function layoutMetrics(
  theme: (typeof POSTER_THEMES)[PosterStyleId],
  scale: number,
  textScale: number,
  design?: AdvancedPosterDesign,
): LayoutMetrics {
  if (design) {
    const creditValueSize = posterUnits(design.metadataSize);
    return {
      outerPad: posterUnits(design.outerPad),
      innerPad: posterUnits(design.innerPad),
      coverGap: posterUnits(design.coverGap),
      titleSize: posterUnits(design.titleSize),
      subtitleSize: posterUnits(design.subtitleSize),
      titleGap: posterUnits(design.titleGap),
      qrSize: posterUnits(design.codeSize),
      sideColumnWidth: posterUnits(design.sideColumnWidth),
      sideGap: posterUnits(design.sideGap),
      paletteGap: posterUnits(design.paletteGap),
      trackSize: posterUnits(design.bodySize),
      trackGap: posterUnits(design.rowGap),
      trackColumnGap: posterUnits(design.columnGap),
      contentGap: posterUnits(design.contentGap),
      durationGap: posterUnits(design.durationGap),
      creditValueSize,
      creditLabelSize: creditValueSize * 0.88,
    };
  }
  return {
    outerPad: theme.outerPad * scale,
    innerPad: theme.innerPad * scale,
    coverGap: theme.coverGap,
    titleSize: theme.titleSize,
    subtitleSize: theme.artistSize,
    titleGap: theme.artistGap,
    qrSize: theme.qrSize,
    sideColumnWidth: theme.sideColumnWidth,
    sideGap: theme.sideGap,
    paletteGap: theme.paletteTop,
    trackSize: POSTER_TOKENS.trackSize * textScale,
    trackGap: POSTER_TOKENS.trackGap * textScale,
    trackColumnGap: POSTER_TOKENS.trackColumnGap,
    contentGap: POSTER_TOKENS.contentGap,
    durationGap: POSTER_TOKENS.durationGap,
    creditValueSize: POSTER_TOKENS.creditValueSize,
    creditLabelSize: POSTER_TOKENS.creditLabelSize,
  };
}

export function resolveLayout({
  spec,
  style,
  widthMm,
  heightMm,
  padScale = DEFAULT_PAD_SCALE,
  textScale = 1,
  showPalette = true,
  advancedDesign,
}: {
  spec: PosterSpec;
  style: PosterStyleId;
  widthMm: number;
  heightMm: number;
  padScale?: number;
  textScale?: number;
  showPalette?: boolean;
  advancedDesign?: AdvancedPosterDesign;
}): ResolvedLayout {
  const theme = POSTER_THEMES[style];
  const token = POSTER_TOKENS;
  const scale = Math.min(MAX_PAD_SCALE, Math.max(MIN_PAD_SCALE, padScale));
  const metrics = layoutMetrics(theme, scale, textScale, advancedDesign);
  const {
    outerPad,
    innerPad,
    coverGap,
    titleSize,
    subtitleSize,
    titleGap,
    qrSize,
    sideColumnWidth,
    sideGap,
    paletteGap,
    trackSize,
    trackGap,
    trackColumnGap,
    contentGap,
    durationGap,
    creditValueSize,
    creditLabelSize,
  } = metrics;
  const inset = outerPad + innerPad + theme.frameBorder;
  const contentWidth = LAYOUT_BASE_WIDTH - 2 * inset;
  const available = LAYOUT_BASE_WIDTH * (heightMm / widthMm) - 2 * inset;
  const columns = Math.max(1, spec.columns.length);
  const columnWidth =
    (contentWidth - sideColumnWidth - contentGap - trackColumnGap * (columns - 1)) / columns;
  const bodyWidthRatio = advancedDesign
    ? posterFontWidthRatio(advancedDesign.bodyFont)
    : token.bodyGlyphWidthRatio;
  const trackWidth = trackSize * bodyWidthRatio;
  const trackHeight = Math.max(
    0,
    ...spec.columns.map((column) => {
      const lines = column.reduce((sum, track) => {
        const durationWidth = track.durationLabel
          ? durationGap + track.durationLabel.length * trackWidth
          : 0;
        return (
          sum +
          wrappedLines(
            `${spec.numbered ? `${track.numberLabel}. ` : ""}${track.name}`,
            (columnWidth - durationWidth) / trackWidth,
          )
        );
      }, 0);
      return lines * trackSize * BODY_LINE_HEIGHT + Math.max(0, column.length - 1) * trackGap;
    }),
  );
  const titleLines = wrappedLines(
    spec.title,
    contentWidth /
      (titleSize *
        (advancedDesign
          ? posterFontWidthRatio(advancedDesign.titleFont)
          : theme.condensed
            ? token.condensedGlyphWidthRatio
            : token.glyphWidthRatio)),
  );
  const artistLines = wrappedLines(
    spec.artist,
    contentWidth /
      (subtitleSize *
        (advancedDesign
          ? posterFontWidthRatio(advancedDesign.subtitleFont)
          : token.bodyGlyphWidthRatio)),
  );
  const swatchHeight = advancedDesign
    ? posterUnits(advancedDesign.paletteSwatchHeight)
    : theme.paletteHeight;
  const numbered = advancedDesign ? advancedDesign.paletteNumbers : theme.paletteNumbers;
  const indexSize = advancedDesign
    ? posterUnits(advancedDesign.paletteNumberSize)
    : theme.paletteIndexSize;
  const paletteHeight = showPalette
    ? paletteGap +
      swatchHeight +
      (numbered ? token.paletteIndexGap + indexSize * BODY_LINE_HEIGHT : 0)
    : 0;
  const headerHeight =
    coverGap +
    titleSize * theme.titleLeading * titleLines +
    (artistLines > 0 ? titleGap + subtitleSize * BODY_LINE_HEIGHT * artistLines : 0) +
    paletteHeight;
  const fixedCredits = [
    spec.releaseDate,
    spec.totalDurationMs || spec.pageCount,
    spec.recordLabel,
  ].filter(Boolean).length;
  const extraCredits = spec.extraCredits ?? [];
  const creditChars = (size: number) => sideColumnWidth / (size * token.bodyGlyphWidthRatio);
  const extraCreditHeight = extraCredits.reduce(
    (sum, credit) =>
      sum +
      (Math.max(1, wrappedLines(credit.label, creditChars(creditLabelSize))) * creditLabelSize +
        Math.max(1, wrappedLines(credit.value, creditChars(creditValueSize))) * creditValueSize) *
        BODY_LINE_HEIGHT,
    0,
  );
  const creditCount = fixedCredits + extraCredits.length;
  const sideHeight =
    token.waveHeight +
    qrSize +
    sideGap * (creditCount + 1) +
    fixedCredits * (creditLabelSize + creditValueSize) * BODY_LINE_HEIGHT +
    extraCreditHeight;
  const textHeight =
    (headerHeight + contentGap + Math.max(trackHeight, sideHeight)) * token.estimateSafetyFactor;
  const aspect = spec.coverAspect && spec.coverAspect > 0 ? spec.coverAspect : 1;
  const coverSize = advancedDesign
    ? clampNumber(posterUnits(advancedDesign.coverSize), 0, contentWidth)
    : Math.max(0, Math.min(contentWidth, (available - textHeight) * aspect));
  const coverHeight = coverSize / aspect;
  return {
    outerPad,
    innerPad,
    frameBorder: theme.frameBorder,
    contentWidth,
    coverSize,
    coverHeight,
    coverGap,
    titleSize,
    subtitleSize,
    titleGap,
    titleLines,
    qrSize,
    sideColumnWidth,
    sideGap,
    paletteGap,
    trackSize,
    trackGap,
    trackColumnGap,
    contentGap,
    durationGap,
    creditLabelSize,
    creditValueSize,
  };
}
