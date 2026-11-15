import { queryOptions } from "@tanstack/react-query";
import type { ResultAsync } from "neverthrow";
import { albumProviders, searchAlbums } from "./providers";
import type { AlbumRef } from "./types";

function settle<T>(result: ResultAsync<T, Error>): Promise<T> {
  return result.match(
    (value) => value,
    (error) => {
      throw error;
    },
  );
}

const NO_ALBUM = new Error("No album selected");

export const albumQueries = {
  all: ["album"] as const,
  search: (query: string) =>
    queryOptions({
      queryKey: [...albumQueries.all, "search", query] as const,
      queryFn: ({ signal }) => settle(searchAlbums(query, signal)),
    }),
  detail: (album: AlbumRef | null, releaseId: string | null) =>
    queryOptions({
      queryKey: [...albumQueries.all, "detail", album?.source, album?.id, releaseId] as const,
      enabled: album !== null,
      queryFn: ({ signal }) =>
        album
          ? settle(
              albumProviders[album.source].getAlbumDetails(
                album.id,
                releaseId ?? undefined,
                signal,
              ),
            )
          : Promise.reject(NO_ALBUM),
    }),
  editions: (album: AlbumRef | null) =>
    queryOptions({
      queryKey: [...albumQueries.all, "editions", album?.source, album?.id] as const,
      enabled: album !== null,
      queryFn: ({ signal }) =>
        album
          ? settle(albumProviders[album.source].listEditions(album.id, signal))
          : Promise.reject(NO_ALBUM),
    }),
};
