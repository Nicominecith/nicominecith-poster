import { useId, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { RotateCcwIcon } from "lucide-react";
import type { AdvancedPosterDesign, PosterSpec } from "@freetsy/poster";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@freetsy/ui/components/accordion";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Button } from "@freetsy/ui/components/button";
import { Checkbox } from "@freetsy/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@freetsy/ui/components/field";
import { cn } from "@freetsy/ui/lib/utils";
import type { PosterFormApi } from "../workbench/use-poster-form";
import { ColorField } from "./color-field";
import { designContent, designSections, type ColorKey, type MetricKey } from "./design-metrics";
import { FONT_OPTIONS } from "./font-options";
import { MetricSlider } from "./metric-slider";
import { PaletteFields } from "./palette-fields";
import type { ColorPipette } from "./use-color-pipette";

type FontKey = "titleFont" | "subtitleFont" | "bodyFont" | "metadataFont";

function Section({
  value,
  title,
  className,
  children,
}: {
  value: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <FieldTitle>{title}</FieldTitle>
      </AccordionTrigger>
      <AccordionContent className={className}>{children}</AccordionContent>
    </AccordionItem>
  );
}

function Metrics({
  keys,
  design,
  onChange,
}: {
  keys: MetricKey[];
  design: AdvancedPosterDesign;
  onChange: (key: MetricKey, value: number) => void;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-m")}>
      {keys.map((key) => (
        <MetricSlider key={key} metric={key} value={design[key]} onChange={onChange} />
      ))}
    </div>
  );
}

function AdvancedToggle({
  form,
  presetDesign,
}: {
  form: PosterFormApi;
  presetDesign: AdvancedPosterDesign;
}) {
  const { t } = useTranslation();
  const toggleId = useId();

  return (
    <form.AppField name="advancedMode">
      {(field) => (
        <Field orientation="horizontal">
          <Checkbox
            id={toggleId}
            checked={field.state.value}
            onCheckedChange={(checked) => {
              if (checked === true) form.setFieldValue("advancedDesign", presetDesign);
              field.handleChange(checked === true);
            }}
          />
          <FieldContent>
            <FieldLabel htmlFor={toggleId} className={cn("tracking-normal")}>
              {t("advanced.enable")}
            </FieldLabel>
            <FieldDescription>{t("advanced.description")}</FieldDescription>
          </FieldContent>
        </Field>
      )}
    </form.AppField>
  );
}

export function PosterAdvancedFields({
  form,
  presetDesign,
  spec,
  hasCode,
  pipette,
}: {
  form: PosterFormApi;
  presetDesign: AdvancedPosterDesign;
  spec: PosterSpec;
  hasCode: boolean;
  pipette: ColorPipette;
}) {
  const { t } = useTranslation();
  const { advancedMode, design, style, showPalette } = useSelector(form.store, (state) => ({
    advancedMode: state.values.advancedMode,
    design: state.values.advancedDesign,
    style: state.values.style,
    showPalette: state.values.showPalette,
  }));
  const content = designContent({ spec, design, hasCode, showPalette });
  const sections = designSections(content);
  const fonts: FontKey[] = [
    "titleFont",
    ...(content.hasSubtitle ? (["subtitleFont"] as const) : []),
    ...(content.hasRows ? (["bodyFont"] as const) : []),
    ...(content.hasMetadata ? (["metadataFont"] as const) : []),
  ];

  const setMetric = (key: MetricKey, value: number) =>
    form.setFieldValue("advancedDesign", { ...design, [key]: value });
  const setColor = (key: ColorKey, value: string) =>
    form.setFieldValue("advancedDesign", (current) => ({ ...current, [key]: value }));
  const colorField = (key: ColorKey) => (
    <ColorField
      key={key}
      label={t(`advanced.${key}`)}
      value={design[key]}
      pipetteKey={key}
      pipette={pipette}
      onChange={(value) => setColor(key, value)}
    />
  );

  return (
    <FieldSet className={cn("gap-m border border-tertiary bg-primary-soft p-l")}>
      <AdvancedToggle form={form} presetDesign={presetDesign} />

      {advancedMode && (
        <div className={cn("flex flex-col gap-lg border-t border-tertiary pt-l")}>
          <Alert>
            <AlertDescription>{t("advanced.risk")}</AlertDescription>
          </Alert>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("self-end")}
            onClick={() => form.setFieldValue("advancedDesign", presetDesign)}
          >
            <RotateCcwIcon strokeWidth="var(--stroke-icon)" />
            {t("advanced.reset")}
          </Button>

          <Accordion
            type="multiple"
            defaultValue={["layout"]}
            className={cn("flex flex-col gap-s")}
          >
            <Section value="layout" title={t("advanced.sizes")}>
              <Metrics keys={sections.sizes} design={design} onChange={setMetric} />
            </Section>

            <Section
              value="typography"
              title={t("advanced.typography")}
              className={cn("flex flex-col gap-m")}
            >
              <Metrics keys={sections.typography} design={design} onChange={setMetric} />
              {fonts.map((key) => (
                <form.AppField key={key} name={`advancedDesign.${key}`}>
                  {(field) => (
                    <field.SelectField label={t(`advanced.${key}`)} options={FONT_OPTIONS} />
                  )}
                </form.AppField>
              ))}
            </Section>

            <Section
              value="colors"
              title={t("advanced.colors")}
              className={cn("flex flex-col gap-lg")}
            >
              <FieldSet className={cn("gap-m")}>
                <FieldTitle>{t("advanced.surfaceColors")}</FieldTitle>
                {style === "bloom" ? (
                  <MetricSlider
                    metric="backdropBlur"
                    value={design.backdropBlur}
                    onChange={setMetric}
                  />
                ) : (
                  colorField("backgroundColor")
                )}
                {hasCode && colorField("codeColor")}
              </FieldSet>
              <FieldSet className={cn("gap-m")}>
                <FieldTitle>{t("advanced.textColors")}</FieldTitle>
                {sections.textColors.map(colorField)}
              </FieldSet>
            </Section>

            {showPalette && (
              <PaletteFields
                form={form}
                design={design}
                pipette={pipette}
                onMetric={setMetric}
                onColor={setColor}
              />
            )}

            <Section value="spacing" title={t("advanced.spacing")}>
              <Metrics keys={sections.spacing} design={design} onChange={setMetric} />
            </Section>
          </Accordion>
        </div>
      )}
    </FieldSet>
  );
}
