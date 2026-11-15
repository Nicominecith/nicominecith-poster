import { ResultAsync, okAsync } from "neverthrow";
import {
  type AdvancedPosterDesign,
  type CoverOriginal,
  type ExportFormatId,
  localizePosterSpec,
  MM_PER_INCH,
  type PosterCode,
  type PosterSpec,
  type PosterStyleId,
  type PosterTextAlign,
} from "@freetsy/poster";
import { withCancellation } from "./export-task";
import { toError } from "@freetsy/utils";
import { renderPosterToJpeg } from "./render";
import i18n from "@freetsy/i18n";

const JPEG_QUALITY = 92;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
export type PosterExportParams = {
  spec: PosterSpec;
  coverOriginal?: CoverOriginal;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  style: PosterStyleId;
  padScale: number;
  formatId: string;
  code: PosterCode | null;
  freeformTextScale: number;
  showPalette: boolean;
  showReleaseDate: boolean;
  releaseDateLabel: string;
  showAlbumLength: boolean;
  lengthLabel: string;
  brand: string | null;
  titleAlign: PosterTextAlign;
  advancedDesign?: AdvancedPosterDesign;
};
type PosterExportOptions = {
  format: ExportFormatId;
  signal: AbortSignal;
  onProgress?: (fraction: number) => void;
};

async function pdfFromJpeg(jpeg: Uint8Array, params: PosterExportParams): Promise<Blob> {
  const { wrapJpegInPdf } = await import("./pdf");
  const result = await wrapJpegInPdf(jpeg, params.widthMm, params.heightMm);
  return result.match(
    (bytes) => new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    (error) => {
      throw error;
    },
  );
}

export function createPosterFile(
  params: PosterExportParams,
  options: PosterExportOptions,
): ResultAsync<File, Error> {
  const renderError = (cause: unknown) => toError(cause, i18n.t("errors.posterRender"));
  return renderPosterToJpeg(
    {
      spec: localizePosterSpec(params.spec, i18n.language, i18n.t),
      style: params.style,
      widthMm: params.widthMm,
      heightMm: params.heightMm,
      padScale: params.padScale,
      code: params.code,
      freeformTextScale: params.freeformTextScale,
      brand: params.brand,
      showPalette: params.showPalette,
      showReleaseDate: params.showReleaseDate,
      releaseDateLabel: params.releaseDateLabel,
      showAlbumLength: params.showAlbumLength,
      lengthLabel: params.lengthLabel,
      titleAlign: params.titleAlign,
      advancedDesign: params.advancedDesign,
      coverOriginal: params.coverOriginal,
      t: i18n.t,
      widthPx: params.widthPx,
      heightPx: params.heightPx,
      signal: options.signal,
    },
    {
      dpi: Math.round((params.widthPx * MM_PER_INCH) / params.widthMm),
      quality: JPEG_QUALITY,
      onProgress: options.onProgress,
    },
  )
    .andThen((jpeg) =>
      options.format === "jpg"
        ? okAsync(new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }))
        : ResultAsync.fromPromise(
            withCancellation(pdfFromJpeg(jpeg, params), options.signal),
            renderError,
          ),
    )
    .map(
      (blob) =>
        new File(
          [blob],
          `${slugify(params.spec.artist)}-${slugify(params.spec.title)}-${params.style}-${params.formatId}.${options.format}`,
          { type: blob.type },
        ),
    );
}
