import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import {
  type PosterKind,
  buildPosterSpec,
  getFormat,
  hasFixedPixels,
  hasValidPosterInput,
  parseSpotifyLink,
  type PosterCode,
  type PosterFormValues,
  posterTextInfo,
  resolveSize,
  SOCIAL_FORMAT_ID,
  type UploadedCover,
} from "@freetsy/poster";
import type { PosterExportParams } from "@freetsy/renderer/export";
import { SITE } from "../app/site-config";

export function usePosterOutput(
  values: PosterFormValues,
  cover: UploadedCover | null,
  kind: PosterKind = "music",
) {
  const { t } = useTranslation();
  const {
    content,
    formatId,
    customWidthMm,
    customHeightMm,
    dpi,
    style,
    padScale,
    titleAlign,
    freeformTextScale,
    showPalette,
    showSubtitle,
    showListDetails,
    showTextSource,
    showReleaseDate,
    releaseDateLabel,
    showAlbumLength,
    lengthLabel,
    qrUrl,
    spotifyUrl,
    codeKind,
    advancedMode,
    advancedDesign,
  } = values;
  const info = useMemo(
    () =>
      content.title.trim()
        ? posterTextInfo(content, kind, {
            showSubtitle,
            showListDetails,
            showTextSource,
            textSourceLabel: t("poster.textSource"),
          })
        : null,
    [content, kind, showSubtitle, showListDetails, showTextSource, t],
  );
  const spec = useMemo(
    () =>
      info && cover
        ? { ...buildPosterSpec(info, cover.objectUrl, cover.palette), coverAspect: cover.aspect }
        : null,
    [info, cover],
  );
  const size = useMemo(
    () => resolveSize({ formatId, dpi, customWidthMm, customHeightMm }),
    [formatId, dpi, customWidthMm, customHeightMm],
  );
  const spotifyUri = parseSpotifyLink(spotifyUrl);
  const qrTarget = qrUrl.trim();
  const effectiveCodeKind = kind === "music" ? codeKind : "qr";
  const posterCode = useMemo<PosterCode | null>(
    () =>
      effectiveCodeKind === "spotify"
        ? spotifyUri
          ? { kind: "spotify", spotifyUri }
          : null
        : qrTarget
          ? { kind: "qr", targetUrl: qrTarget }
          : null,
    [effectiveCodeKind, spotifyUri, qrTarget],
  );
  const inputValid = hasValidPosterInput(values);
  const brand = formatId === SOCIAL_FORMAT_ID ? SITE.posterBrand : null;
  const exportParams = useMemo<PosterExportParams | null>(
    () =>
      spec && inputValid
        ? {
            spec,
            coverOriginal: cover?.original,
            style,
            padScale,
            formatId,
            code: posterCode,
            freeformTextScale,
            showPalette,
            showReleaseDate,
            releaseDateLabel,
            showAlbumLength,
            lengthLabel,
            brand,
            titleAlign,
            advancedDesign: advancedMode ? advancedDesign : undefined,
            widthMm: size.widthMm,
            heightMm: size.heightMm,
            widthPx: size.widthPx,
            heightPx: size.heightPx,
          }
        : null,
    [
      spec,
      cover,
      inputValid,
      style,
      padScale,
      formatId,
      posterCode,
      freeformTextScale,
      showPalette,
      showReleaseDate,
      releaseDateLabel,
      showAlbumLength,
      lengthLabel,
      brand,
      titleAlign,
      advancedMode,
      advancedDesign,
      size.widthMm,
      size.heightMm,
      size.widthPx,
      size.heightPx,
    ],
  );
  const selectedFormat = getFormat(formatId);
  const formatLabel =
    formatId === "custom"
      ? t("formats.customShort")
      : selectedFormat
        ? t(`formats.${selectedFormat.id}`)
        : t("preview.fallbackFormat");
  return {
    formatLabel,
    spec,
    size,
    exportParams,
    brand,
    inputValid,
    posterCode,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    isCustom: formatId === "custom",
    isPixelFormat: hasFixedPixels(formatId),
    selectedFormat: getFormat(formatId),
    spotifyLinkIsInvalid: spotifyUrl.trim().length > 0 && spotifyUri === null,
    qrUrlIsCustom: Boolean(spec?.sourceUrl) && qrTarget !== spec?.sourceUrl,
  };
}
export type PosterOutput = ReturnType<typeof usePosterOutput>;
