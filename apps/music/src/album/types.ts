import type { ResultAsync } from "neverthrow";
import { type AlbumDetail } from "@freetsy/poster";

type AlbumSource = "itunes" | "musicbrainz" | "manual";

export type SearchableSource = Exclude<AlbumSource, "manual">;

export type AlbumKind = "album" | "single" | "ep";

export type AlbumSummary = {
  id: string;
  source: SearchableSource;
  name: string;
  artist: string;
  year: string;
  kind: AlbumKind;
  trackCount: number;
  releaseCount: number;
};

export type AlbumRef = Pick<AlbumSummary, "id" | "source">;

export type AlbumEdition = {
  releaseId: string;
  trackCount: number;
  releaseDate: string;
  format: string;
};

export type AlbumProvider = {
  readonly id: SearchableSource;
  searchAlbums: (query: string, signal?: AbortSignal) => ResultAsync<AlbumSummary[], Error>;
  getAlbumDetails: (
    albumId: string,
    releaseId?: string,
    signal?: AbortSignal,
  ) => ResultAsync<AlbumDetail, Error>;
  listEditions: (albumId: string, signal?: AbortSignal) => ResultAsync<AlbumEdition[], Error>;
};
