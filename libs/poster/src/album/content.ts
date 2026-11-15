import type { AlbumDetail, AlbumTrack, ReleaseDatePrecision } from "./types";

export const LIST_KINDS = ["cast", "awards", "chapters", "characters", "works"] as const;

export type ListKind = (typeof LIST_KINDS)[number];

export type ContentFormat = "tracklist" | "freeform" | "quote" | ListKind;

export type ContentTrack = {
  title: string;
  duration: string;
  emphasized?: boolean;
  durationMs?: number;
};

export type AlbumContent = {
  title: string;
  subtitle: string;
  releaseDate: string;
  format: ContentFormat;
  tracks: ContentTrack[];
  freeformText: string;
  sourceUrl: string;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const DATE_FORMATS: ReadonlyArray<{
  pattern: RegExp;
  precision: ReleaseDatePrecision;
  format: (match: RegExpExecArray) => string | null;
}> = [
  {
    pattern: /^(\d{4})-(\d{2})-(\d{2})$/,
    precision: "day",
    format([, y, m, d]) {
      const year = Number(y);
      const month = Number(m);
      const day = Number(d);
      return isRealDate(year, month, day) ? `${y}-${m}-${d}` : null;
    },
  },
  {
    pattern: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    precision: "day",
    format([, d, m, y]) {
      const year = Number(y);
      const month = Number(m);
      const day = Number(d);
      return isRealDate(year, month, day) ? `${y}-${pad2(month)}-${pad2(day)}` : null;
    },
  },
  {
    pattern: /^(\d{4})-(\d{2})$/,
    precision: "month",
    format: ([, y, m]) => (Number(m) >= 1 && Number(m) <= 12 ? `${y}-${m}` : null),
  },
  {
    pattern: /^(\d{1,2})\.(\d{4})$/,
    precision: "month",
    format([, m, y]) {
      const month = Number(m);
      return month >= 1 && month <= 12 ? `${y}-${pad2(month)}` : null;
    },
  },
  {
    pattern: /^(\d{4})$/,
    precision: "year",
    format: ([, y]) => y,
  },
];

const NO_DATE = { releaseDate: "", releaseDatePrecision: "year" as const };

export function parseReleaseDate(typed: string): {
  releaseDate: string;
  releaseDatePrecision: ReleaseDatePrecision;
} {
  const text = typed.replace(/\s/g, "");
  if (!text) return NO_DATE;

  for (const { pattern, precision, format } of DATE_FORMATS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const releaseDate = format(match);
    if (releaseDate) return { releaseDate, releaseDatePrecision: precision };
  }

  return NO_DATE;
}

const TYPED_DURATION = /^(?:(\d+):)?(\d+):([0-5]\d)$/;

function parseDurationMs(typed: string): number {
  const match = TYPED_DURATION.exec(typed.trim());
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return ((Number(hours ?? 0) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000;
}

const SECONDS_PER_HOUR = 3600;

function formatDuration(ms: number): string {
  if (ms <= 0) return "";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

function tracksFromRows(rows: ContentTrack[]): AlbumTrack[] {
  return rows
    .map((row) => ({
      name: row.title.trim(),
      emphasized: row.emphasized ?? false,
      durationMs:
        row.durationMs !== undefined && formatDuration(row.durationMs) === row.duration.trim()
          ? row.durationMs
          : parseDurationMs(row.duration),
    }))
    .filter((track) => track.name)
    .map((track, index) => ({ ...track, number: index + 1 }));
}

function tracksFromFreeText(text: string): AlbumTrack[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({ number: index + 1, name, durationMs: 0 }));
}

export function contentAlbumDetail(album: AlbumContent): AlbumDetail {
  const isTracklist = album.format === "tracklist";
  const tracks = isTracklist
    ? tracksFromRows(album.tracks)
    : tracksFromFreeText(album.freeformText);

  return {
    id: "manual",
    source: "manual",
    name: album.title,
    artist: album.subtitle,
    ...parseReleaseDate(album.releaseDate),
    tracks,
    totalDurationMs: tracks.reduce((sum, track) => sum + track.durationMs, 0),
    numbered: isTracklist,
    sourceUrl: album.sourceUrl,
    recordLabel: "",
  };
}

export function albumContent(album: AlbumDetail): AlbumContent {
  const tracks = album.tracks.map((track) => ({
    title: track.name,
    duration: formatDuration(track.durationMs),
    durationMs: track.durationMs,
    emphasized: track.emphasized ?? false,
  }));

  return {
    title: album.name,
    subtitle: album.artist,
    releaseDate: album.releaseDate,
    format: "tracklist",
    tracks,
    freeformText: tracks.map((track) => track.title).join("\n"),
    sourceUrl: album.sourceUrl,
  };
}

export function isValidReleaseDate(value: string): boolean {
  return !value.trim() || Boolean(parseReleaseDate(value).releaseDate);
}

export function isValidDuration(value: string): boolean {
  if (!value.trim()) return true;
  const match = TYPED_DURATION.exec(value.trim());
  return Boolean(
    match && (!match[1] || Number(match[2]) < 60) && Number.isSafeInteger(parseDurationMs(value)),
  );
}
