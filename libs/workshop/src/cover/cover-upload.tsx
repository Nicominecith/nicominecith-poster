import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Button } from "@freetsy/ui/components/button";
import { cn } from "@freetsy/ui/lib/utils";

export function CoverUpload({
  previewUrl,
  onFile,
  onRemove,
  error,
  size = "default",
  showPreview = true,
}: {
  previewUrl: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  error: string | null;
  size?: "default" | "lg";
  showPreview?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className={cn("hidden")}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
    />
  );

  if (previewUrl) {
    return (
      <div className={cn("flex flex-col gap-s")}>
        {showPreview && (
          <div
            className={cn(
              "relative aspect-square w-full overflow-hidden border border-tertiary bg-tertiary-soft",
            )}
          >
            <img
              src={previewUrl}
              alt={t("upload.previewAlt")}
              className={cn("size-full object-cover")}
            />
          </div>
        )}
        <div className={cn("flex gap-s")}>
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className={cn("flex-1")}
          >
            {t("upload.replace")}
          </Button>
          <Button variant="destructive" onClick={onRemove}>
            {t("upload.remove")}
          </Button>
        </div>
        {fileInput}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-s")}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex aspect-square w-full cursor-pointer flex-col items-center justify-center border-dashed text-center transition-colors",
          size === "lg" ? "gap-l border-4 p-xl" : "gap-s border-2 p-l",
          isDragOver ? "border-accent bg-accent-soft" : "border-tertiary hover:border-primary",
        )}
      >
        <span
          className={cn(
            "font-mono-ui tracking-ui text-secondary uppercase",
            size === "lg" ? "text-xl" : "text-xs",
          )}
        >
          {t("upload.title")}
        </span>
        <span
          className={cn("font-mono-ui text-secondary-soft", size === "lg" ? "text-sm" : "text-2xs")}
        >
          {t("upload.hint")}
        </span>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {fileInput}
    </div>
  );
}
