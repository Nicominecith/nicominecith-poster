import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  COVER_SHAPES,
  coverShapeAspect,
  coverShapeOf,
  type CoverShapeId,
  type UploadedCover,
} from "@freetsy/poster";
import { Field, FieldDescription, FieldTitle } from "@freetsy/ui/components/field";
import { ToggleGroup, ToggleGroupItem } from "@freetsy/ui/components/toggle-group";
import { cn } from "@freetsy/ui/lib/utils";
import { SettingsSection } from "../workbench/settings-layout";
import { CoverUpload } from "./cover-upload";
import type { PosterCover } from "./use-poster-cover";

function CoverShapeField({
  shape,
  onChange,
}: {
  shape: CoverShapeId;
  onChange: (next: CoverShapeId) => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();

  return (
    <Field>
      <FieldTitle id={labelId}>{t("settings.coverShape")}</FieldTitle>
      <FieldDescription>{t("settings.coverShapeHint")}</FieldDescription>
      <ToggleGroup
        type="single"
        value={shape}
        aria-labelledby={labelId}
        onValueChange={(next) => {
          const picked = COVER_SHAPES.find((option) => option.id === next);
          if (picked && picked.id !== shape) onChange(picked.id);
        }}
      >
        {COVER_SHAPES.map((option) => (
          <ToggleGroupItem key={option.id} value={option.id} className={cn("flex-1")}>
            {t(`settings.coverShape_${option.id}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}

export function CoverFields({ cover, uploaded }: { cover: PosterCover; uploaded: UploadedCover }) {
  const { t } = useTranslation();

  return (
    <SettingsSection title={t("settings.image")}>
      <Field>
        <FieldTitle>{t("settings.cover")}</FieldTitle>
        <CoverUpload
          previewUrl={uploaded.objectUrl}
          onFile={cover.upload}
          onRemove={cover.remove}
          error={cover.failure}
          showPreview={false}
        />
        {cover.isProcessing && <FieldDescription>{t("upload.processing")}</FieldDescription>}
      </Field>
      <CoverShapeField
        shape={coverShapeOf(uploaded.aspect)}
        onChange={(shape) => cover.recrop(coverShapeAspect(shape))}
      />
    </SettingsSection>
  );
}
