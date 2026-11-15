import { type ResultAsync, err, ok, errAsync, okAsync } from "neverthrow";
import { z, type infer as zInfer, type ZodMiniType } from "zod/mini";
import { type AlbumEdition, type AlbumKind, type AlbumProvider, type AlbumSummary } from "./types";
import { type AlbumDetail, type AlbumTrack } from "@freetsy/poster";
import { requestJson } from "@freetsy/catalog";
import i18n from "@freetsy/i18n";

const ITUNES_COUNTRY = "US";

function itunesGet<T>(
  path: string,
  params: Record<string, string>,
  schema: ZodMiniType<T>,
  signal?: AbortSignal,
): ResultAsync<T, Error> {
  const url = new URL(`https://itunes.apple.com${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  return requestJson({ url, schema, signal, errorMessage: i18n.t("errors.itunesUnreachable") });
}

const itunesSearchResultSchema = z.object({
  collectionId: z.number(),
  collectionName: z.string(),
  artistName: z.string(),
  releaseDate: z.optional(z.string()),
  trackCount: z.optional(z.number()),
});

const itunesSearchResponseSchema = z.object({
  results: z.array(itunesSearchResultSchema),
});

function kindOf(collectionName: string): AlbumKind {
  if (collectionName.endsWith(" - Single")) return "single";
  if (collectionName.endsWith(" - EP")) return "ep";
  return "album";
}

function searchAlbums(query: string, signal?: AbortSignal): ResultAsync<AlbumSummary[], Error> {
  const trimmed = query.trim();
  if (!trimmed) return okAsync([]);

  return itunesGet(
    "/search",
    { term: trimmed, entity: "album", media: "music", limit: "10", country: ITUNES_COUNTRY },
    itunesSearchResponseSchema,
    signal,
  ).map((data) =>
    data.results.map((item) => ({
      id: String(item.collectionId),
      source: "itunes" as const,
      name: item.collectionName,
      artist: item.artistName,
      year: item.releaseDate?.slice(0, 4) ?? "",
      kind: kindOf(item.collectionName),
      trackCount: item.trackCount ?? 0,
      releaseCount: 0,
    })),
  );
}

const itunesLookupEntrySchema = z.object({
  wrapperType: z.enum(["collection", "track"]),
  collectionId: z.number(),
  collectionName: z.string(),
  artistName: z.string(),
  releaseDate: z.string(),
  collectionViewUrl: z.optional(z.string()),
  trackNumber: z.optional(z.number()),
  trackName: z.optional(z.string()),
  trackTimeMillis: z.optional(z.number()),
});

type ItunesLookupEntry = zInfer<typeof itunesLookupEntrySchema>;

const itunesLookupResponseSchema = z.object({
  results: z.array(itunesLookupEntrySchema),
});

function getAlbumDetails(
  albumId: string,
  _releaseId?: string,
  signal?: AbortSignal,
): ResultAsync<AlbumDetail, Error> {
  if (!/^\d+$/.test(albumId)) {
    return errAsync(new Error(i18n.t("errors.albumNotFoundPickAgain", { id: albumId })));
  }

  return itunesGet(
    "/lookup",
    { id: albumId, entity: "song", country: ITUNES_COUNTRY },
    itunesLookupResponseSchema,
    signal,
  ).andThen((data) => {
    const collection = data.results.find((r) => r.wrapperType === "collection");
    if (!collection) return err(new Error(i18n.t("errors.albumNotFound", { id: albumId })));

    const trackEntries = data.results.filter(
      (r): r is ItunesLookupEntry & { trackName: string; trackTimeMillis: number } =>
        r.wrapperType === "track" && typeof r.trackTimeMillis === "number",
    );

    const tracks: AlbumTrack[] = trackEntries.map((t, i) => ({
      number: t.trackNumber ?? i + 1,
      name: t.trackName,
      durationMs: t.trackTimeMillis,
    }));

    return ok({
      id: String(collection.collectionId),
      source: "itunes" as const,
      name: collection.collectionName,
      artist: collection.artistName,
      releaseDate: collection.releaseDate.slice(0, 10),
      releaseDatePrecision: "day" as const,
      tracks,
      totalDurationMs: tracks.reduce((sum, t) => sum + t.durationMs, 0),
      numbered: true,
      sourceUrl: collection.collectionViewUrl ?? "",
      recordLabel: "",
    });
  });
}

function listEditions(): ResultAsync<AlbumEdition[], Error> {
  return okAsync([]);
}

export const itunesProvider: AlbumProvider = {
  id: "itunes",
  searchAlbums,
  getAlbumDetails,
  listEditions,
};
