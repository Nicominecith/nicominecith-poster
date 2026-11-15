import { Trans } from "react-i18next";
import { createCatalog } from "@freetsy/catalog";
import { CC_BY_SA_URL, defineCatalogWorkshop, SourceLink } from "@freetsy/workshop";
import { filmContent } from "./film/content";
import type { FilmDetail, FilmSummary } from "./film/types";
import { getFilmDetail, searchFilms } from "./film/wikidata";

const filmCatalog = createCatalog<FilmSummary, FilmDetail>({
  id: "film",
  search: (query, { language, signal }) => searchFilms(query, language, signal),
  detail: (id, { language, signal }) => getFilmDetail(id, language, signal),
});

export const filmWorkshop = defineCatalogWorkshop({
  kind: "film",
  catalog: filmCatalog,
  toHit: (film, t) => ({
    id: film.id,
    title: film.title,
    facts: [film.year, film.directors].filter(Boolean).join(" · "),
    source: "Wikidata",
    tag: film.isSeries ? t("filmSearch.kindSeries") : t("filmSearch.kindFilm"),
  }),
  toSummary: (film, t) => ({
    title: film.title,
    facts: [
      film.directors.join(", "),
      film.cast.length > 0 ? t("filmSearch.castCount", { count: film.cast.length }) : "",
    ]
      .filter(Boolean)
      .join(" · "),
  }),
  coverHint: (film) => ({
    kind: "film",
    title: film.title,
    creator: film.directors[0],
    wikidataId: film.id,
  }),
  toContent(film, t) {
    const { cast, awards, ...content } = filmContent(film, (key) => t(`filmCredits.${key}`));
    return {
      ...content,
      lists: { cast, awards },
      textSource: film.summarySource,
      format: cast.length === 0 && content.freeformText ? "freeform" : undefined,
    };
  },
  sources({ id, detail }) {
    const wikipedia = detail?.summarySource?.kind === "wikipedia" ? detail.summarySource : null;
    return (
      <Trans
        i18nKey={wikipedia ? "filmSearch.sources_wikipedia" : "filmSearch.sources_none"}
        values={{ title: wikipedia?.title ?? "" }}
        components={{
          wikidata: <SourceLink href={`https://www.wikidata.org/wiki/${id}`} />,
          wikipedia: <SourceLink href={wikipedia?.url ?? ""} />,
          license: <SourceLink href={CC_BY_SA_URL} />,
        }}
      />
    );
  },
});
