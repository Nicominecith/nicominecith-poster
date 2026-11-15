export type ReleaseDatePrecision = "year" | "month" | "day";

export type AlbumTrack = {
  number: number;
  name: string;
  durationMs: number;
  emphasized?: boolean;
};

export type AlbumDetail = {
  id: string;
  source: string;
  name: string;
  artist: string;
  releaseDate: string;
  releaseDatePrecision: ReleaseDatePrecision;
  tracks: AlbumTrack[];
  totalDurationMs: number;
  numbered: boolean;
  sourceUrl: string;
  recordLabel: string;
};
