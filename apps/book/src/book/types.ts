import type { ReleaseDatePrecision, TextSource } from "@freetsy/poster";

export type BookSummary = {
  id: string;
  title: string;
  authors: string;
  year: string;
  editionCount: number;
};

export type BookListEntry = { name: string; detail: string };

export const BOOK_CREDIT_KEYS = [
  "author",
  "series",
  "genre",
  "form",
  "publisher",
  "places",
  "era",
  "language",
] as const;

export type BookCreditKey = (typeof BOOK_CREDIT_KEYS)[number];

export type BookCredit = { key: BookCreditKey; values: string[] };

export type BookDetail = {
  id: string;
  title: string;
  authors: string[];
  releaseDate: string;
  releaseDatePrecision: ReleaseDatePrecision;
  pageCount: number;
  chapters: BookListEntry[];
  characters: BookListEntry[];
  works: BookListEntry[];
  firstSentence: string;
  summary: string;
  summarySource: TextSource | null;
  credits: BookCredit[];
  sourceUrl: string;
};
