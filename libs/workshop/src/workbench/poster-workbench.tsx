import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { defaultCoverAspect, presetDesign, type PosterKind } from "@freetsy/poster";
import { Button } from "@freetsy/ui/components/button";
import {
  Card,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@freetsy/ui/components/card";
import { cn } from "@freetsy/ui/lib/utils";
import { CoverCropDialog } from "../cover/cover-crop-dialog";
import { CoverFields } from "../cover/cover-fields";
import { useAutoCover } from "../cover/use-auto-cover";
import type { CoverHint } from "@freetsy/catalog";
import { Spinner } from "@freetsy/ui/components/spinner";
import { useAppSettings } from "../app/app-settings";
import { usePosterCover } from "../cover/use-poster-cover";
import { useColorPipette } from "../design/use-color-pipette";
import { PosterExportFields } from "../export/poster-export-fields";
import { PosterPreviewCard } from "../preview/poster-preview-card";
import { PageHeader } from "./page-header";
import { TweakFields } from "./tweak-fields";
import type { PosterFormApi } from "./use-poster-form";
import { usePosterOutput } from "./use-poster-output";

type PosterWorkbenchProps = {
  kind: PosterKind;
  form: PosterFormApi;
  importing: boolean;
  onCancelImport: () => void;
  cancelImportLabel: string;
  contentFields: ReactNode;
  coverHint?: CoverHint | null;
};

export function PosterWorkbench({
  kind,
  form,
  importing,
  onCancelImport,
  cancelImportLabel,
  contentFields,
  coverHint = null,
}: PosterWorkbenchProps) {
  const { t } = useTranslation();
  const values = useSelector(form.store, (state) => state.values);
  const cover = usePosterCover(defaultCoverAspect(kind));
  const { autoCover } = useAppSettings();
  const spotifyUrl = values.spotifyUrl.trim();
  useAutoCover(
    cover,
    coverHint ? { ...coverHint, spotifyUrl } : null,
    defaultCoverAspect(kind),
    autoCover,
  );
  const output = usePosterOutput(values, cover.cover, kind);
  const pipette = useColorPipette();
  const [exportPending, setExportPending] = useState(false);
  const handleExportPending = useCallback((pending: boolean) => setExportPending(pending), []);
  const { cancel: cancelPipette } = pipette;
  const busy = importing || exportPending;

  useEffect(() => {
    if (!values.advancedMode) cancelPipette();
  }, [values.advancedMode, cancelPipette]);

  if (!cover.cover) {
    return (
      <>
        <CoverCropDialog cover={cover} />
        <div className={cn("flex min-h-upload-stage items-center justify-center")}>
          <Spinner />
        </div>
      </>
    );
  }

  const { spec } = output;

  return (
    <>
      <CoverCropDialog cover={cover} />
      <PageHeader kind={kind} />
      <div className={cn("grid grid-cols-1 gap-xl md:grid-cols-editor md:items-start")}>
        <PosterPreviewCard
          kind={kind}
          values={values}
          output={output}
          cover={cover.cover}
          pipette={pipette}
        />

        <Card asChild>
          <aside>
            <CardHeader>
              <CardEyebrow>{t("settings.eyebrow")}</CardEyebrow>
              <CardTitle>{spec ? spec.title : t("settings.newPoster")}</CardTitle>
              {spec && <CardDescription>{spec.artist}</CardDescription>}
            </CardHeader>

            {importing && (
              <Button variant="outline" onClick={onCancelImport}>
                {cancelImportLabel}
              </Button>
            )}
            <fieldset
              disabled={busy}
              inert={busy}
              className={cn(
                "flex min-w-0 flex-col gap-xl transition-opacity",
                busy && "opacity-50",
              )}
            >
              <CoverFields cover={cover} uploaded={cover.cover} />
              {contentFields}
              {spec && (
                <TweakFields
                  form={form}
                  kind={kind}
                  spec={spec}
                  presetDesign={presetDesign(values, spec, output)}
                  hasCode={output.posterCode !== null}
                  pipette={pipette}
                  qrUrlIsCustom={output.qrUrlIsCustom}
                  spotifyLinkIsInvalid={output.spotifyLinkIsInvalid}
                />
              )}
            </fieldset>
            {spec && (
              <PosterExportFields
                form={form}
                exportParams={output.exportParams}
                inputValid={output.inputValid}
                onPendingChange={handleExportPending}
              />
            )}
          </aside>
        </Card>
      </div>
    </>
  );
}
