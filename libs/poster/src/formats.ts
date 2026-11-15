export const SOCIAL_FORMAT_ID = "social";

export type PosterFormatId =
  | typeof SOCIAL_FORMAT_ID
  | "a5"
  | "a4"
  | "a3"
  | "a2"
  | "a1"
  | "letter"
  | "legal"
  | "5x7"
  | "8x10"
  | "11x14"
  | "12x18"
  | "square30"
  | "custom";

type PosterFormat = {
  id: PosterFormatId;
  widthMm: number;
  heightMm: number;
  pixelWidth?: number;
  pixelHeight?: number;
};

const SOCIAL_FORMAT: PosterFormat = {
  id: SOCIAL_FORMAT_ID,
  widthMm: 91.44,
  heightMm: 162.56,
  pixelWidth: 1080,
  pixelHeight: 1920,
};

export const POSTER_FORMATS: PosterFormat[] = [
  SOCIAL_FORMAT,
  { id: "a5", widthMm: 148, heightMm: 210 },
  { id: "a4", widthMm: 210, heightMm: 297 },
  { id: "a3", widthMm: 297, heightMm: 420 },
  { id: "a2", widthMm: 420, heightMm: 594 },
  { id: "a1", widthMm: 594, heightMm: 841 },
  { id: "letter", widthMm: 215.9, heightMm: 279.4 },
  { id: "legal", widthMm: 215.9, heightMm: 355.6 },
  { id: "5x7", widthMm: 127, heightMm: 178 },
  { id: "8x10", widthMm: 203.2, heightMm: 254 },
  { id: "11x14", widthMm: 279.4, heightMm: 355.6 },
  { id: "12x18", widthMm: 304.8, heightMm: 457.2 },
  { id: "square30", widthMm: 300, heightMm: 300 },
  { id: "custom", widthMm: 210, heightMm: 297 },
];

export const DEFAULT_FORMAT_ID: PosterFormatId = SOCIAL_FORMAT.id;

export type ExportFormatId = "pdf" | "jpg";

export const EXPORT_FORMATS: ExportFormatId[] = ["pdf", "jpg"];

export const DEFAULT_EXPORT_FORMAT: ExportFormatId = "jpg";

export const DPI_OPTIONS = [150, 300, 600] as const;
export type Dpi = (typeof DPI_OPTIONS)[number];
export const DEFAULT_DPI: Dpi = 300;

function isDpi(value: number | undefined): value is Dpi {
  return value !== undefined && (DPI_OPTIONS as readonly number[]).includes(value);
}

export const MM_PER_INCH = 25.4;
export const DEFAULT_CUSTOM_WIDTH_MM = 210;
export const DEFAULT_CUSTOM_HEIGHT_MM = 297;
export const MIN_CUSTOM_MM = 50;
export const MAX_CUSTOM_MM = 1000;

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export function getFormat(id: string): PosterFormat | undefined {
  return POSTER_FORMATS.find((f) => f.id === id);
}

export function hasFixedPixels(id: string): boolean {
  return getFormat(id)?.pixelWidth !== undefined;
}

type ResolvedSize = {
  widthMm: number;
  heightMm: number;
  dpi: number;
  effectiveDpi: number;
  widthPx: number;
  heightPx: number;
};

export function resolveSize(params: {
  formatId: string;
  dpi?: number;
  customWidthMm?: number | "";
  customHeightMm?: number | "";
}): ResolvedSize {
  const dpi = isDpi(params.dpi) ? params.dpi : DEFAULT_DPI;

  let widthMm: number;
  let heightMm: number;

  if (params.formatId === "custom") {
    widthMm = normalizeCustomMm(params.customWidthMm, DEFAULT_CUSTOM_WIDTH_MM);
    heightMm = normalizeCustomMm(params.customHeightMm, DEFAULT_CUSTOM_HEIGHT_MM);
  } else {
    const format = getFormat(params.formatId) ?? SOCIAL_FORMAT;
    widthMm = format.widthMm;
    heightMm = format.heightMm;
  }

  const fixed = getFormat(params.formatId);
  const widthPx = fixed?.pixelWidth ?? mmToPx(widthMm, dpi);
  const heightPx = fixed?.pixelHeight ?? mmToPx(heightMm, dpi);

  return {
    widthMm,
    heightMm,
    dpi,
    widthPx,
    heightPx,
    effectiveDpi: Math.round((widthPx / widthMm) * MM_PER_INCH),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isValidCustomMm(value: number | "" | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_CUSTOM_MM &&
    value <= MAX_CUSTOM_MM
  );
}

function normalizeCustomMm(value: number | "" | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, MIN_CUSTOM_MM, MAX_CUSTOM_MM)
    : fallback;
}
