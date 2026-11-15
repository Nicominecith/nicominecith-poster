import { type ResultAsync, err, okAsync } from "neverthrow";
import { z, type infer as zInfer, type ZodMiniType } from "zod/mini";
import { type AlbumDetail, type AlbumTrack } from "@freetsy/poster";
import { type AlbumEdition, type AlbumKind, type AlbumProvider, type AlbumSummary } from "./types";
import { requestJson } from "@freetsy/catalog";
import i18n from "@freetsy/i18n";

const MUSICBRAINZ_WS = "https://musicbrainz.org/ws/2";

function musicbrainzGet<T>(
  path: string,
  params: Record<string, string>,
  schema: ZodMiniType<T>,
  signal?: AbortSignal,
): ResultAsync<T, Error> {
  const url = new URL(`${MUSICBRAINZ_WS}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("fmt", "json");

  return requestJson({
    url,
    schema,
    signal,
    errorMessage: i18n.t("errors.musicbrainzUnreachable"),
  });
}

const artistCreditSchema = z.optional(z.array(z.object({ name: z.string() })));

const searchResponseSchema = z.object({
  "release-groups": z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      "artist-credit": artistCreditSchema,
      "first-release-date": z.optional(z.string()),
      "primary-type": z.nullish(z.string()),
      count: z.nullish(z.number()),
    }),
  ),
});

function kindOf(primaryType: string | null | undefined): AlbumKind {
  if (primaryType === "Single") return "single";
  if (primaryType === "EP") return "ep";
  return "album";
}

function searchAlbums(query: string, signal?: AbortSignal): ResultAsync<AlbumSummary[], Error> {
  const trimmed = query.trim();
  if (!trimmed) return okAsync([]);

  return musicbrainzGet(
    "/release-group",
    { query: trimmed, limit: "10" },
    searchResponseSchema,
    signal,
  ).map((data) =>
    data["release-groups"].map((releaseGroup) => ({
      id: releaseGroup.id,
      source: "musicbrainz" as const,
      name: releaseGroup.title,
      artist: releaseGroup["artist-credit"]?.[0]?.name ?? "",
      year: releaseGroup["first-release-date"]?.slice(0, 4) ?? "",
      kind: kindOf(releaseGroup["primary-type"]),
      trackCount: 0,
      releaseCount: releaseGroup.count ?? 0,
    })),
  );
}

const mediumStubSchema = z.object({
  format: z.nullish(z.string()),
  "track-count": z.nullish(z.number()),
});

type MediumStub = zInfer<typeof mediumStubSchema>;

const releaseStubSchema = z.object({
  id: z.string(),
  status: z.nullish(z.string()),
  date: z.nullish(z.string()),
  media: z.optional(z.array(mediumStubSchema)),
});

type ReleaseStub = zInfer<typeof releaseStubSchema>;

const releaseGroupLookupSchema = z.object({
  title: z.string(),
  "artist-credit": artistCreditSchema,
  "first-release-date": z.nullish(z.string()),
  releases: z.optional(z.array(releaseStubSchema)),
});

const mediumSchema = z.object({
  format: z.nullish(z.string()),
  tracks: z.optional(
    z.array(
      z.object({
        title: z.string(),
        length: z.nullish(z.number()),
        recording: z.optional(z.object({ length: z.nullish(z.number()) })),
      }),
    ),
  ),
});

type Medium = zInfer<typeof mediumSchema>;

const releaseLookupSchema = z.object({
  date: z.nullish(z.string()),
  "artist-credit": artistCreditSchema,
  media: z.array(mediumSchema),
});

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  return values.find((value) => value && value.length > 0) ?? "";
}

function datePrecisionOf(date: string): "year" | "month" | "day" {
  const parts = date.split("-");
  if (parts.length >= 3) return "day";
  if (parts.length === 2) return "month";
  return "year";
}

function timedTrackCount(media: Medium[]): number {
  return media.reduce(
    (sum, medium) =>
      sum +
      (medium.tracks ?? []).filter((track) => (track.length ?? track.recording?.length ?? 0) > 0)
        .length,
    0,
  );
}

function pickMediaOfOneFormat(media: Medium[]): Medium[] {
  const byFormat = new Map<string, Medium[]>();
  for (const medium of media) {
    const key = medium.format ?? "";
    const group = byFormat.get(key);
    if (group) group.push(medium);
    else byFormat.set(key, [medium]);
  }

  const groups = [...byFormat.values()];
  if (groups.length <= 1) return media;
  return groups.reduce((best, group) =>
    timedTrackCount(group) > timedTrackCount(best) ? group : best,
  );
}

function effectiveTrackCount(media: MediumStub[] | undefined): number {
  const byFormat = new Map<string, number>();
  for (const medium of media ?? []) {
    const key = medium.format ?? "";
    byFormat.set(key, (byFormat.get(key) ?? 0) + (medium["track-count"] ?? 0));
  }
  return Math.max(0, ...byFormat.values());
}

function isPlainerThan(candidate: ReleaseStub, current: ReleaseStub): boolean {
  const candidateMedia = (candidate.media ?? []).length;
  const currentMedia = (current.media ?? []).length;
  if (candidateMedia !== currentMedia) return candidateMedia < currentMedia;
  return firstNonEmpty(candidate.date) < firstNonEmpty(current.date);
}

function widestFormat(media: MediumStub[] | undefined): string {
  const byFormat = new Map<string, number>();
  for (const medium of media ?? []) {
    const key = medium.format ?? "";
    byFormat.set(key, (byFormat.get(key) ?? 0) + (medium["track-count"] ?? 0));
  }
  let best = "";
  let bestCount = -1;
  for (const [format, count] of byFormat) {
    if (count > bestCount) {
      best = format;
      bestCount = count;
    }
  }
  return best;
}

function pickRepresentativeRelease(releases: ReleaseStub[] | undefined): ReleaseStub | undefined {
  if (!releases || releases.length === 0) return undefined;
  return releases.find((release) => release.status === "Official") ?? releases[0];
}

function getAlbumDetails(
  releaseGroupId: string,
  releaseId?: string,
  signal?: AbortSignal,
): ResultAsync<AlbumDetail, Error> {
  return musicbrainzGet(
    `/release-group/${releaseGroupId}`,
    { inc: "releases" },
    releaseGroupLookupSchema,
    signal,
  ).andThen((releaseGroup) => {
    const chosenId = releaseId ?? pickRepresentativeRelease(releaseGroup.releases)?.id;
    if (!chosenId) return err(new Error(i18n.t("errors.noTracklist")));

    return musicbrainzGet(
      `/release/${chosenId}`,
      { inc: "recordings artist-credits" },
      releaseLookupSchema,
      signal,
    ).map((fullRelease) => {
      const tracks: AlbumTrack[] = pickMediaOfOneFormat(fullRelease.media)
        .flatMap((medium) => medium.tracks ?? [])
        .map((track, index): AlbumTrack => ({
          number: index + 1,
          name: track.title,
          durationMs: track.length ?? track.recording?.length ?? 0,
        }));

      const artist =
        fullRelease["artist-credit"]?.[0]?.name ?? releaseGroup["artist-credit"]?.[0]?.name ?? "";
      const releaseDate = firstNonEmpty(fullRelease.date, releaseGroup["first-release-date"]);

      return {
        id: releaseGroupId,
        source: "musicbrainz" as const,
        name: releaseGroup.title,
        artist,
        releaseDate,
        releaseDatePrecision: datePrecisionOf(releaseDate),
        tracks,
        totalDurationMs: tracks.reduce((sum, t) => sum + t.durationMs, 0),
        numbered: true,
        sourceUrl: `https://musicbrainz.org/release-group/${releaseGroupId}`,
        recordLabel: "",
      };
    });
  });
}

function listEditions(
  releaseGroupId: string,
  signal?: AbortSignal,
): ResultAsync<AlbumEdition[], Error> {
  return musicbrainzGet(
    `/release-group/${releaseGroupId}`,
    { inc: "releases media" },
    releaseGroupLookupSchema,
    signal,
  ).map((releaseGroup) => {
    const releases = releaseGroup.releases ?? [];
    const official = releases.filter((release) => release.status === "Official");
    const candidates = official.length > 0 ? official : releases;

    const byTrackCount = new Map<number, ReleaseStub>();
    for (const release of candidates) {
      const count = effectiveTrackCount(release.media);
      if (count === 0) continue;
      const current = byTrackCount.get(count);
      if (!current || isPlainerThan(release, current)) byTrackCount.set(count, release);
    }

    if (byTrackCount.size <= 1) return [];

    return [...byTrackCount.entries()]
      .map(([trackCount, release]) => ({
        releaseId: release.id,
        trackCount,
        releaseDate: firstNonEmpty(release.date),
        format: widestFormat(release.media),
      }))
      .sort((a, b) => a.trackCount - b.trackCount);
  });
}

export const musicbrainzProvider: AlbumProvider = {
  id: "musicbrainz",
  searchAlbums,
  getAlbumDetails,
  listEditions,
};
