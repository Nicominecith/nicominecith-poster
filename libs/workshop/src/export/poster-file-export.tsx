import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { ExportFormatId } from "@freetsy/poster";
import type { PosterExportParams } from "@freetsy/renderer/export";
import { Button } from "@freetsy/ui/components/button";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Spinner } from "@freetsy/ui/components/spinner";
import { cn } from "@freetsy/ui/lib/utils";

async function createFile({
  params,
  format,
  signal,
  onProgress,
}: {
  params: PosterExportParams;
  format: ExportFormatId;
  signal: AbortSignal;
  onProgress: (fraction: number) => void;
}) {
  const { createPosterFile } = await import("@freetsy/renderer/export");
  signal.throwIfAborted();
  onProgress(0.02);
  const result = await createPosterFile(params, { format, signal, onProgress });
  signal.throwIfAborted();
  return result.match(
    (file) => file,
    (error) => {
      throw error;
    },
  );
}

function exportFailure(t: TFunction, format: ExportFormatId, error: Error | null): string {
  const reason = error?.message.trim();
  return reason
    ? t("settings.exportFailedReason", { format: format.toUpperCase(), reason })
    : t("settings.exportFailed", { format: format.toUpperCase() });
}

export function PosterFileExport({
  params,
  format,
  disabled,
  onPendingChange,
}: {
  params: PosterExportParams | null;
  format: ExportFormatId;
  disabled: boolean;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t } = useTranslation();
  const controller = useRef<AbortController | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const {
    mutate,
    reset,
    data: file,
    isPending,
    isError,
    error,
  } = useMutation({ mutationFn: createFile, gcTime: 0 });
  const downloadUrl = useRef<string | null>(null);
  const inputFingerprint = JSON.stringify(params, (_key, value: unknown) =>
    value instanceof Blob ? { size: value.size, type: value.type } : value,
  );
  useEffect(() => {
    controller.current?.abort();
    reset();
    setSaveError(false);
    setProgress(0);
    return () => {
      controller.current?.abort();
    };
  }, [inputFingerprint, format, reset]);
  useEffect(() => {
    onPendingChange(isPending);
    return () => onPendingChange(false);
  }, [isPending, onPendingChange]);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    downloadUrl.current = url;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    return () => {
      URL.revokeObjectURL(url);
      downloadUrl.current = null;
    };
  }, [file]);
  function cancel() {
    controller.current?.abort();
    reset();
    setProgress(0);
  }
  function start() {
    if (!params) return;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setProgress(0.01);
    mutate({ params, format, signal: next.signal, onProgress: setProgress });
  }
  async function save() {
    if (!file || !downloadUrl.current) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      if ("canShare" in navigator && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const anchor = document.createElement("a");
        anchor.href = downloadUrl.current;
        anchor.download = file.name;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      }
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === "AbortError")) setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }
  const aborted = error?.name === "AbortError";
  const isLarge = Boolean(params && params.widthPx * params.heightPx > 64_000_000);
  return (
    <>
      {file ? (
        <>
          <p role="status" className={cn("font-mono-ui text-xs wrap-anywhere text-secondary")}>
            {t("settings.exportReady", { name: file.name })}
          </p>
          <Button size="lg" className={cn("w-full")} disabled={disabled || isSaving} onClick={save}>
            {t("settings.exportSave", { format: format.toUpperCase() })}
          </Button>
        </>
      ) : (
        <Button
          size="lg"
          className={cn("w-full")}
          disabled={disabled || !params || isPending}
          aria-busy={isPending}
          onClick={start}
        >
          {isPending && <Spinner />}
          {isPending
            ? t("settings.exportProgress", {
                format: format.toUpperCase(),
                progress: Math.min(100, Math.max(0, Math.round(progress * 100))),
              })
            : t("settings.exportCreate", { format: format.toUpperCase() })}
        </Button>
      )}
      {isPending && (
        <>
          {isLarge && (
            <Alert>
              <AlertDescription>{t("settings.exportLarge")}</AlertDescription>
            </Alert>
          )}
          <Button variant="outline" className={cn("w-full")} onClick={cancel}>
            {t("settings.exportCancel")}
          </Button>
        </>
      )}
      {((isError && !aborted) || saveError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {saveError ? t("settings.exportSaveFailed") : exportFailure(t, format, error)}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
