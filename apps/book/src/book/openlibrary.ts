import { type ResultAsync, okAsync } from "neverthrow";
import { z, type infer as zInfer, type ZodMiniType } from "zod/mini";
import { requestJson } from "@freetsy/catalog";
import type { BookListEntry, BookSummary } from "./types";
import i18n from "@freetsy/i18n";

const OPEN_LIBRARY = "https://openlibrary.org";
const SEARCH_LIMIT = 12;

function openLibraryGet<T>(
  path: string,
  params: Record<string, string>,
  schema: ZodMiniType<T>,
  signal?: AbortSignal,
): ResultAsync<T, Error> {
  const url = new URL(`${OPEN_LIBRARY}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return requestJson({
    url,
    schema,
    signal,
    errorMessage: i18n.t("errors.openLibraryUnreachable"),
  });
}

function olId(key: string): string {
  return key.slice(key.lastIndexOf("/") + 1);
}

const searchSchema = z.object({
  docs: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      author_name: z.optional(z.array(z.string())),
      first_publish_year: z.optional(z.number()),
      edition_count: z.optional(z.number()),
    }),
  ),
});

export function searchBooks(
  query: string,
  signal?: AbortSignal,
): ResultAsync<BookSummary[], Error> {
  const trimmed = query.trim();
  if (!trimmed) return okAsync([]);
  return openLibraryGet(
    "/search.json",
    {
      q: trimmed,
      limit: String(SEARCH_LIMIT),
      fields: "key,title,author_name,first_publish_year,edition_count",
    },
    searchSchema,
    signal,
  ).map((data) =>
    data.docs.map((doc) => ({
      id: olId(doc.key),
      title: doc.title,
      authors: (doc.author_name ?? []).join(", "),
      year: doc.first_publish_year ? String(doc.first_publish_year) : "",
      editionCount: doc.edition_count ?? 0,
    })),
  );
}

const textValue = z.union([z.string(), z.object({ value: z.string() })]);

function plain(text: zInfer<typeof textValue> | undefined): string {
  if (!text) return "";
  return typeof text === "string" ? text : text.value;
}

const workSchema = z.object({
  title: z.string(),
  description: z.optional(textValue),
  first_sentence: z.optional(textValue),
  excerpts: z.optional(
    z.array(z.object({ excerpt: z.optional(textValue), comment: z.optional(z.string()) })),
  ),
  subject_people: z.optional(z.array(z.string())),
  subject_places: z.optional(z.array(z.string())),
  subject_times: z.optional(z.array(z.string())),
  subjects: z.optional(z.array(z.string())),
  authors: z.optional(z.array(z.object({ author: z.optional(z.object({ key: z.string() })) }))),
});

export type OpenLibraryWork = {
  title: string;
  description: string;
  firstSentence: string;
  people: string[];
  places: string[];
  times: string[];
  subjects: string[];
  authorKey: string;
};

export function getWork(id: string, signal?: AbortSignal): ResultAsync<OpenLibraryWork, Error> {
  return openLibraryGet(`/works/${id}.json`, {}, workSchema, signal).map((work) => ({
    title: work.title,
    description: plain(work.description),
    firstSentence:
      plain(work.first_sentence) ||
      plain(
        work.excerpts?.find((excerpt) => /first sentence/i.test(excerpt.comment ?? ""))?.excerpt,
      ),
    people: work.subject_people ?? [],
    places: work.subject_places ?? [],
    times: work.subject_times ?? [],
    subjects: work.subjects ?? [],
    authorKey: olId(work.authors?.[0]?.author?.key ?? ""),
  }));
}

const editionsSchema = z.object({
  entries: z.array(
    z.object({
      title: z.optional(z.string()),
      languages: z.optional(z.array(z.object({ key: z.string() }))),
      number_of_pages: z.optional(z.number()),
      publishers: z.optional(z.array(z.string())),
      table_of_contents: z.optional(
        z.array(
          z.object({
            level: z.optional(z.number()),
            label: z.optional(z.string()),
            title: z.optional(z.string()),
            pagenum: z.optional(z.string()),
          }),
        ),
      ),
    }),
  ),
});

export type OpenLibraryEdition = {
  title: string;
  languages: string[];
  pages: number;
  publishers: string[];
  contents: Array<{ level: number; label: string; title: string; page: string }>;
};

const EDITION_LIMIT = 100;

export function getEditions(
  id: string,
  signal?: AbortSignal,
): ResultAsync<OpenLibraryEdition[], Error> {
  return openLibraryGet(
    `/works/${id}/editions.json`,
    { limit: String(EDITION_LIMIT) },
    editionsSchema,
    signal,
  ).map((data) =>
    data.entries.map((edition) => ({
      title: edition.title ?? "",
      languages: (edition.languages ?? []).map((language) => olId(language.key)),
      pages: edition.number_of_pages ?? 0,
      publishers: edition.publishers ?? [],
      contents: (edition.table_of_contents ?? []).map((item) => ({
        level: item.level ?? 0,
        label: item.label ?? "",
        title: item.title ?? "",
        page: item.pagenum ?? "",
      })),
    })),
  );
}

const authorWorksSchema = z.object({
  docs: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      first_publish_year: z.optional(z.number()),
    }),
  ),
});

const AUTHOR_WORKS_LIMIT = 20;

export function getAuthorWorks(
  key: string,
  signal?: AbortSignal,
): ResultAsync<Array<BookListEntry & { id: string }>, Error> {
  if (!/^OL\d+A$/.test(key)) return okAsync([]);
  return openLibraryGet(
    "/search.json",
    {
      q: `author_key:${key}`,
      sort: "editions",
      limit: String(AUTHOR_WORKS_LIMIT),
      fields: "key,title,first_publish_year",
    },
    authorWorksSchema,
    signal,
  ).map((data) =>
    data.docs.map((doc) => ({
      id: olId(doc.key),
      name: doc.title,
      detail: doc.first_publish_year ? String(doc.first_publish_year) : "",
    })),
  );
}

export function workUrl(id: string): string {
  return `${OPEN_LIBRARY}/works/${id}`;
}

const workSummarySchema = z.object({
  docs: z.array(
    z.object({
      author_name: z.optional(z.array(z.string())),
      author_key: z.optional(z.array(z.string())),
      first_publish_year: z.optional(z.number()),
      number_of_pages_median: z.optional(z.number()),
    }),
  ),
});

export type WorkSummary = {
  authors: string[];
  authorKey: string;
  firstYear: string;
  medianPages: number;
};

export function getWorkSummary(id: string, signal?: AbortSignal): ResultAsync<WorkSummary, Error> {
  return openLibraryGet(
    "/search.json",
    {
      q: `key:/works/${id}`,
      limit: "1",
      fields: "author_name,author_key,first_publish_year,number_of_pages_median",
    },
    workSummarySchema,
    signal,
  ).map((data) => {
    const doc = data.docs[0];
    return {
      authors: doc?.author_name ?? [],
      authorKey: doc?.author_key?.[0] ?? "",
      firstYear: doc?.first_publish_year ? String(doc.first_publish_year) : "",
      medianPages: doc?.number_of_pages_median ?? 0,
    };
  });
}
