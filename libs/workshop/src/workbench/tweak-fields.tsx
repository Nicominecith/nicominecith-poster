import { useTranslation } from "react-i18next";
import {
  MAX_PAD_SCALE,
  MIN_PAD_SCALE,
  POSTER_STYLES,
  POSTER_TEXT_ALIGNS,
  SCALE_STEP,
  type PosterKind,
  type AdvancedPosterDesign,
  type PosterSpec,
} from "@freetsy/poster";
import { PosterAdvancedFields } from "../design/poster-advanced-fields";
import type { ColorPipette } from "../design/use-color-pipette";
import { CodeFields } from "./code-fields";
import { SettingsSection } from "./settings-layout";
import type { PosterFormApi } from "./use-poster-form";

export function TweakFields({
  form,
  kind,
  spec,
  presetDesign,
  hasCode,
  pipette,
  qrUrlIsCustom,
  spotifyLinkIsInvalid,
}: {
  form: PosterFormApi;
  kind: PosterKind;
  spec: PosterSpec;
  presetDesign: AdvancedPosterDesign;
  hasCode: boolean;
  pipette: ColorPipette;
  qrUrlIsCustom: boolean;
  spotifyLinkIsInvalid: boolean;
}) {
  const { t } = useTranslation();

  return (
    <SettingsSection title={t("settings.tweaks")}>
      <form.Subscribe selector={(state) => state.values.style}>
        {(style) => (
          <form.AppField name="style">
            {(field) => (
              <field.SelectField
                label={t("settings.style")}
                options={POSTER_STYLES.map((option) => ({ value: option.id, label: option.label }))}
                description={t(`styles.${style}`)}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>

      <form.AppField name="titleAlign">
        {(field) => (
          <field.ToggleField
            label={t("settings.titleAlign")}
            description={t("settings.titleAlignHint")}
            options={POSTER_TEXT_ALIGNS.map((value) => ({
              value,
              label: t(`settings.titleAlign_${value}`),
            }))}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={(state) => state.values.advancedMode}>
        {(advancedMode) =>
          !advancedMode && (
            <form.AppField name="padScale">
              {(field) => (
                <field.SliderField
                  label={t("settings.padding", { percent: Math.round(field.state.value * 100) })}
                  min={MIN_PAD_SCALE}
                  max={MAX_PAD_SCALE}
                  step={SCALE_STEP}
                />
              )}
            </form.AppField>
          )
        }
      </form.Subscribe>

      <form.AppField name="showPalette">
        {(field) => <field.CheckboxField label={t("settings.showPalette")} />}
      </form.AppField>

      <CodeFields
        form={form}
        kind={kind}
        sourceUrl={spec.sourceUrl}
        qrUrlIsCustom={qrUrlIsCustom}
        spotifyLinkIsInvalid={spotifyLinkIsInvalid}
      />

      <PosterAdvancedFields
        form={form}
        presetDesign={presetDesign}
        spec={spec}
        hasCode={hasCode}
        pipette={pipette}
      />
    </SettingsSection>
  );
}
