import type { TFunction } from "i18next";
import {
  type AdvancedPosterDesign,
  customizePosterSpec,
  customizePosterTheme,
  DEFAULT_TITLE_ALIGN,
  LAYOUT_BASE_WIDTH,
  type LocalizedPosterSpec,
  POSTER_THEMES,
  type PosterCode,
  posterDesignFontIds,
  type PosterSpec,
  type PosterStyleId,
  type PosterTextAlign,
  type PosterTheme,
  type PosterTrack,
  type ResolvedLayout,
  resolveLayout,
} from "@freetsy/poster";
import {
  fallbackAssets,
  needsFallbackFaces,
  NO_SCRIPT_FACES,
  POSTER_FONT_SFNT_FACES,
  posterFont,
  type PosterFontId,
  type ScriptFaces,
} from "@freetsy/fonts";
import { resolveCssColor, type RgbaColor } from "./resolve-color";
import type { PixelSource } from "./pixel-source";

const TRACKING_TIGHT_EM = -0.025;
const TRACKING_WIDE_EM = 0.025;
const TRACKING_EYEBROW_EM = 0.2;
const TRACKING_WIDEST_EM = 0.1;

function titleTrackingEm(theme: PosterTheme): number {
  return theme.titleTracking === "var(--tracking-tight)" ? TRACKING_TIGHT_EM : TRACKING_WIDE_EM;
}

const fontAssetCache = new Map<string, Promise<ArrayBuffer>>();

function fontAssetBytes(url: string): Promise<ArrayBuffer> {
  let promise = fontAssetCache.get(url);
  if (!promise) {
    promise = fetch(url).then((res) => res.arrayBuffer());
    fontAssetCache.set(url, promise);
  }
  return promise;
}

function sfntAssetKey(id: PosterFontId, weight: 400 | 700): string {
  const faces = POSTER_FONT_SFNT_FACES[id];
  const face = faces.find((f) => f.weight === weight) ?? faces[0];
  return face.asset;
}

type FontRole = { id: PosterFontId; weight: 400 | 700 };

function fallbackFacesFor(role: FontRole, scriptFaces: ScriptFaces): string[] {
  return [
    ...fallbackAssets(posterFont(role.id).category, role.weight),
    ...scriptFaces[role.weight],
  ];
}

export async function collectFontAssets(
  roles: FontRole[],
  fallbacks: readonly string[] = [],
): Promise<Map<string, ArrayBuffer>> {
  const map = new Map<string, ArrayBuffer>();
  const assets = [...roles.map((role) => sfntAssetKey(role.id, role.weight)), ...fallbacks];
  await Promise.all(
    assets.map(async (asset) => {
      if (!map.has(asset)) map.set(asset, await fontAssetBytes(asset));
    }),
  );
  return map;
}

function printable(text: string): string {
  return text.normalize("NFC");
}

type RustFontRef = {
  asset: string;
  size: number;
  letter_spacing: number;
  uppercase: boolean;
  color: RgbaColor;
  fallbacks: string[];
};

type RustBitmapRef = { bitmap: { width: number; height: number; offset: number } };

type RustScene = {
  width: number;
  height: number;
  scale: number;
  theme: {
    paper: RgbaColor;
    mat: RgbaColor;
    ink: RgbaColor;
    frame_border: number;
    palette_shape: PosterTheme["paletteShape"];
    palette_bar_stretch: boolean;
    palette_top: number;
    palette_width: number;
    palette_height: number;
    palette_gap: number;
    backdrop: boolean;
    backdrop_blur: number;
    title_leading: number;
  };
  layout: {
    outer_pad: number;
    inner_pad: number;
    content_width: number;
    cover_size: number;
    cover_height: number;
    cover_gap: number;
    title_gap: number;
    side_column_width: number;
    qr_size: number;
    side_gap: number;
    track_gap: number;
    track_column_gap: number;
    content_gap: number;
    duration_gap: number;
  };
  title: string;
  title_font: RustFontRef;
  artist: string;
  artist_font: RustFontRef;
  eyebrow_first: boolean;
  title_align: PosterTextAlign;
  cover: RustBitmapRef | null;
  backdrop: RustBitmapRef | null;
  brand: string | null;
  show_palette: boolean;
  palette: RgbaColor[];
  palette_index_font?: RustFontRef;
  columns: Array<Array<{ label: string; duration: string; emphasized_font?: RustFontRef }>>;
  track_font: RustFontRef;
  duration_color: RgbaColor;
  credits: Array<{ label: string; value: string }>;
  credit_label_font: RustFontRef;
  credit_value_font: RustFontRef;
  show_soundwave: boolean;
  code: (RustBitmapRef & { kind: "qr" | "spotify" }) | null;
};

function fontRefsAt(scale: number, fallbacksFor: (role: FontRole) => string[]) {
  return (
    role: FontRole,
    size: number,
    color: RgbaColor,
    opts?: { letterSpacingEm?: number; uppercase?: boolean },
  ): RustFontRef => ({
    asset: sfntAssetKey(role.id, role.weight),
    size: size * scale,
    letter_spacing: (opts?.letterSpacingEm ?? 0) * size * scale,
    uppercase: opts?.uppercase ?? false,
    color,
    fallbacks: fallbacksFor(role),
  });
}

type PosterSceneParams = {
  spec: LocalizedPosterSpec;
  style: PosterStyleId;
  widthMm: number;
  heightMm: number;
  padScale: number;
  code: PosterCode | null;
  freeformTextScale: number;
  brand: string | null;
  showPalette: boolean;
  showReleaseDate: boolean;
  releaseDateLabel: string;
  showAlbumLength: boolean;
  lengthLabel: string;
  titleAlign?: PosterTextAlign;
  advancedDesign?: AdvancedPosterDesign;
  t: TFunction;
  widthPx: number;
  heightPx: number;
  cover?: PixelSource;
  backdrop?: PixelSource;
  code_?: { kind: "qr" | "spotify"; pixels: PixelSource };
  scriptFaces?: ScriptFaces;
};

type BuiltScene = {
  scene: RustScene;
  fontRoles: FontRole[];
  fallbackAssets: string[];
  printedTexts: string[];
  pixelArena: Uint8Array<ArrayBuffer>;
};

class PixelArenaBuilder {
  private readonly chunks: Array<{ pixels: Uint8ClampedArray; offset: number }> = [];
  private length = 0;

  add(pixels: PixelSource | undefined): { width: number; height: number; offset: number } | null {
    if (!pixels) return null;
    const offset = this.length;
    this.chunks.push({ pixels: pixels.pixels, offset });
    this.length += pixels.pixels.length;
    return { width: pixels.width, height: pixels.height, offset };
  }

  build(): Uint8Array<ArrayBuffer> {
    const arena = new Uint8Array(this.length);
    for (const chunk of this.chunks) arena.set(chunk.pixels, chunk.offset);
    return arena;
  }
}

type PrintedText = {
  title: string;
  artist: string;
  trackRows: Array<Array<{ label: string; duration: string; emphasized: boolean }>>;
  credits: Array<{ label: string; value: string }>;
  all: string[];
  withFallbacks: boolean;
};

export function defaultCreditLabels(
  kind: PosterSpec["kind"],
  t: TFunction,
): { released: string; length: string } {
  if (kind === "film") return { released: t("poster.premiere"), length: t("poster.runtime") };
  if (kind === "book") return { released: t("poster.published"), length: t("poster.pages") };
  return { released: t("poster.released"), length: t("poster.albumLength") };
}

function printedText(params: PosterSceneParams, posterSpec: PosterSpec): PrintedText {
  const { spec, t, releaseDateLabel, lengthLabel, showReleaseDate, showAlbumLength } = params;
  const title = printable(spec.title);
  const artist = printable(spec.artist);
  const trackRows = posterSpec.columns.map((column) =>
    column.map((track: PosterTrack) => ({
      label: printable(posterSpec.numbered ? `${track.numberLabel}. ${track.name}` : track.name),
      duration: printable(track.durationLabel),
      emphasized: Boolean(track.emphasized),
    })),
  );
  const labels = defaultCreditLabels(spec.kind, t);
  const credits = [
    {
      label: printable(releaseDateLabel.trim() || labels.released),
      value: showReleaseDate ? printable(spec.releaseDateLabel) : "",
    },
    {
      label: printable(lengthLabel.trim() || labels.length),
      value: showAlbumLength ? printable(spec.totalLengthLabel) : "",
    },
    { label: printable(t("poster.recordLabel")), value: printable(spec.recordLabel) },
    ...(spec.extraCredits ?? []).map((credit) => ({
      label: printable(credit.label),
      value: printable(credit.value),
    })),
  ].filter((credit) => credit.value);

  const all = [
    title,
    artist,
    ...trackRows.flat().flatMap((track) => [track.label, track.duration]),
    ...credits.flatMap((credit) => [credit.label, credit.value]),
  ];
  return { title, artist, trackRows, credits, all, withFallbacks: needsFallbackFaces(all) };
}

function sceneCode(
  code: PosterSceneParams["code_"],
  bitmap: RustBitmapRef["bitmap"] | null,
): RustScene["code"] {
  if (!code || !bitmap) return null;
  return { kind: code.kind, bitmap };
}

export function buildPosterScene(params: PosterSceneParams): BuiltScene {
  const {
    spec,
    style,
    widthMm,
    heightMm,
    padScale,
    freeformTextScale,
    brand,
    showPalette,
    advancedDesign,
    widthPx,
    heightPx,
  } = params;

  const theme = customizePosterTheme(POSTER_THEMES[style], advancedDesign);
  const posterSpec = customizePosterSpec(spec, advancedDesign);
  const layout: ResolvedLayout = resolveLayout({
    spec: posterSpec,
    style,
    widthMm,
    heightMm,
    padScale,
    textScale: posterSpec.numbered ? 1 : freeformTextScale,
    showPalette,
    advancedDesign,
  });
  const scale = widthPx / LAYOUT_BASE_WIDTH;

  const [titleFontId, subtitleFontId, bodyFontId, metadataFontId, paletteNumberFontId] =
    posterDesignFontIds(theme, advancedDesign);

  const titleColor = resolveCssColor(theme.titleInk ?? theme.ink);
  const subtitleColor = resolveCssColor(theme.subtitleInk ?? theme.ink);
  const bodyColor = resolveCssColor(theme.ink);
  const mutedColor = resolveCssColor(theme.muted);
  const creditInk = resolveCssColor(theme.creditInk);
  const creditMuted = resolveCssColor(theme.creditMuted);

  const uppercaseArtist = theme.uppercase || theme.eyebrow;

  const { title, artist, trackRows, credits, all, withFallbacks } = printedText(params, posterSpec);
  const scriptFaces = params.scriptFaces ?? NO_SCRIPT_FACES;
  const fallbacksFor = (role: FontRole) =>
    withFallbacks ? fallbackFacesFor(role, scriptFaces) : [];

  const titleRole: FontRole = { id: titleFontId, weight: 400 };
  const artistRole: FontRole = { id: subtitleFontId, weight: 700 };
  const trackRole: FontRole = { id: bodyFontId, weight: 400 };
  const trackBoldRole: FontRole = { id: bodyFontId, weight: 700 };
  const creditLabelRole: FontRole = { id: metadataFontId, weight: 700 };
  const creditValueRole: FontRole = { id: metadataFontId, weight: 400 };
  const paletteIndexRole: FontRole = { id: paletteNumberFontId, weight: 400 };
  const fontRoles: FontRole[] = [
    titleRole,
    artistRole,
    trackRole,
    trackBoldRole,
    creditLabelRole,
    creditValueRole,
    ...(theme.paletteNumbers ? [paletteIndexRole] : []),
  ];

  const fontRef = fontRefsAt(scale, fallbacksFor);
  const titleFont = fontRef(titleRole, layout.titleSize, titleColor, {
    letterSpacingEm: titleTrackingEm(theme),
    uppercase: theme.uppercase,
  });
  const artistFont = fontRef(artistRole, layout.subtitleSize, subtitleColor, {
    letterSpacingEm: uppercaseArtist ? TRACKING_EYEBROW_EM : 0,
    uppercase: uppercaseArtist,
  });
  const trackFont = fontRef(trackRole, layout.trackSize, bodyColor);
  const trackFontBold = fontRef(trackBoldRole, layout.trackSize, bodyColor);
  const creditLabelFont = fontRef(creditLabelRole, layout.creditLabelSize, creditInk, {
    letterSpacingEm: TRACKING_WIDEST_EM,
    uppercase: true,
  });
  const creditValueFont = fontRef(creditValueRole, layout.creditValueSize, creditMuted);
  const paletteIndexFont = theme.paletteNumbers
    ? fontRef(
        paletteIndexRole,
        theme.paletteIndexSize,
        resolveCssColor(theme.paletteIndexColor ?? theme.muted),
      )
    : undefined;

  const arena = new PixelArenaBuilder();
  const cover = arena.add(params.cover);
  const backdropBitmap = arena.add(params.backdrop);
  const codePixels = params.code_ ? arena.add(params.code_.pixels) : null;

  const columns = trackRows.map((column) =>
    column.map(({ label, duration, emphasized }) => ({
      label,
      duration,
      emphasized_font: emphasized ? trackFontBold : undefined,
    })),
  );

  const scene: RustScene = {
    width: widthPx,
    height: heightPx,
    scale,
    theme: {
      paper: resolveCssColor(theme.paper),
      mat: resolveCssColor(theme.frameBorder ? theme.mat : theme.paper),
      ink: bodyColor,
      frame_border: theme.frameBorder,
      palette_shape: theme.paletteShape,
      palette_bar_stretch: theme.paletteBarStretch,
      palette_top: theme.paletteTop,
      palette_width: theme.paletteWidth,
      palette_height: theme.paletteHeight,
      palette_gap: theme.paletteGap,
      backdrop: theme.backdrop,
      backdrop_blur: theme.backdropBlur,
      title_leading: theme.titleLeading,
    },
    layout: {
      outer_pad: layout.outerPad,
      inner_pad: layout.innerPad,
      content_width: layout.contentWidth,
      cover_size: layout.coverSize,
      cover_height: layout.coverHeight,
      cover_gap: layout.coverGap,
      title_gap: layout.titleGap,
      side_column_width: layout.sideColumnWidth,
      qr_size: layout.qrSize,
      side_gap: layout.sideGap,
      track_gap: layout.trackGap,
      track_column_gap: layout.trackColumnGap,
      content_gap: layout.contentGap,
      duration_gap: layout.durationGap,
    },
    title,
    title_font: titleFont,
    artist,
    artist_font: artistFont,
    eyebrow_first: theme.eyebrow,
    title_align: params.titleAlign ?? DEFAULT_TITLE_ALIGN,
    cover: cover ? { bitmap: cover } : null,
    backdrop: backdropBitmap ? { bitmap: backdropBitmap } : null,
    brand,
    show_palette: showPalette,
    palette: posterSpec.palette.slice(0, theme.paletteCount).map(resolveCssColor),
    palette_index_font: paletteIndexFont,
    columns,
    track_font: trackFont,
    duration_color: mutedColor,
    credits,
    credit_label_font: creditLabelFont,
    credit_value_font: creditValueFont,
    show_soundwave:
      posterSpec.numbered && Boolean(params.code_) && (posterSpec.kind ?? "music") === "music",
    code: sceneCode(params.code_, codePixels),
  };

  return {
    scene,
    fontRoles,
    fallbackAssets: [...new Set(fontRoles.flatMap(fallbacksFor))],
    printedTexts: all,
    pixelArena: arena.build(),
  };
}
