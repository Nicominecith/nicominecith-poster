import { useSelector } from "@tanstack/react-form";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  DPI_OPTIONS,
  EXPORT_FORMATS,
  hasFixedPixels,
  isValidCustomMm,
  MAX_CUSTOM_MM,
  MIN_CUSTOM_MM,
  POSTER_FORMATS,
} from "@freetsy/poster";
import type { PosterExportParams } from "@freetsy/renderer/export";
import type { PosterFormApi } from "../workbench/use-poster-form";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { SettingsSection } from "../workbench/settings-layout";
import { cn } from "@freetsy/ui/lib/utils";
import { PosterFileExport } from "./poster-file-export";
export function PosterExportFields({
  form,
  exportParams,
  inputValid,
  onPendingChange,
}: {
  form: PosterFormApi;
  exportParams: PosterExportParams | null;
  inputValid: boolean;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const exportFormat = useSelector(form.store, (state) => state.values.exportFormat);
  const formatId = useSelector(form.store, (state) => state.values.formatId);
  const isPixelFormat = useSelector(form.store, (state) => hasFixedPixels(state.values.formatId));
  return (
    <SettingsSection title={t("settings.export")}>
      <form.AppField name="formatId">
        {(field) => (
          <field.SelectField
            label={t("settings.format")}
            options={POSTER_FORMATS.map((format) => ({
              value: format.id,
              label: t(`formats.${format.id}`),
            }))}
          />
        )}
      </form.AppField>

      {formatId === "custom" && (
        <div className={cn("grid grid-cols-2 gap-m")}>
          <form.AppField
            name="customWidthMm"
            validators={{
              onChange: ({ value }) =>
                isValidCustomMm(value)
                  ? undefined
                  : t("validation.size", { min: MIN_CUSTOM_MM, max: MAX_CUSTOM_MM }),
            }}
          >
            {(field) => (
              <field.NumberField
                label={t("settings.widthMm")}
                min={MIN_CUSTOM_MM}
                max={MAX_CUSTOM_MM}
              />
            )}
          </form.AppField>
          <form.AppField
            name="customHeightMm"
            validators={{
              onChange: ({ value }) =>
                isValidCustomMm(value)
                  ? undefined
                  : t("validation.size", { min: MIN_CUSTOM_MM, max: MAX_CUSTOM_MM }),
            }}
          >
            {(field) => (
              <field.NumberField
                label={t("settings.heightMm")}
                min={MIN_CUSTOM_MM}
                max={MAX_CUSTOM_MM}
              />
            )}
          </form.AppField>
        </div>
      )}

      <form.AppField name="exportFormat">
        {(field) => (
          <field.ToggleField
            label={t("settings.fileFormat")}
            options={EXPORT_FORMATS.map((option) => ({
              value: option,
              label: option.toUpperCase(),
            }))}
          />
        )}
      </form.AppField>
      <form.AppField name="dpi">
        {(field) => (
          <field.ToggleField
            label={t("settings.resolution")}
            disabled={isPixelFormat}
            description={isPixelFormat ? t("settings.resolutionFixed") : undefined}
            options={DPI_OPTIONS.map((option) => ({
              value: option,
              label: String(option),
            }))}
          />
        )}
      </form.AppField>
      <div className={cn("flex flex-col gap-m")}>
        {!inputValid && (
          <Alert variant="destructive">
            <AlertDescription>{t("validation.posterInput")}</AlertDescription>
          </Alert>
        )}
        <Alert>
          <AlertDescription>
            <Trans
              i18nKey="settings.rightsNotice"
              components={{
                terms: (
                  <Link to="/nutzungsbedingungen" className={cn("underline hover:text-primary")} />
                ),
              }}
            />
          </AlertDescription>
        </Alert>
        <PosterFileExport
          key={i18n.resolvedLanguage}
          format={exportFormat}
          params={exportParams}
          disabled={!inputValid}
          onPendingChange={onPendingChange}
        />
      </div>
    </SettingsSection>
  );
}
