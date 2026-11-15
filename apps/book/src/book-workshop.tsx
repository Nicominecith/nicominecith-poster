import { Trans } from "react-i18next";
import { createCatalog } from "@freetsy/catalog";
import { CC_BY_SA_URL, defineCatalogWorkshop, SourceLink } from "@freetsy/workshop";
import { bookContent, bookStartFormat } from "./book/content";
import { getBookDetail, type LoadedBook } from "./book/detail";
import { searchBooks, workUrl } from "./book/openlibrary";
import type { BookSummary } from "./book/types";

const bookCatalog = createCatalog<BookSummary, LoadedBook>({
  id: "book",
  search: (query, { signal }) => searchBooks(query, signal),
  detail: (id, { language, signal }) => getBookDetail(id, language, signal),
});

export const bookWorkshop = defineCatalogWorkshop({
  kind: "book",
  catalog: bookCatalog,
  toHit: (book, t) => ({
    id: book.id,
    title: book.title,
    facts: [book.year, book.authors].filter(Boolean).join(" · "),
    source: "Open Library",
    tag: book.editionCount > 0 ? t("bookSearch.editionCount", { count: book.editionCount }) : "",
  }),
  toSummary: (book, t) => ({
    title: book.title,
    facts: [
      book.authors.join(", "),
      book.chapters.length > 0 ? t("bookSearch.chapterCount", { count: book.chapters.length }) : "",
    ]
      .filter(Boolean)
      .join(" · "),
  }),
  coverHint: (book) => ({
    kind: "book",
    title: book.title,
    creator: book.authors[0],
    openLibraryId: book.id,
  }),
  toContent(book, t) {
    const content = bookContent(
      book,
      (key) => t(`bookCredits.${key}`),
      (series) =>
        series.position
          ? t("book.seriesValue", { name: series.name, position: series.position })
          : series.name,
    );
    const { chapters, characters, works, quote, ...fields } = content;
    return {
      ...fields,
      quote: quote ? t("book.quoteValue", { text: quote }) : "",
      lists: { chapters, characters, works },
      textSource: book.summarySource,
      format: bookStartFormat(content),
    };
  },
  sources: ({ id, detail }) => (
    <Trans
      i18nKey={`bookSearch.sources_${detail?.summarySource?.kind ?? "none"}`}
      values={{
        title: detail?.summarySource?.kind === "wikipedia" ? detail.summarySource.title : "",
      }}
      components={{
        openlibrary: <SourceLink href={workUrl(id)} />,
        wikidata: <SourceLink href="https://www.wikidata.org/" />,
        wikipedia: <SourceLink href={detail?.summarySource?.url ?? ""} />,
        description: <SourceLink href={workUrl(id)} />,
        license: <SourceLink href={CC_BY_SA_URL} />,
      }}
    />
  ),
});
