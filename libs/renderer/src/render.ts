import { ResultAsync, errAsync, okAsync } from "neverthrow";
import type { TFunction } from "i18next";
import {
  type AdvancedPosterDesign,
  type CoverOriginal,
  customizePosterTheme,
  type LocalizedPosterSpec,
  POSTER_THEMES,
  type PosterCode,
  posterCodeAspectRatio,
  posterCodeDataUri,
  type PosterStyleId,
  type PosterTextAlign,
  type PosterTheme,
} from "@freetsy/poster";
import { noop, toError } from "@freetsy/utils";
import i18n from "@freetsy/i18n";
import { buildPosterScene, collectFontAssets } from "./scene";
import { resolveScriptFaces } from "@freetsy/fonts";
import { rendererEngine } from "./renderer-engine";
import {
  backdropPixels,
  coverPixelsFit,
  coverPixelsFromCrop,
  decodeImageBitmap,
  resizedPixels,
  type PixelSource,
} from "./pixel-source";
import { buildFontArena, renderInWorker } from "./wasm-renderer";
import { renderParallelJpeg } from "./parallel-jpeg";
import { posterRendererUnsupportedError } from "./renderer-support";

const BACKDROP_ZOOM = 1.35;

const MAX_COVER_PIXELS = 4000;
const MAX_BACKDROP_PIXELS = 1400;
const BACKDROP_WORKING_BLUR = 8;
const MIN_BACKDROP_PIXELS = 256;

function backdropCeiling(theme: PosterTheme): number {
  if (theme.backdropBlur <= 0) return MAX_BACKDROP_PIXELS;
  const working = Math.ceil((1000 * BACKDROP_WORKING_BLUR) / theme.backdropBlur);
  return Math.min(MAX_BACKDROP_PIXELS, Math.max(MIN_BACKDROP_PIXELS, working));
}
const PARALLEL_JPEG_MIN_PIXELS = 4_000_000;

function bounded(box: number, ceiling: number, source: number): number {
  return Math.max(1, Math.round(Math.min(box, ceiling, Math.max(source, 1))));
}

export type PosterRenderInput = {
  signal?: AbortSignal;
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
  coverOriginal?: CoverOriginal;
  t: TFunction;
  widthPx: number;
  heightPx: number;
};

export type RenderedPoster = {
  width: number;
  height: number;
  pixels: Uint8Array;
};

type PreparedCover = { cover?: PixelSource; backdrop?: PixelSource };
type PreparedCoverCache = {
  source: Blob | string;
  cropKey: string;
  coverBox: string;
  backdropWidth: number;
  backdropHeight: number;
  hasBackdrop: boolean;
  value: PreparedCover;
};
type PreparedCodeCache = {
  key: string;
  value: { kind: "qr" | "spotify"; pixels: PixelSource };
};

let previewCoverCache: PreparedCoverCache | null = null;
let previewCodeCache: PreparedCodeCache | null = null;

function matchingCoverCache(key: Omit<PreparedCoverCache, "value">): PreparedCover | null {
  return previewCoverCache?.source === key.source &&
    previewCoverCache.cropKey === key.cropKey &&
    previewCoverCache.coverBox === key.coverBox &&
    previewCoverCache.backdropWidth === key.backdropWidth &&
    previewCoverCache.backdropHeight === key.backdropHeight &&
    previewCoverCache.hasBackdrop === key.hasBackdrop
    ? previewCoverCache.value
    : null;
}

function prepareCoverPixels(
  input: PosterRenderInput,
  boxes: { cover: number; coverHeight: number },
  theme: PosterTheme,
): ResultAsync<PreparedCover, Error> {
  const source = input.coverOriginal?.blob ?? input.spec.coverUrl;
  const crop = input.coverOriginal?.crop;
  const cropKey = crop ? `${crop.x}:${crop.y}:${crop.width}:${crop.height}` : "";
  const backdropCeilingPx = backdropCeiling(theme);
  const backdropWidth = Math.min(input.widthPx, backdropCeilingPx);
  const backdropHeight = Math.max(
    1,
    Math.round((backdropWidth * input.heightPx) / Math.max(input.widthPx, 1)),
  );
  const cacheable = input.widthPx <= 1200;
  const cacheKey = {
    source,
    cropKey,
    coverBox: `${boxes.cover}x${boxes.coverHeight}`,
    backdropWidth,
    backdropHeight,
    hasBackdrop: theme.backdrop,
  };
  const cached = cacheable ? matchingCoverCache(cacheKey) : null;
  if (cached) return okAsync(cached);

  return decodeImageBitmap(source).map((bitmap) => {
    const sourceEdge = Math.max(crop?.width ?? bitmap.width, crop?.height ?? bitmap.height);
    const longEdge = Math.max(boxes.cover, boxes.coverHeight);
    const printedLongEdge = bounded(longEdge, MAX_COVER_PIXELS, sourceEdge);
    const shrink = longEdge > 0 ? printedLongEdge / longEdge : 1;
    const coverWidth = Math.max(1, Math.round(boxes.cover * shrink));
    const coverHeight = Math.max(1, Math.round(boxes.coverHeight * shrink));
    const actualBackdropWidth = bounded(input.widthPx, backdropCeilingPx, sourceEdge);
    const value: PreparedCover = {
      cover:
        boxes.cover > 0
          ? crop
            ? coverPixelsFromCrop(bitmap, crop, coverWidth, coverHeight)
            : coverPixelsFit(bitmap, coverWidth, coverHeight)
          : undefined,
      backdrop: theme.backdrop
        ? backdropPixels(bitmap, {
            crop,
            destWidth: actualBackdropWidth,
            destHeight: Math.max(
              1,
              Math.round((actualBackdropWidth * input.heightPx) / Math.max(input.widthPx, 1)),
            ),
            zoom: BACKDROP_ZOOM,
          })
        : undefined,
    };
    bitmap.close();
    if (cacheable) previewCoverCache = { ...cacheKey, value };
    return value;
  });
}

function prepareCodePixels(
  input: PosterRenderInput,
  codeWidth: number,
  theme: PosterTheme,
): ResultAsync<{ kind: "qr" | "spotify"; pixels: PixelSource } | undefined, Error> {
  const { code } = input;
  if (!code) return okAsync(undefined);
  const color = theme.codeColor ?? theme.codeVariant;
  const key = `${JSON.stringify(code)}:${color}:${codeWidth}`;
  const cacheable = input.widthPx <= 1200;
  if (cacheable && previewCodeCache?.key === key) return okAsync(previewCodeCache.value);

  return posterCodeDataUri(code, color)
    .andThen(decodeImageBitmap)
    .map((bitmap) => {
      const { kind } = code;
      const height = Math.max(1, Math.round(codeWidth / posterCodeAspectRatio(kind)));
      const value = {
        kind,
        pixels: resizedPixels(bitmap, Math.max(1, codeWidth), height),
      };
      bitmap.close();
      if (cacheable) previewCodeCache = { key, value };
      return value;
    });
}

function preparePixels(
  input: PosterRenderInput,
  boxes: { cover: number; coverHeight: number; codeWidth: number },
): ResultAsync<
  {
    cover?: PixelSource;
    backdrop?: PixelSource;
    code?: { kind: "qr" | "spotify"; pixels: PixelSource };
  },
  Error
> {
  const theme = customizePosterTheme(POSTER_THEMES[input.style], input.advancedDesign);
  const coverPart = prepareCoverPixels(input, boxes, theme);
  const codePart = prepareCodePixels(input, boxes.codeWidth, theme);

  return ResultAsync.combine([coverPart, codePart]).map(([cover, code]) => ({
    cover: cover.cover,
    backdrop: cover.backdrop,
    code,
  }));
}

function buildRequest(input: PosterRenderInput) {
  const probe = buildPosterScene({ ...input, code_: undefined });
  const scale = input.widthPx / 1000;
  const boxes = {
    cover: Math.max(0, Math.round(probe.scene.layout.cover_size * scale)),
    coverHeight: Math.max(
      0,
      Math.round((probe.scene.layout.cover_height ?? probe.scene.layout.cover_size) * scale),
    ),
    codeWidth: Math.max(
      1,
      Math.round(
        (input.code?.kind === "spotify"
          ? probe.scene.layout.side_column_width
          : probe.scene.layout.qr_size) * scale,
      ),
    ),
  };

  const scriptFaces = ResultAsync.fromPromise(resolveScriptFaces(probe.printedTexts), (cause) =>
    toError(cause, i18n.t("errors.fontLoad")),
  );

  return ResultAsync.combine([preparePixels(input, boxes), scriptFaces]).andThen(
    ([pixels, faces]) => {
      const built = buildPosterScene({
        ...input,
        cover: pixels.cover,
        backdrop: pixels.backdrop,
        code_: pixels.code,
        scriptFaces: faces,
      });
      return ResultAsync.fromPromise(
        collectFontAssets(built.fontRoles, built.fallbackAssets),
        (cause) => toError(cause, i18n.t("errors.fontLoad")),
      ).map((fontBytes) => {
        const { arena: fontArena, directory } = buildFontArena(fontBytes);
        return {
          engine: rendererEngine(faces),
          requestJson: JSON.stringify({ scene: built.scene, fonts: directory }),
          pixelArena: built.pixelArena,
          fontArena,
        };
      });
    },
  );
}

function prepared(input: PosterRenderInput) {
  const unsupported = posterRendererUnsupportedError();
  return unsupported ? errAsync(unsupported) : buildRequest(input);
}

export function renderPosterToPixels(input: PosterRenderInput): ResultAsync<RenderedPoster, Error> {
  if (!(input.widthPx > 0 && input.heightPx > 0)) {
    return errAsync(new Error(i18n.t("errors.posterRender")));
  }
  return prepared(input).andThen((request) =>
    ResultAsync.fromPromise(
      renderInWorker({
        engine: request.engine,
        requestJson: request.requestJson,
        pixelArena: request.pixelArena,
        fontArena: request.fontArena,
        output: { kind: "rgba" },
        lane: "preview",
        signal: input.signal,
      }),
      (cause) => toError(cause, i18n.t("errors.posterRender")),
    ).map((bytes) => ({
      width: input.widthPx,
      height: input.heightPx,
      pixels: bytes,
    })),
  );
}

export function renderPosterToJpeg(
  input: PosterRenderInput,
  options: { dpi: number; quality: number; onProgress?: (fraction: number) => void },
): ResultAsync<Uint8Array, Error> {
  const reportProgress = options.onProgress ?? noop;
  reportProgress(0.03);
  return prepared(input).andThen((request) =>
    ResultAsync.fromPromise(
      input.widthPx * input.heightPx >= PARALLEL_JPEG_MIN_PIXELS
        ? renderParallelJpeg({
            engine: request.engine,
            requestJson: request.requestJson,
            pixelArena: request.pixelArena,
            fontArena: request.fontArena,
            width: input.widthPx,
            height: input.heightPx,
            dpi: options.dpi,
            quality: options.quality,
            signal: input.signal,
            onProgress: options.onProgress,
          })
        : renderInWorker({
            engine: request.engine,
            requestJson: request.requestJson,
            pixelArena: request.pixelArena,
            fontArena: request.fontArena,
            output: {
              kind: "jpeg",
              dpi: options.dpi,
              quality: options.quality,
            },
            lane: "export",
            signal: input.signal,
          }),
      (cause) => toError(cause, i18n.t("errors.posterRender")),
    ).map((jpeg) => {
      reportProgress(1);
      return jpeg;
    }),
  );
}
