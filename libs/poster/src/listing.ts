import { type ContentFormat, type ListKind, parseReleaseDate } from "./album/content";
import type { EditableContent, ListEntry } from "./content";
import { splitIntoColumns, type AlbumTextInfo, type PosterTrack } from "./spec";

export type ListingKind = "film" | "book";

export const WORKSHOP_FORMATS: Record<ListingKind, ContentFormat[]> = {
  film: ["cast", "awards", "quote", "freeform"],
  book: ["chapters", "characters", "works", "quote", "freeform"],
};

const TYPED_COUNT = /^\d{1,5}$/;

export function isValidCount(value: string): boolean {
  return !value.trim() || TYPED_COUNT.test(value.trim());
}

export function parseCount(typed: string): number {
  const text = typed.trim();
  return TYPED_COUNT.test(text) ? Number(text) : 0;
}

export function isNumberedList(format: string): boolean {
  return format === "chapters";
}

function listRows(entries: ListEntry[], numbered: boolean, showDetails: boolean): PosterTrack[] {
  const named = entries
    .map((entry) => ({
      name: entry.name.trim(),
      detail: showDetails ? entry.detail.trim() : "",
      emphasized: entry.emphasized ?? false,
    }))
    .filter((entry) => entry.name);
  const width = Math.max(2, String(named.length).length);
  return named.map((entry, index) => ({
    number: index + 1,
    numberLabel: numbered ? String(index + 1).padStart(width, "0") : String(index + 1),
    name: entry.name,
    durationLabel: entry.detail,
    emphasized: entry.emphasized,
  }));
}

function textRows(text: string): PosterTrack[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({
      number: index + 1,
      numberLabel: String(index + 1),
      name,
      durationLabel: "",
      emphasized: false,
    }));
}

function rowsFor(content: EditableContent, showDetails: boolean): PosterTrack[] {
  const { format } = content;
  if (format === "quote") return textRows(content.quote);
  if (format === "freeform" || format === "tracklist") return textRows(content.freeformText);
  return listRows(content.lists[format satisfies ListKind], isNumberedList(format), showDetails);
}

export function listingTextInfo(
  content: EditableContent,
  kind: ListingKind,
  showDetails = true,
): AlbumTextInfo {
  return {
    kind,
    albumId: "manual",
    title: content.title,
    artist: content.subtitle,
    ...parseReleaseDate(content.releaseDate),
    totalDurationMs: kind === "film" ? parseCount(content.runtime) * 60_000 : 0,
    pageCount: kind === "book" ? parseCount(content.pages) : 0,
    columns: splitIntoColumns(rowsFor(content, showDetails)),
    numbered: isNumberedList(content.format),
    sourceUrl: content.sourceUrl,
    recordLabel: "",
  };
}
