import { isValidReleaseDate, isValidDuration } from "./album/content";
import { isValidCount } from "./listing";
import { type EditableContent, emptyLists } from "./content";
import type { PosterCodeKind } from "./code/poster-code";
import {
  DEFAULT_CUSTOM_HEIGHT_MM,
  DEFAULT_CUSTOM_WIDTH_MM,
  DEFAULT_DPI,
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_FORMAT_ID,
  type Dpi,
  type ExportFormatId,
  isValidCustomMm,
  type PosterFormatId,
} from "./formats";
import { DEFAULT_PAD_SCALE, resolveLayout } from "./layout";
import { DEFAULT_TITLE_ALIGN, type PosterTextAlign } from "./align";
import { DEFAULT_STYLE_ID, type PosterStyleId } from "./styles";
import {
  advancedDesignFromPreset,
  DEFAULT_PALETTE_COUNT,
  type AdvancedPosterDesign,
} from "./design";
import type { PosterSpec } from "./spec";
import { POSTER_THEMES } from "./theme";

export const MIN_FREEFORM_TEXT_SCALE = 1;
export const MAX_FREEFORM_TEXT_SCALE = 2;
const DEFAULT_FREEFORM_TEXT_SCALE = 1;

export type PosterFormValues = {
  style: PosterStyleId;
  formatId: PosterFormatId;
  customWidthMm: number | "";
  customHeightMm: number | "";
  padScale: number;
  titleAlign: PosterTextAlign;
  codeKind: PosterCodeKind;
  qrUrl: string;
  spotifyUrl: string;
  showPalette: boolean;
  showSubtitle: boolean;
  showListDetails: boolean;
  showTextSource: boolean;
  showReleaseDate: boolean;
  releaseDateLabel: string;
  showAlbumLength: boolean;
  lengthLabel: string;
  exportFormat: ExportFormatId;
  freeformTextScale: number;
  advancedMode: boolean;
  advancedDesign: AdvancedPosterDesign;
  dpi: Dpi;
  content: EditableContent;
};

export const CONTENT_FIELDS = [
  "title",
  "subtitle",
  "releaseDate",
  "format",
  "tracks",
  "freeformText",
  "sourceUrl",
  "lists",
  "quote",
  "runtime",
  "pages",
  "credits",
  "creditOptions",
  "textSource",
] as const satisfies ReadonlyArray<keyof EditableContent>;

export const POSTER_FORM_DEFAULTS: PosterFormValues = {
  style: DEFAULT_STYLE_ID,
  formatId: DEFAULT_FORMAT_ID,
  customWidthMm: DEFAULT_CUSTOM_WIDTH_MM,
  customHeightMm: DEFAULT_CUSTOM_HEIGHT_MM,
  padScale: DEFAULT_PAD_SCALE,
  titleAlign: DEFAULT_TITLE_ALIGN,
  codeKind: "qr",
  qrUrl: "",
  spotifyUrl: "",
  showPalette: true,
  showSubtitle: true,
  showListDetails: true,
  showTextSource: true,
  showReleaseDate: true,
  releaseDateLabel: "",
  showAlbumLength: true,
  lengthLabel: "",
  exportFormat: DEFAULT_EXPORT_FORMAT,
  freeformTextScale: DEFAULT_FREEFORM_TEXT_SCALE,
  advancedMode: false,
  advancedDesign: {
    outerPad: 4.2,
    innerPad: 0,
    coverSize: 75,
    coverGap: 3.6,
    titleSize: 5,
    subtitleSize: 2.2,
    bodySize: 1.55,
    metadataSize: 1.25,
    titleGap: 0.6,
    paletteGap: 2,
    contentGap: 2.4,
    columnGap: 2.8,
    rowGap: 0.9,
    sideGap: 1.4,
    durationGap: 1.2,
    codeSize: 9.5,
    sideColumnWidth: 15.5,
    columns: 2,
    backdropBlur: 1.5,
    titleFont: "archivo",
    subtitleFont: "inter",
    bodyFont: "inter",
    metadataFont: "inter",
    backgroundColor: "#000000",
    titleColor: "#ffffff",
    subtitleColor: "#ffffff",
    bodyColor: "#ffffff",
    durationColor: "#8c8c8c",
    metadataLabelColor: "#ffffff",
    metadataValueColor: "#b3b3b3",
    codeColor: "#ffffff",
    paletteCount: DEFAULT_PALETTE_COUNT,
    paletteShape: "block",
    paletteBarStretch: true,
    paletteSwatchWidth: 2,
    paletteSwatchHeight: 2,
    paletteSwatchLinked: true,
    paletteSwatchGap: 1.4,
    paletteNumbers: true,
    paletteNumberSize: 1.1,
    paletteNumberFont: "inter",
    paletteNumberColor: "#8c8c8c",
    paletteColors: [
      "#f2efe8",
      "#b3b3b3",
      "#797774",
      "#4a4638",
      "#16140f",
      "#f2efe8",
      "#b3b3b3",
      "#797774",
      "#4a4638",
      "#16140f",
    ],
  },
  dpi: DEFAULT_DPI,
  content: {
    title: "",
    subtitle: "",
    releaseDate: "",
    format: "tracklist",
    tracks: [],
    freeformText: "",
    sourceUrl: "",
    lists: emptyLists(),
    quote: "",
    runtime: "",
    pages: "",
    credits: [],
    creditOptions: [],
    textSource: "",
  },
};

export function hasValidPosterInput(values: PosterFormValues): boolean {
  return (
    (values.formatId !== "custom" ||
      (isValidCustomMm(values.customWidthMm) && isValidCustomMm(values.customHeightMm))) &&
    isValidReleaseDate(values.content.releaseDate) &&
    isValidCount(values.content.runtime) &&
    isValidCount(values.content.pages) &&
    (values.content.format !== "tracklist" ||
      values.content.tracks.every(
        (track) => !track.title.trim() || isValidDuration(track.duration),
      ))
  );
}

export const SCALE_STEP = 0.05;

export function presetDesign(
  values: PosterFormValues,
  spec: PosterSpec | null,
  size: { widthMm: number; heightMm: number },
): AdvancedPosterDesign {
  if (!spec) return values.advancedDesign;
  const layout = resolveLayout({
    spec,
    style: values.style,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    padScale: values.padScale,
    textScale: spec.numbered ? 1 : values.freeformTextScale,
    showPalette: values.showPalette,
  });
  return advancedDesignFromPreset(
    POSTER_THEMES[values.style],
    layout,
    spec.columns.length,
    spec.palette,
  );
}
