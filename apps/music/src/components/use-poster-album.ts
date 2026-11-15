import { useCallback, useRef } from "react";
import { type AlbumDetail, CONTENT_FIELDS, albumContent, editableContent } from "@freetsy/poster";
import { useSelectedAlbum } from "../album/use-selected-album";
import type { PosterFormApi } from "@freetsy/workshop";

export function usePosterAlbum(form: PosterFormApi) {
  const albumDefaults = useRef<AlbumDetail | null>(null);
  const fill = useCallback(
    (album: AlbumDetail) => {
      albumDefaults.current = album;
      const filled = editableContent(albumContent(album));
      form.setFieldValue("content.title", filled.title);
      form.setFieldValue("content.subtitle", filled.subtitle);
      form.setFieldValue("content.releaseDate", filled.releaseDate);
      form.setFieldValue("content.format", filled.format);
      form.setFieldValue("content.tracks", filled.tracks);
      form.setFieldValue("content.freeformText", filled.freeformText);
      form.setFieldValue("content.sourceUrl", filled.sourceUrl);
    },
    [form],
  );

  const selection = useSelectedAlbum(fill);

  return {
    ...selection,
    reset() {
      if (albumDefaults.current) {
        fill(albumDefaults.current);
        return;
      }

      for (const field of CONTENT_FIELDS) form.resetField(`content.${field}`);
    },
  };
}

export type PosterAlbum = ReturnType<typeof usePosterAlbum>;
