import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Field, FieldTitle } from "@freetsy/ui/components/field";
import { Slider } from "@freetsy/ui/components/slider";
import { cn } from "@freetsy/ui/lib/utils";
import { MAX_PREVIEW_ZOOM, MIN_PREVIEW_ZOOM, PREVIEW_ZOOM_STEP } from "./poster-canvas";

export function PreviewZoom({
  zoom,
  onChange,
}: {
  zoom: number;
  onChange: (zoom: number) => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();

  return (
    <Field orientation="horizontal" className={cn("gap-m")}>
      <FieldTitle id={labelId} className={cn("flex-none")}>
        {t("preview.zoom")}
      </FieldTitle>
      <Slider
        value={[zoom]}
        min={MIN_PREVIEW_ZOOM}
        max={MAX_PREVIEW_ZOOM}
        step={PREVIEW_ZOOM_STEP}
        aria-labelledby={labelId}
        onValueChange={([next]) => onChange(next)}
        className={cn("flex-1")}
      />
      <span
        className={cn(
          "w-12 flex-none text-right font-mono-ui text-2xs text-secondary tabular-nums",
        )}
      >
        {t("preview.zoomValue", { percent: Math.round(zoom * 100) })}
      </span>
    </Field>
  );
}
