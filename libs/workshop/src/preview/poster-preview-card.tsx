import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type PosterKind, type PosterFormValues, type UploadedCover } from "@freetsy/poster";
import {
  Card,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@freetsy/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@freetsy/ui/components/empty";
import { cn } from "@freetsy/ui/lib/utils";
import type { ColorPipette } from "../design/use-color-pipette";
import type { PosterOutput } from "../workbench/use-poster-output";
import { WORKSHOP_COPY } from "../workbench/workshop-copy";
import { PipetteHint } from "./pipette-hint";
import { MIN_PREVIEW_ZOOM, PosterCanvas, type PosterDesign } from "./poster-canvas";
import { PreviewZoom } from "./preview-zoom";

export function PosterPreviewCard({
  kind,
  values,
  output,
  cover,
  pipette,
}: {
  kind: PosterKind;
  values: PosterFormValues;
  output: PosterOutput;
  cover: UploadedCover;
  pipette: ColorPipette;
}) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(MIN_PREVIEW_ZOOM);
  const preview = useRef<HTMLDivElement>(null);
  const { spec, size, widthMm, heightMm, posterCode, brand } = output;
  const {
    style,
    padScale,
    freeformTextScale,
    showPalette,
    showReleaseDate,
    releaseDateLabel,
    showAlbumLength,
    lengthLabel,
    titleAlign,
    advancedMode,
    advancedDesign,
  } = values;
  const design = useMemo<PosterDesign | null>(
    () =>
      spec && {
        spec,
        style,
        widthMm,
        heightMm,
        padScale,
        code: posterCode,
        freeformTextScale,
        brand,
        showPalette,
        showReleaseDate,
        releaseDateLabel,
        showAlbumLength,
        lengthLabel,
        titleAlign,
        advancedDesign: advancedMode ? advancedDesign : undefined,
        coverOriginal: cover.original,
      },
    [
      spec,
      style,
      widthMm,
      heightMm,
      padScale,
      posterCode,
      freeformTextScale,
      brand,
      showPalette,
      showReleaseDate,
      releaseDateLabel,
      showAlbumLength,
      lengthLabel,
      titleAlign,
      advancedMode,
      advancedDesign,
      cover.original,
    ],
  );
  const posterWidth = `min(100%, calc(var(--poster-preview-height) * ${widthMm / heightMm}))`;

  useEffect(() => {
    if (pipette.activeKey)
      preview.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pipette.activeKey]);

  return (
    <Card asChild className={cn("lg:sticky lg:top-lg")}>
      <section>
        <CardHeader>
          <CardEyebrow>{t("preview.eyebrow")}</CardEyebrow>
          <CardTitle>{output.formatLabel}</CardTitle>
          <CardDescription>
            {output.isPixelFormat
              ? t("preview.pixelSize", { width: size.widthPx, height: size.heightPx })
              : t("preview.paperSize", {
                  width: widthMm.toFixed(0),
                  height: heightMm.toFixed(0),
                  dpi: size.effectiveDpi,
                })}
          </CardDescription>
        </CardHeader>

        <div ref={preview} className={cn("flex justify-center")}>
          {design ? (
            <div className={cn("flex flex-col gap-m")} style={{ width: posterWidth }}>
              <PosterCanvas
                design={design}
                zoom={zoom}
                picking={pipette.isActive}
                onPick={pipette.pick}
              />
              {pipette.isActive && <PipetteHint onCancel={pipette.cancel} />}
              <PreviewZoom zoom={zoom} onChange={setZoom} />
            </div>
          ) : (
            <Empty
              className={cn("flex-none")}
              style={{ width: posterWidth, aspectRatio: `${widthMm} / ${heightMm}` }}
            >
              <EmptyHeader>
                <EmptyTitle>{t("preview.emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t(WORKSHOP_COPY[kind].previewEmptyHint)}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
    </Card>
  );
}
