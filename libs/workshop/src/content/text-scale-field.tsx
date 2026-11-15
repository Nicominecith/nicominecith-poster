import { useTranslation } from "react-i18next";
import { MAX_FREEFORM_TEXT_SCALE, MIN_FREEFORM_TEXT_SCALE, SCALE_STEP } from "@freetsy/poster";
import type { PosterFormApi } from "../workbench/use-poster-form";

export function TextScaleField({ form }: { form: PosterFormApi }) {
  const { t } = useTranslation();
  return (
    <form.Subscribe selector={(state) => state.values.advancedMode}>
      {(advancedMode) =>
        !advancedMode && (
          <form.AppField name="freeformTextScale">
            {(field) => (
              <field.SliderField
                label={t("settings.textScale", { percent: Math.round(field.state.value * 100) })}
                min={MIN_FREEFORM_TEXT_SCALE}
                max={MAX_FREEFORM_TEXT_SCALE}
                step={SCALE_STEP}
              />
            )}
          </form.AppField>
        )
      }
    </form.Subscribe>
  );
}
