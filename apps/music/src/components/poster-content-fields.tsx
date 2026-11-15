import { lazy, Suspense, useMemo } from "react";
import { useSelector } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { isValidDuration, newTrackRow, type TrackRow } from "@freetsy/poster";
import { Field, FieldDescription, FieldTitle } from "@freetsy/ui/components/field";
import { touchOnChange } from "@freetsy/ui/form";
import { cn } from "@freetsy/ui/lib/utils";
import { ContentSection, TextScaleField, type PosterFormApi } from "@freetsy/workshop";
import { AlbumSearchField } from "./album-search-field";
import { SelectedAlbumCard } from "./selected-album-card";
import type { PosterAlbum } from "./use-poster-album";

const TracklistEditor = lazy(() =>
  import("./tracklist-editor").then((module) => ({ default: module.TracklistEditor })),
);

function AlbumSearch({ album }: { album: PosterAlbum }) {
  if (album.album) {
    return (
      <SelectedAlbumCard
        album={album.album}
        albumQuery={album.query}
        editionChoice={album.editions}
        onSelect={album.select}
        onReset={album.reset}
        onCancel={album.cancel}
      />
    );
  }

  return (
    <>
      <FieldDescription>
        <Trans
          i18nKey="search.note"
          components={{
            privacy: <Link to="/datenschutz" className={cn("underline hover:text-primary")} />,
          }}
        />
      </FieldDescription>
      <AlbumSearchField onSelect={(hit) => album.select({ id: hit.id, source: hit.source })} />
    </>
  );
}

function TracklistField({ form }: { form: PosterFormApi }) {
  const { t } = useTranslation();
  const defaultTracks = useMemo<TrackRow[]>(
    () => t("contentDefaults.tracks", { returnObjects: true }).map(newTrackRow),
    [t],
  );

  return (
    <form.AppField
      name="content.tracks"
      validators={{
        onChange: ({ value }) =>
          value.every((track) => !track.title.trim() || isValidDuration(track.duration))
            ? undefined
            : t("validation.duration"),
      }}
      defaultValue={defaultTracks}
      listeners={touchOnChange}
    >
      {(field) => (
        <Field>
          <FieldTitle>{t("settings.tracklistLabel")}</FieldTitle>
          <FieldDescription>{t("settings.tracklistHint")}</FieldDescription>
          <Suspense fallback={null}>
            <TracklistEditor
              tracks={field.state.value}
              onChange={(next) => field.handleChange(next)}
            />
          </Suspense>
        </Field>
      )}
    </form.AppField>
  );
}

function FreeformField({ form }: { form: PosterFormApi }) {
  const { t } = useTranslation();
  const defaultText = useMemo(
    () =>
      t("contentDefaults.tracks", { returnObjects: true })
        .map((track) => track.title)
        .join("\n"),
    [t],
  );

  return (
    <>
      <form.AppField
        name="content.freeformText"
        defaultValue={defaultText}
        listeners={touchOnChange}
      >
        {(field) => (
          <field.TextareaField
            label={t("settings.freeformLabel")}
            placeholder={t("settings.freeformPlaceholder")}
            rows={6}
          />
        )}
      </form.AppField>
      <TextScaleField form={form} />
    </>
  );
}

export function PosterContentFields({ form, album }: { form: PosterFormApi; album: PosterAlbum }) {
  const { t } = useTranslation();
  const format = useSelector(form.store, (state) => state.values.content.format);

  return (
    <ContentSection form={form} kind="music" search={<AlbumSearch album={album} />}>
      <form.AppField name="content.format">
        {(field) => (
          <field.ToggleField
            label={t("settings.contentFormat")}
            options={[
              { value: "tracklist", label: t("settings.contentFormatList") },
              { value: "freeform", label: t("settings.contentFormatFreeform") },
            ]}
          />
        )}
      </form.AppField>

      {format === "tracklist" ? <TracklistField form={form} /> : <FreeformField form={form} />}
    </ContentSection>
  );
}
