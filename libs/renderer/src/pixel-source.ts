import { ResultAsync } from "neverthrow";
import { toError } from "@freetsy/utils";
import i18n from "@freetsy/i18n";

export type PixelSource = { width: number; height: number; pixels: Uint8ClampedArray };

let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;

function context2d(
  width: number,
  height: number,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  canvas ??=
    typeof OffscreenCanvas === "function"
      ? new OffscreenCanvas(width, height)
      : document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error(i18n.t("errors.canvasUnsupported"));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

function coverFitSource(srcW: number, srcH: number, dstW: number, dstH: number) {
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;
  if (srcRatio > dstRatio) {
    const width = srcH * dstRatio;
    return { x: (srcW - width) / 2, y: 0, width, height: srcH };
  }
  const height = srcW / dstRatio;
  return { x: 0, y: (srcH - height) / 2, width: srcW, height };
}

function readPixels(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
): PixelSource {
  return { width, height, pixels: ctx.getImageData(0, 0, width, height).data };
}

export function coverPixelsFromCrop(
  image: ImageBitmap,
  crop: { x: number; y: number; width: number; height: number },
  destWidth: number,
  destHeight: number,
): PixelSource {
  const ctx = context2d(destWidth, destHeight);
  ctx.clearRect(0, 0, destWidth, destHeight);
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, destWidth, destHeight);
  return readPixels(ctx, destWidth, destHeight);
}

export function coverPixelsFit(
  image: ImageBitmap,
  destWidth: number,
  destHeight: number,
): PixelSource {
  const source = coverFitSource(image.width, image.height, destWidth, destHeight);
  const ctx = context2d(destWidth, destHeight);
  ctx.clearRect(0, 0, destWidth, destHeight);
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    destWidth,
    destHeight,
  );
  return readPixels(ctx, destWidth, destHeight);
}

export function backdropPixels(
  image: ImageBitmap,
  options: {
    crop?: { x: number; y: number; width: number; height: number };
    destWidth: number;
    destHeight: number;
    zoom: number;
  },
): PixelSource {
  const { crop, destWidth, destHeight, zoom } = options;
  const base = crop ?? { x: 0, y: 0, width: image.width, height: image.height };
  const fitted = coverFitSource(base.width, base.height, destWidth, destHeight);
  const zoomedWidth = fitted.width / zoom;
  const zoomedHeight = fitted.height / zoom;
  const sx = base.x + fitted.x + (fitted.width - zoomedWidth) / 2;
  const sy = base.y + fitted.y + (fitted.height - zoomedHeight) / 2;
  const ctx = context2d(destWidth, destHeight);
  ctx.clearRect(0, 0, destWidth, destHeight);
  ctx.drawImage(image, sx, sy, zoomedWidth, zoomedHeight, 0, 0, destWidth, destHeight);
  return readPixels(ctx, destWidth, destHeight);
}

export function resizedPixels(
  image: ImageBitmap,
  destWidth: number,
  destHeight: number,
): PixelSource {
  const ctx = context2d(destWidth, destHeight);
  ctx.clearRect(0, 0, destWidth, destHeight);
  ctx.drawImage(image, 0, 0, destWidth, destHeight);
  return readPixels(ctx, destWidth, destHeight);
}

export function decodeImageBitmap(source: Blob | string): ResultAsync<ImageBitmap, Error> {
  const toBitmap = (blob: Blob) =>
    ResultAsync.fromPromise(createImageBitmap(blob), (cause) =>
      toError(cause, i18n.t("errors.imageDecode")),
    );
  if (typeof source !== "string") return toBitmap(source);
  return ResultAsync.fromPromise(
    fetch(source).then((res) => res.blob()),
    (cause) => toError(cause, i18n.t("errors.coverRead")),
  ).andThen(toBitmap);
}
