import { ResultAsync, err, ok } from "neverthrow";
import { toError } from "@freetsy/utils";
import i18n from "@freetsy/i18n";
import { MAX_PALETTE_COLORS } from "./design";

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

export function extractPalette(
  imageBytes: Uint8Array<ArrayBuffer>,
  swatchCount = MAX_PALETTE_COLORS,
): ResultAsync<string[], Error> {
  const SAMPLE_SIZE = 32;
  const blob = new Blob([imageBytes]);

  return ResultAsync.fromPromise(
    createImageBitmap(blob, {
      resizeWidth: SAMPLE_SIZE,
      resizeHeight: SAMPLE_SIZE,
      resizeQuality: "high",
    }),
    (cause) => toError(cause, i18n.t("errors.imageDecode")),
  ).andThen((bitmap) => {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      return err(new Error(i18n.t("errors.canvasUnsupported")));
    }
    ctx.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    bitmap.close();

    return ok(extractSwatches(ctx, SAMPLE_SIZE, swatchCount));
  });
}

function extractSwatches(
  ctx: CanvasRenderingContext2D,
  sampleSize: number,
  swatchCount: number,
): string[] {
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < sampleSize * sampleSize; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    if (a < 128) continue;

    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const swatches = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, swatchCount)
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      return { r, g, b, lightness: (r + g + b) / 3 };
    });

  if (swatches.length === 0) {
    return Array.from({ length: swatchCount }, () => "#cccccc");
  }

  swatches.sort((a, b) => b.lightness - a.lightness);

  while (swatches.length < swatchCount) {
    swatches.push(swatches[swatches.length - 1]);
  }

  return swatches.map((s) => `#${toHex(s.r)}${toHex(s.g)}${toHex(s.b)}`);
}
