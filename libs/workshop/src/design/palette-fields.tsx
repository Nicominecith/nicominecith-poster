import { useId } from "react";
import { useTranslation } from "react-i18next";
import { PALETTE_SHAPES, type AdvancedPosterDesign, type PaletteShape } from "@freetsy/poster";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@freetsy/ui/components/accordion";
import { Checkbox } from "@freetsy/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@freetsy/ui/components/field";
import { cn } from "@freetsy/ui/lib/utils";
import type { PosterFormApi } from "../workbench/use-poster-form";
import { ColorField, ColorSwatchField } from "./color-field";
import type { ColorKey, MetricKey } from "./design-metrics";
import { FONT_OPTIONS } from "./font-options";
import { MetricSlider } from "./metric-slider";
import type { ColorPipette } from "./use-color-pipette";

const SHAPE_LABELS = {
  bar: "advanced.paletteShapeBar",
  block: "advanced.paletteShapeBlock",
  round: "advanced.paletteShapeRound",
  circle: "advanced.paletteShapeCircle",
} as const satisfies Record<PaletteShape, string>;

export function PaletteFields({
  form,
  design,
  pipette,
  onMetric,
  onColor,
}: {
  form: PosterFormApi;
  design: AdvancedPosterDesign;
  pipette: ColorPipette;
  onMetric: (key: MetricKey, value: number) => void;
  onColor: (key: ColorKey, value: string) => void;
}) {
  const { t } = useTranslation();
  const linkId = useId();
  const segments = design.paletteShape === "bar";
  const sizedSwatches = !(segments && design.paletteBarStretch);
  const linked = !segments && design.paletteSwatchLinked;

  const onSize = (key: MetricKey, value: number) => {
    if (linked && key === "paletteSwatchWidth") {
      form.setFieldValue("advancedDesign", {
        ...design,
        paletteSwatchWidth: value,
        paletteSwatchHeight: value,
      });
      return;
    }
    onMetric(key, value);
  };
  const setSwatch = (index: number, value: string) => {
    form.setFieldValue("advancedDesign", (current) => ({
      ...current,
      paletteColors: current.paletteColors.map((color, at) => (at === index ? value : color)),
    }));
  };

  return (
    <AccordionItem value="palette">
      <AccordionTrigger>
        <FieldTitle>{t("advanced.palette")}</FieldTitle>
      </AccordionTrigger>
      <AccordionContent className={cn("flex flex-col gap-lg")}>
        <FieldSet className={cn("gap-m")}>
          <MetricSlider metric="paletteCount" value={design.paletteCount} onChange={onMetric} />
          <form.AppField name="advancedDesign.paletteShape">
            {(field) => (
              <field.SelectField
                label={t("advanced.paletteShape")}
                options={PALETTE_SHAPES.map((shape) => ({
                  value: shape,
                  label: t(SHAPE_LABELS[shape]),
                }))}
              />
            )}
          </form.AppField>
          {segments ? (
            <form.AppField name="advancedDesign.paletteBarStretch">
              {(field) => <field.CheckboxField label={t("advanced.paletteBarStretch")} />}
            </form.AppField>
          ) : (
            <Field orientation="horizontal">
              <Checkbox
                id={linkId}
                checked={design.paletteSwatchLinked}
                onCheckedChange={(checked) =>
                  form.setFieldValue("advancedDesign", {
                    ...design,
                    paletteSwatchLinked: checked === true,
                    ...(checked === true && { paletteSwatchHeight: design.paletteSwatchWidth }),
                  })
                }
              />
              <FieldContent>
                <FieldLabel htmlFor={linkId} className={cn("tracking-normal")}>
                  {t("advanced.paletteSwatchLink")}
                </FieldLabel>
              </FieldContent>
            </Field>
          )}
          <div className={cn("grid grid-cols-1 gap-m")}>
            {sizedSwatches && (
              <MetricSlider
                metric="paletteSwatchWidth"
                label={linked ? t("advanced.paletteSwatchSize") : undefined}
                value={design.paletteSwatchWidth}
                onChange={onSize}
              />
            )}
            {!linked && (
              <MetricSlider
                metric="paletteSwatchHeight"
                value={design.paletteSwatchHeight}
                onChange={onSize}
              />
            )}
            {sizedSwatches && (
              <MetricSlider
                metric="paletteSwatchGap"
                value={design.paletteSwatchGap}
                onChange={onSize}
              />
            )}
          </div>
        </FieldSet>

        <FieldSet className={cn("gap-m")}>
          <FieldTitle>{t("advanced.paletteNumbers")}</FieldTitle>
          <form.AppField name="advancedDesign.paletteNumbers">
            {(field) => <field.CheckboxField label={t("advanced.paletteNumbersShow")} />}
          </form.AppField>
          {design.paletteNumbers && (
            <>
              <MetricSlider
                metric="paletteNumberSize"
                value={design.paletteNumberSize}
                onChange={onMetric}
              />
              <form.AppField name="advancedDesign.paletteNumberFont">
                {(field) => (
                  <field.SelectField
                    label={t("advanced.paletteNumberFont")}
                    options={FONT_OPTIONS}
                  />
                )}
              </form.AppField>
              <ColorField
                label={t("advanced.paletteNumberColor")}
                value={design.paletteNumberColor}
                pipetteKey="paletteNumberColor"
                pipette={pipette}
                onChange={(value) => onColor("paletteNumberColor", value)}
              />
            </>
          )}
        </FieldSet>

        <FieldSet className={cn("gap-m")}>
          <FieldTitle>{t("advanced.paletteColors")}</FieldTitle>
          <div className={cn("grid grid-cols-5 gap-s")}>
            {design.paletteColors.slice(0, design.paletteCount).map((color, index) => (
              <ColorSwatchField
                key={index}
                index={index}
                label={t("advanced.paletteSwatch", { index: index + 1 })}
                value={color}
                pipetteKey={`paletteColors.${index}`}
                pipette={pipette}
                onChange={(value) => setSwatch(index, value)}
              />
            ))}
          </div>
        </FieldSet>
      </AccordionContent>
    </AccordionItem>
  );
}
