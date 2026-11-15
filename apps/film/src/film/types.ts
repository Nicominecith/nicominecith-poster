import type { ReleaseDatePrecision, TextSource } from "@freetsy/poster";

export type FilmSummary = {
  id: string;
  title: string;
  year: string;
  directors: string;
  isSeries: boolean;
};

export type FilmCastCredit = {
  name: string;
  role: string;
};

export const FILM_CREDIT_KEYS = [
  "director",
  "writer",
  "composer",
  "cinematographer",
  "editor",
  "producer",
  "studio",
  "genre",
  "country",
  "language",
  "rating",
  "basedOn",
  "filmingLocation",
] as const;

export type FilmCreditKey = (typeof FILM_CREDIT_KEYS)[number];

export type FilmCredit = { key: FilmCreditKey; values: string[] };

export type FilmDetail = {
  id: string;
  title: string;
  directors: string[];
  releaseDate: string;
  releaseDatePrecision: ReleaseDatePrecision;
  runtimeMinutes: number;
  cast: FilmCastCredit[];
  awards: FilmCastCredit[];
  credits: FilmCredit[];
  summary: string;
  summarySource: TextSource | null;
  sourceUrl: string;
};
