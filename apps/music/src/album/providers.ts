import { ResultAsync, err, ok } from "neverthrow";
import { itunesProvider } from "./itunes";
import { musicbrainzProvider } from "./musicbrainz";
import type { AlbumProvider, AlbumRef, AlbumSummary, SearchableSource } from "./types";

export const albumProviders: Record<SearchableSource, AlbumProvider> = {
  itunes: itunesProvider,
  musicbrainz: musicbrainzProvider,
};

export function albumKey(album: AlbumRef): string {
  return `${album.source}:${album.id}`;
}

function interleave(albumsByProvider: AlbumSummary[][]): AlbumSummary[] {
  const deepest = Math.max(0, ...albumsByProvider.map((albums) => albums.length));
  return Array.from({ length: deepest }, (_, rank) =>
    albumsByProvider.flatMap((albums) => albums.slice(rank, rank + 1)),
  ).flat();
}

export function searchAlbums(
  query: string,
  signal?: AbortSignal,
): ResultAsync<AlbumSummary[], Error> {
  const searches = Object.values(albumProviders).map((provider) =>
    provider.searchAlbums(query, signal),
  );
  return ResultAsync.fromSafePromise(Promise.all(searches)).andThen((results) => {
    const found = results.flatMap((result) => (result.isOk() ? [result.value] : []));
    const [failure] = results.flatMap((result) => (result.isErr() ? [result.error] : []));
    return found.length === 0 && failure ? err(failure) : ok(interleave(found));
  });
}
