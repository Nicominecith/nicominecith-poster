import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Field, FieldTitle } from "@freetsy/ui/components/field";
import { Slider } from "@freetsy/ui/components/slider";
import { cn } from "@freetsy/ui/lib/utils";
import { METRIC_RANGES, type MetricKey } from "./design-metrics";

const fractionDigits = (step: number) => (step < 0.1 ? 2 : step < 1 ? 1 : 0);

export function MetricSlider({
  metric,
  value,
  label,
  onChange,
}: {
  metric: MetricKey;
  value: number;
  label?: string;
  onChange: (key: MetricKey, value: number) => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const range: { min: number; max: number; step: number; unit?: string } = METRIC_RANGES[metric];

  return (
    <Field className={cn("gap-xs")}>
      <div className={cn("flex items-baseline justify-between gap-m")}>
        <FieldTitle id={labelId}>{label ?? t(`advanced.${metric}`)}</FieldTitle>
        <output className={cn("font-mono-ui text-xs text-primary tabular-nums")}>
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: fractionDigits(range.step),
          })}
          {range.unit}
        </output>
      </div>
      <Slider
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        aria-labelledby={labelId}
        className={cn("py-m **:data-[slot=slider-thumb]:size-5")}
        onValueChange={([next]) => onChange(metric, next)}
      />
    </Field>
  );
}
