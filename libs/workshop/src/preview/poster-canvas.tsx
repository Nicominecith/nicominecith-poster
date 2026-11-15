import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { localizePosterSpec, type PosterSpec } from "@freetsy/poster";
import type { PosterRenderInput } from "@freetsy/renderer";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Spinner } from "@freetsy/ui/components/spinner";
import { cn } from "@freetsy/ui/lib/utils";
import { ColorLoupe } from "./color-loupe";
import { CropMarks } from "./crop-marks";
import { useCanvasResolution } from "./use-canvas-resolution";
import { useColorProbe } from "./use-color-probe";
import { useDragPan } from "./use-drag-pan";
import { useProgressiveRender } from "./use-progressive-render";

export const MIN_PREVIEW_ZOOM = 1;
export const MAX_PREVIEW_ZOOM = 3;
export const PREVIEW_ZOOM_STEP = 0.25;

export type PosterDesign = Omit<
  PosterRenderInput,
  "signal" | "spec" | "t" | "widthPx" | "heightPx"
> & { spec: PosterSpec };

export function PosterCanvas({
  design,
  zoom = MIN_PREVIEW_ZOOM,
  picking = false,
  onPick,
  className,
}: {
  design: PosterDesign;
  zoom?: number;
  picking?: boolean;
  onPick?: (color: string) => void;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const magnified = zoom > MIN_PREVIEW_ZOOM;
  const { widthMm, heightMm } = design;
  const widthPx = useCanvasResolution(canvas, magnified);
  const heightPx = Math.max(1, Math.round((widthPx * heightMm) / widthMm));

  const request = useMemo(
    () => ({
      ...design,
      spec: localizePosterSpec(design.spec, i18n.language, t),
      t,
      widthPx,
      heightPx,
    }),
    [design, i18n.language, t, widthPx, heightPx],
  );
  const { failure, painted } = useProgressiveRender(canvas, request);
  const pan = useDragPan({ viewport, zoom, enabled: magnified && !picking });
  const { probe, handlers: probeHandlers } = useColorProbe({
    canvas,
    frame,
    enabled: picking && painted,
    onPick,
  });

  return (
    <div ref={frame} className={cn("relative w-full", className)}>
      <CropMarks />
      <div
        ref={viewport}
        className={cn(
          "w-full",
          magnified ? "overflow-auto" : "overflow-hidden",
          picking
            ? "cursor-crosshair"
            : magnified && (pan.dragging ? "cursor-grabbing select-none" : "cursor-grab"),
        )}
        style={magnified ? { aspectRatio: `${widthMm} / ${heightMm}` } : undefined}
        {...pan.handlers}
      >
        <div style={{ width: `${zoom * 100}%` }}>
          <canvas
            ref={canvas}
            width={widthPx}
            height={heightPx}
            role="img"
            aria-label={t("preview.alt", { title: design.spec.title })}
            data-poster-failed={failure !== null}
            data-poster-picking={picking}
            className={cn("block h-auto w-full", picking && "touch-none")}
            {...probeHandlers}
          />
        </div>
      </div>
      {probe && <ColorLoupe probe={probe} source={canvas} />}
      {failure === null && !painted && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-s",
            "text-center font-mono-ui text-xs tracking-ui text-secondary uppercase",
          )}
        >
          <Spinner />
          {t("preview.loading")}
        </div>
      )}
      {failure !== null && (
        <Alert
          variant="destructive"
          className={cn("absolute inset-x-m top-1/2 w-auto -translate-y-1/2 bg-surface py-s")}
        >
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
