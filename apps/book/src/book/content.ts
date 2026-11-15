import type { EditableContent, InfoCredit, ListEntry } from "@freetsy/poster";
import type { BookSeries, LoadedBook } from "./detail";
import type { BookCreditKey, BookListEntry } from "./types";

const SHOWN_BY_DEFAULT = new Set<BookCreditKey>(["series", "genre"]);

type BookFields = Pick<
  EditableContent,
  "title" | "subtitle" | "releaseDate" | "freeformText" | "sourceUrl" | "pages" | "quote"
> & {
  chapters: ListEntry[];
  characters: ListEntry[];
  works: ListEntry[];
  credits: InfoCredit[];
  creditOptions: InfoCredit[];
};

const withoutKey = ({ label, value }: InfoCredit): InfoCredit => ({ label, value });

function entries(list: BookListEntry[]): ListEntry[] {
  return list.map((entry) => ({ name: entry.name, detail: entry.detail, emphasized: false }));
}

export function bookContent(
  book: LoadedBook,
  labelFor: (key: BookCreditKey) => string,
  seriesValue: (series: BookSeries) => string,
): BookFields {
  const credits = book.credits.map((credit) => ({
    key: credit.key,
    label: labelFor(credit.key),
    value: credit.key === "series" ? seriesValue(book.series) : credit.values.join(", "),
  }));
  return {
    title: book.title,
    subtitle: book.authors.join(", "),
    releaseDate: book.releaseDate,
    pages: book.pageCount > 0 ? String(book.pageCount) : "",
    chapters: entries(book.chapters),
    characters: entries(book.characters),
    works: entries(book.works),
    quote: book.firstSentence,
    freeformText: book.summary,
    sourceUrl: book.sourceUrl,
    credits: credits.filter(({ key }) => SHOWN_BY_DEFAULT.has(key)).map(withoutKey),
    creditOptions: credits.map(withoutKey),
  };
}

export function bookStartFormat(fields: BookFields): EditableContent["format"] {
  if (fields.chapters.length > 0) return "chapters";
  if (fields.characters.length > 0) return "characters";
  return "freeform";
}
