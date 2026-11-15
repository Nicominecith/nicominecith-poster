import { MAX_PALETTE_COLORS, type AdvancedPosterDesign, type PosterSpec } from "@freetsy/poster";

type MetricRange = { min: number; max: number; step: number; unit?: "%" };

const PERCENT = "%";

export const METRIC_RANGES = {
  coverSize: { min: 10, max: 100, step: 0.5, unit: PERCENT },
  codeSize: { min: 0, max: 30, step: 0.5, unit: PERCENT },
  sideColumnWidth: { min: 0, max: 40, step: 0.5, unit: PERCENT },
  columns: { min: 1, max: 4, step: 1 },
  titleSize: { min: 0.5, max: 20, step: 0.1, unit: PERCENT },
  subtitleSize: { min: 0.5, max: 10, step: 0.1, unit: PERCENT },
  bodySize: { min: 0.3, max: 8, step: 0.05, unit: PERCENT },
  metadataSize: { min: 0.3, max: 8, step: 0.05, unit: PERCENT },
  innerPad: { min: 0, max: 20, step: 0.1, unit: PERCENT },
  coverGap: { min: 0, max: 20, step: 0.1, unit: PERCENT },
  titleGap: { min: 0, max: 10, step: 0.1, unit: PERCENT },
  paletteGap: { min: 0, max: 10, step: 0.1, unit: PERCENT },
  contentGap: { min: 0, max: 20, step: 0.1, unit: PERCENT },
  columnGap: { min: 0, max: 20, step: 0.1, unit: PERCENT },
  rowGap: { min: 0, max: 10, step: 0.1, unit: PERCENT },
  sideGap: { min: 0, max: 10, step: 0.1, unit: PERCENT },
  backdropBlur: { min: 0, max: 8, step: 0.1, unit: PERCENT },
  paletteCount: { min: 1, max: MAX_PALETTE_COLORS, step: 1 },
  paletteSwatchWidth: { min: 0.2, max: 10, step: 0.1, unit: PERCENT },
  paletteSwatchHeight: { min: 0.2, max: 10, step: 0.1, unit: PERCENT },
  paletteSwatchGap: { min: 0, max: 5, step: 0.1, unit: PERCENT },
  paletteNumberSize: { min: 0.3, max: 5, step: 0.05, unit: PERCENT },
} as const satisfies Partial<Record<keyof AdvancedPosterDesign, MetricRange>>;

export type MetricKey = keyof typeof METRIC_RANGES;

export type ColorKey = {
  [Key in keyof AdvancedPosterDesign]: Key extends `${string}Color` ? Key : never;
}[keyof AdvancedPosterDesign];

type DesignContent = {
  hasRows: boolean;
  hasManyRows: boolean;
  hasDetails: boolean;
  hasMetadata: boolean;
  hasSubtitle: boolean;
  hasCode: boolean;
  hasSideContent: boolean;
  hasSeveralSideItems: boolean;
  hasColumns: boolean;
  showPalette: boolean;
};

export function designContent({
  spec,
  design,
  hasCode,
  showPalette,
}: {
  spec: PosterSpec;
  design: AdvancedPosterDesign;
  hasCode: boolean;
  showPalette: boolean;
}): DesignContent {
  const rows = spec.columns.flat();
  const creditCount = [spec.releaseDate, spec.totalDurationMs, spec.recordLabel].filter(
    Boolean,
  ).length;
  const codeItems = hasCode ? (spec.numbered ? 2 : 1) : 0;
  const hasRows = rows.length > 0;
  return {
    hasRows,
    hasManyRows: rows.length > 1,
    hasDetails: rows.some((row) => row.durationLabel),
    hasMetadata: creditCount > 0,
    hasSubtitle: Boolean(spec.artist.trim()),
    hasCode,
    hasSideContent: hasCode || creditCount > 0,
    hasSeveralSideItems: creditCount + codeItems > 1,
    hasColumns: hasRows && design.columns > 1,
    showPalette,
  };
}

function shown<Key extends string>(entries: ReadonlyArray<readonly [Key, boolean]>): Key[] {
  return entries.filter(([, visible]) => visible).map(([key]) => key);
}

export const designSections = (content: DesignContent) => ({
  sizes: shown<MetricKey>([
    ["coverSize", true],
    ["codeSize", content.hasCode],
    ["sideColumnWidth", content.hasSideContent],
    ["columns", content.hasRows],
  ]),
  typography: shown<MetricKey>([
    ["titleSize", true],
    ["subtitleSize", content.hasSubtitle],
    ["bodySize", content.hasRows],
    ["metadataSize", content.hasMetadata],
  ]),
  spacing: shown<MetricKey>([
    ["innerPad", true],
    ["coverGap", true],
    ["titleGap", true],
    ["paletteGap", content.showPalette],
    ["contentGap", content.hasRows || content.hasSideContent],
    ["columnGap", content.hasColumns],
    ["rowGap", content.hasManyRows],
    ["sideGap", content.hasSeveralSideItems],
  ]),
  textColors: shown<ColorKey>([
    ["titleColor", true],
    ["subtitleColor", content.hasSubtitle],
    ["bodyColor", content.hasRows],
    ["durationColor", content.hasDetails],
    ["metadataLabelColor", content.hasMetadata],
    ["metadataValueColor", content.hasMetadata],
  ]),
});
