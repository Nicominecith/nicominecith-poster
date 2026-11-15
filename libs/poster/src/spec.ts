import type { TFunction } from "i18next";
import { contentAlbumDetail, type AlbumContent } from "./album/content";
import type { AlbumDetail, AlbumTrack, ReleaseDatePrecision } from "./album/types";
import type { PosterKind } from "./kind";

export type PosterTrack = {
  number: number;
  numberLabel: string;
  name: string;
  durationLabel: string;
  emphasized: boolean;
};

export type PosterSpec = {
  albumId: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: string;
  releaseDatePrecision: ReleaseDatePrecision;
  totalDurationMs: number;
  columns: PosterTrack[][];
  numbered: boolean;
  palette: string[];
  sourceUrl: string;
  recordLabel: string;
  kind?: PosterKind;
  pageCount?: number;
  coverAspect?: number;
  extraCredits?: Array<{ label: string; value: string }>;
};

export type AlbumTextInfo = Omit<PosterSpec, "coverUrl" | "palette">;

function durationParts(ms: number): [minutes: string, seconds: string] | null {
  if (ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  return [String(Math.floor(totalSeconds / 60)), String(totalSeconds % 60).padStart(2, "0")];
}

function columnWidth(values: string[]): number {
  return Math.max(2, ...values.map((value) => value.length));
}

function printableTracks(tracks: AlbumTrack[]): PosterTrack[] {
  const parts = tracks.map((track) => durationParts(track.durationMs));
  const numberWidth = columnWidth(tracks.map((track) => String(track.number)));
  const minuteWidth = columnWidth(
    parts.filter((part): part is [string, string] => part !== null).map(([minutes]) => minutes),
  );

  return tracks.map((track, index) => {
    const part = parts[index];
    return {
      number: track.number,
      numberLabel: String(track.number).padStart(numberWidth, "0"),
      name: track.name,
      emphasized: track.emphasized ?? false,
      durationLabel: part ? `${part[0].padStart(minuteWidth, "0")}:${part[1]}` : "",
    };
  });
}

const MAX_SINGLE_COLUMN_TRACKS = 11;

export function splitIntoColumns<T>(items: T[]): T[][] {
  if (items.length <= MAX_SINGLE_COLUMN_TRACKS) return [items];
  const half = Math.ceil(items.length / 2);
  return [items.slice(0, half), items.slice(half)];
}

export function albumTextInfo(album: AlbumDetail): AlbumTextInfo {
  return {
    albumId: album.id,
    title: album.name,
    artist: album.artist,
    releaseDate: album.releaseDate,
    releaseDatePrecision: album.releaseDatePrecision,
    totalDurationMs: album.totalDurationMs,
    columns: splitIntoColumns(printableTracks(album.tracks)),
    numbered: album.numbered,
    sourceUrl: album.sourceUrl,
    recordLabel: album.recordLabel,
  };
}

export function contentTextInfo(content: AlbumContent): AlbumTextInfo {
  return albumTextInfo(contentAlbumDetail(content));
}

export function buildPosterSpec(
  info: AlbumTextInfo,
  coverUrl: string,
  palette: string[],
): PosterSpec {
  return { ...info, coverUrl, palette };
}

export type LocalizedPosterSpec = PosterSpec & {
  releaseDateLabel: string;
  totalLengthLabel: string;
};

function formatReleaseDate(
  date: string,
  precision: ReleaseDatePrecision,
  language: string,
): string {
  const [year, month, day] = date.split("-").map((part) => Number(part));
  if (!year) return "";

  if (precision === "day" && month && day) {
    return new Intl.DateTimeFormat(language, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
  if (precision === "month" && month) {
    return new Intl.DateTimeFormat(language, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  return `${year}`;
}

export function localizePosterSpec(
  spec: PosterSpec,
  language: string,
  t: TFunction,
): LocalizedPosterSpec {
  return {
    ...spec,
    releaseDateLabel: formatReleaseDate(spec.releaseDate, spec.releaseDatePrecision, language),
    totalLengthLabel: spec.pageCount
      ? t("poster.pagesValue", { count: spec.pageCount })
      : spec.totalDurationMs
        ? t("poster.lengthValue", {
            minutes: Math.max(1, Math.round(spec.totalDurationMs / 60_000)),
          })
        : "",
  };
}
