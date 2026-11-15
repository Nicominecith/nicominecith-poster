import { ResultAsync, errAsync, okAsync } from "neverthrow";
import {
  articleUrl,
  extractStorySummary,
  getArticleText,
  pickReleaseDate,
  shortenToSentences,
  wikisFor,
} from "@freetsy/catalog";
import {
  getAuthorWorks,
  getEditions,
  getWork,
  getWorkSummary,
  workUrl,
  type OpenLibraryEdition,
  type OpenLibraryWork,
  type WorkSummary,
} from "./openlibrary";
import {
  BOOK_CREDIT_KEYS,
  type BookCredit,
  type BookCreditKey,
  type BookDetail,
  type BookListEntry,
} from "./types";
import { getBookWikidata, WORK_ID, type BookWikidataRow } from "./wikidata";
import i18n from "@freetsy/i18n";

const EDITION_LANGUAGE: Record<string, string> = { de: "ger", en: "eng" };

const CHAPTER_LIMIT = 40;
const CHARACTER_LIMIT = 15;
const WORK_LIMIT = 12;
const CREDIT_VALUE_LIMIT = 3;

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best = "";
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function median(values: number[]): number {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function localizedEditions(editions: OpenLibraryEdition[], language: string): OpenLibraryEdition[] {
  const code = EDITION_LANGUAGE[language] ?? "eng";
  return editions.filter((edition) => edition.languages.includes(code));
}

export function pickTitle(
  work: OpenLibraryWork,
  editions: OpenLibraryEdition[],
  wikidataLabel: string,
  language: string,
): string {
  return (
    wikidataLabel ||
    mostCommon(localizedEditions(editions, language).map((edition) => edition.title)) ||
    work.title
  );
}

const NO_PUBLISHER = /independently published|createspace|books on demand|lulu\.com|kindle direct/i;

export function pickPublisher(editions: OpenLibraryEdition[], language: string): string {
  const firstPublisher = (edition: OpenLibraryEdition) =>
    edition.publishers.filter((publisher) => !NO_PUBLISHER.test(publisher)).slice(0, 1);
  const fromLocal = mostCommon(localizedEditions(editions, language).flatMap(firstPublisher));
  return fromLocal || mostCommon(editions.flatMap(firstPublisher));
}

export function pickPages(
  editions: OpenLibraryEdition[],
  language: string,
  fallback: number,
): number {
  return (
    median(localizedEditions(editions, language).map((edition) => edition.pages)) ||
    fallback ||
    median(editions.map((edition) => edition.pages))
  );
}

export function cleanChapterTitle(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const stripped = trimmed
    .replace(
      /^(?:(?:chapter|kapitel|chapitre|cap[ií]tulo|capitolo|teil|part)\s+)?(?:\d+|[ivxlc]+)\s*[.:)\-–—]\s+/i,
      "",
    )
    .trim();
  return stripped || trimmed;
}

export function pickChapters(editions: OpenLibraryEdition[], language: string): BookListEntry[] {
  const withContents = editions.filter((edition) => edition.contents.length >= 2);
  const preferred = [
    ...localizedEditions(withContents, language),
    ...localizedEditions(withContents, "en"),
    ...withContents,
  ];
  const edition = preferred[0];
  if (!edition) return [];
  const topLevel = Math.min(...edition.contents.map((item) => item.level));
  return edition.contents
    .filter((item) => item.level === topLevel)
    .map((item) => ({
      name: cleanChapterTitle(item.title || item.label),
      detail: item.page.trim(),
    }))
    .filter((entry) => entry.name)
    .slice(0, CHAPTER_LIMIT);
}

function rankedNames(rows: BookWikidataRow[], limit: number, language = ""): string[] {
  const best = new Map<string, number>();
  for (const row of rows) {
    if (language === "de" && /^\p{Ll}/u.test(row.value)) continue;
    best.set(row.value, Math.max(best.get(row.value) ?? 0, Number(row.links) || 0));
  }
  return [...best.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export function pickWorks(
  wikidataWorks: BookWikidataRow[],
  authorWorks: Array<BookListEntry & { id: string }>,
  self: { id: string; titles: string[] },
): BookListEntry[] {
  const skip = new Set(self.titles.map(titleKey));
  const byYear = (a: BookListEntry, b: BookListEntry) =>
    (a.detail || "9999").localeCompare(b.detail || "9999");

  const fromWikidata = new Map<string, string>();
  for (const row of wikidataWorks) {
    if (skip.has(titleKey(row.value))) continue;
    const year = row.extra;
    const known = fromWikidata.get(row.value);
    if (known === undefined || (year && (!known || year < known)))
      fromWikidata.set(row.value, year);
  }
  if (fromWikidata.size >= 2) {
    return [...fromWikidata.entries()]
      .map(([name, detail]) => ({ name, detail }))
      .sort(byYear)
      .slice(0, WORK_LIMIT);
  }

  const seen = new Set(skip);
  const works: BookListEntry[] = [];
  for (const work of authorWorks) {
    const key = titleKey(work.name);
    if (work.id === self.id || !key || seen.has(key)) continue;
    seen.add(key);
    works.push({ name: work.name, detail: work.detail });
    if (works.length >= WORK_LIMIT) break;
  }
  return works.sort(byYear);
}

export function cleanDescription(text: string): string[] {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\(\[[^\]]*\]\[\d+\]\)/g, "")
    .replace(/\[([^\]]*)\]\[\d+\]/g, "$1")
    .replace(/[*_]{2,}/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line && !/^-{3,}$/.test(line) && !/^\[\d+\]:/.test(line));
}

function subjectGenres(subjects: string[]): string[] {
  return subjects
    .filter(
      (subject) =>
        !subject.includes(":") &&
        !/fiction|juvenile|accessible|protected|open library|large type|in library|readers?$/i.test(
          subject,
        ) &&
        subject.length <= 30,
    )
    .slice(0, CREDIT_VALUE_LIMIT);
}

export type BookSources = {
  id: string;
  language: string;
  work: OpenLibraryWork;
  summary: WorkSummary;
  editions: OpenLibraryEdition[];
  wikidata: BookWikidataRow[];
  authorWorks: Array<BookListEntry & { id: string }>;
};

export type BookSeries = { name: string; position: string };

export type LoadedBook = BookDetail & { series: BookSeries };

export function bookFromSources(sources: BookSources): Omit<
  BookDetail,
  "summary" | "summarySource"
> & {
  series: BookSeries;
  article: { wiki: string; title: string } | null;
  description: string[];
} {
  const { id, language, work, summary, editions, wikidata, authorWorks } = sources;
  const ofKind = (kind: string) => wikidata.filter((row) => row.kind === kind);
  const title = pickTitle(work, editions, ofKind("label")[0]?.value ?? "", language);
  const authors = summary.authors;

  const articles = ofKind("article").map((row) => ({
    wiki: /^https:\/\/(\w+)\.wikipedia\.org\//.exec(row.extra)?.[1] ?? "",
    title: row.value,
  }));
  const article =
    wikisFor(language)
      .map((wiki) => articles.find((candidate) => candidate.wiki === wiki))
      .find(Boolean) ?? null;

  const wikidataDate = pickReleaseDate(ofKind("date"));
  const date = wikidataDate.releaseDate
    ? wikidataDate
    : { releaseDate: summary.firstYear, releaseDatePrecision: "year" as const };

  const seriesRow = ofKind("series")[0];
  const series: BookSeries = { name: seriesRow?.value ?? "", position: seriesRow?.extra ?? "" };

  const characters = ofKind("character");
  const places = ofKind("place");
  const genres = ofKind("genre");
  const values: Record<BookCreditKey, string[]> = {
    author: authors,
    series: series.name ? [series.name] : [],
    genre:
      genres.length > 0
        ? rankedNames(genres, CREDIT_VALUE_LIMIT, language)
        : subjectGenres(work.subjects),
    form: rankedNames(ofKind("form"), 1, language),
    publisher: [pickPublisher(editions, language)].filter(Boolean),
    places:
      places.length > 0
        ? rankedNames(places, CREDIT_VALUE_LIMIT, language)
        : work.places.slice(0, CREDIT_VALUE_LIMIT),
    era: work.times.slice(0, 2),
    language: rankedNames(ofKind("language"), 1),
  };
  const credits: BookCredit[] = BOOK_CREDIT_KEYS.flatMap((key) =>
    values[key].length > 0 ? [{ key, values: values[key] }] : [],
  );

  return {
    id,
    title,
    authors,
    ...date,
    pageCount: pickPages(editions, language, summary.medianPages),
    chapters: pickChapters(editions, language),
    characters: (characters.length > 0
      ? rankedNames(characters, CHARACTER_LIMIT)
      : work.people.slice(0, CHARACTER_LIMIT)
    ).map((name) => ({ name, detail: "" })),
    works: pickWorks(ofKind("work"), authorWorks, {
      id,
      titles: [title, work.title, series.name].filter(Boolean),
    }),
    firstSentence: (ofKind("firstLine")[0]?.value ?? work.firstSentence)
      .replace(/\s+/g, " ")
      .trim(),
    credits,
    series,
    sourceUrl: article ? articleUrl(article.wiki, article.title) : workUrl(id),
    article,
    description: cleanDescription(work.description),
  };
}

export function getBookDetail(
  id: string,
  language: string,
  signal?: AbortSignal,
): ResultAsync<LoadedBook, Error> {
  if (!WORK_ID.test(id)) return errAsync(new Error(i18n.t("errors.bookNotFound", { id })));

  const optional = <T>(result: ResultAsync<T, Error>, fallback: T) =>
    result.orElse(() => okAsync(fallback));
  const noSummary: WorkSummary = { authors: [], authorKey: "", firstYear: "", medianPages: 0 };

  return ResultAsync.combine([
    getWork(id, signal),
    optional(getWorkSummary(id, signal), noSummary),
    optional(getEditions(id, signal), []),
    optional(getBookWikidata(id, language, signal), []),
  ]).andThen(([work, summary, editions, wikidata]) =>
    optional(getAuthorWorks(summary.authorKey || work.authorKey, signal), []).andThen(
      (authorWorks) => {
        const { article, description, ...book } = bookFromSources({
          id,
          language,
          work,
          summary,
          editions,
          wikidata,
          authorWorks,
        });
        return optional(
          article ? getArticleText(article.wiki, article.title, signal) : okAsync(""),
          "",
        ).map((text) => {
          const fromArticle = text ? extractStorySummary(text) : "";
          if (fromArticle && article) {
            return {
              ...book,
              summary: fromArticle,
              summarySource: {
                kind: "wikipedia" as const,
                title: article.title,
                url: articleUrl(article.wiki, article.title),
                shortened: fromArticle !== extractStorySummary(text, Number.POSITIVE_INFINITY),
              },
            };
          }
          const fromDescription = shortenToSentences(description).join("\n");
          return {
            ...book,
            summary: fromDescription,
            summarySource: fromDescription
              ? {
                  kind: "openlibrary" as const,
                  url: workUrl(id),
                  shortened: fromDescription !== description.join("\n"),
                }
              : null,
          };
        });
      },
    ),
  );
}
