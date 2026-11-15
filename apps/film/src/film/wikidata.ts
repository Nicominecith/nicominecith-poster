import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import {
  articleUrl,
  bindingValue,
  extractStorySummary,
  getArticleText,
  itemId,
  labelLanguages,
  pickReleaseDate,
  sparqlGet,
  sparqlResponse,
  sparqlString,
  wikisFor,
} from "@freetsy/catalog";
import {
  FILM_CREDIT_KEYS,
  type FilmCastCredit,
  type FilmCredit,
  type FilmCreditKey,
  type FilmDetail,
  type FilmSummary,
} from "./types";
import i18n from "@freetsy/i18n";

const SEARCH_LIMIT = 12;
const CAST_LIMIT = 12;

const FILM_CLASS = {
  film: "Q11424",
  featureFilm: "Q24869",
  animatedFilm: "Q202866",
  documentaryFilm: "Q93204",
  televisionFilm: "Q506240",
  animeFilm: "Q20650540",
  televisionSeries: "Q5398426",
  miniseries: "Q1259759",
} as const;
const FILM_CLASSES = Object.values(FILM_CLASS);
const SERIES_CLASS = FILM_CLASS.televisionSeries;

const searchSchema = sparqlResponse({
  item: bindingValue,
  label: bindingValue,
  released: bindingValue,
  directors: bindingValue,
  series: bindingValue,
});

export function buildSearchQuery(query: string, language: string): string {
  const filter = FILM_CLASSES.map((id) => `P31=${id}`).join("|");
  return `SELECT ?item ?ordinal ?label ?series (MIN(?date) AS ?released)
  (GROUP_CONCAT(DISTINCT ?directorName; separator=", ") AS ?directors) WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org";
      wikibase:api "Search";
      mwapi:srsearch ${sparqlString(`${query} haswbstatement:${filter}`)}.
    ?item wikibase:apiOutputItem mwapi:title.
    ?ordinal wikibase:apiOrdinal true.
  }
  OPTIONAL { ?item wdt:P577 ?date. }
  OPTIONAL { ?item wdt:P57 ?director. }
  BIND(EXISTS { ?item wdt:P31/wdt:P279? wd:${SERIES_CLASS} } AS ?series)
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "${labelLanguages(language)}".
    ?item rdfs:label ?label. ?director rdfs:label ?directorName.
  }
}
GROUP BY ?item ?ordinal ?label ?series
ORDER BY ?ordinal
LIMIT ${SEARCH_LIMIT}`;
}

export function searchFilms(
  query: string,
  language: string,
  signal?: AbortSignal,
): ResultAsync<FilmSummary[], Error> {
  const trimmed = query.trim();
  if (!trimmed) return okAsync([]);

  return sparqlGet(buildSearchQuery(trimmed, language), searchSchema, signal).map((data) =>
    data.results.bindings.flatMap((row) => {
      if (!row.item) return [];
      const id = itemId(row.item.value);
      return [
        {
          id,
          title: row.label?.value ?? id,
          year: row.released?.value.slice(0, 4) ?? "",
          directors: row.directors?.value ?? "",
          isSeries: row.series?.value === "true",
        },
      ];
    }),
  );
}

const detailSchema = sparqlResponse({
  kind: bindingValue,
  value: bindingValue,
  extra: bindingValue,
  person: bindingValue,
  ordinal: bindingValue,
  links: bindingValue,
});

function creditProperties(language: string): Array<[FilmCreditKey, string]> {
  return [
    ["writer", "P58"],
    ["composer", "P86"],
    ["cinematographer", "P344"],
    ["editor", "P1040"],
    ["producer", "P162"],
    ["studio", "P272"],
    ["genre", "P136"],
    ["country", "P495"],
    ["language", "P364"],
    ["rating", language === "en" ? "P1657" : "P1981"],
    ["basedOn", "P144"],
    ["filmingLocation", "P915"],
  ];
}

const MAX_CREDIT_VALUES = 3;

const ITEM_ID = /^Q\d+$/;

export function buildDetailQuery(id: string, language: string): string {
  const labels = labelLanguages(language);
  const wikis = wikisFor(language)
    .map((wiki) => `<https://${wiki}.wikipedia.org/>`)
    .join(", ");
  const film = `wd:${id}`;
  return `SELECT ?kind ?value ?extra ?person ?ordinal ?links WHERE {
  {
    BIND("label" AS ?kind)
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${labels}". ${film} rdfs:label ?value. }
  } UNION {
    BIND("date" AS ?kind)
    ${film} p:P577/psv:P577 ?node. ?node wikibase:timeValue ?value; wikibase:timePrecision ?extra.
  } UNION {
    BIND("start" AS ?kind)
    ${film} p:P580/psv:P580 ?node. ?node wikibase:timeValue ?value; wikibase:timePrecision ?extra.
  } UNION {
    BIND("runtime" AS ?kind)
    ${film} p:P2047/psv:P2047 ?node. ?node wikibase:quantityAmount ?value; wikibase:quantityUnit ?extra.
  } UNION {
    BIND("director" AS ?kind)
    ${film} wdt:P57 ?person.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${labels}". ?person rdfs:label ?value. }
  } UNION {
    BIND("creator" AS ?kind)
    ${film} wdt:P170 ?person.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${labels}". ?person rdfs:label ?value. }
  } UNION {
    BIND("cast" AS ?kind)
    ${film} p:P161 ?statement. ?statement ps:P161 ?person.
    OPTIONAL { ?statement pq:P453 ?character. }
    OPTIONAL { ?statement pq:P4633 ?characterName. }
    OPTIONAL { ?statement pq:P1545 ?ordinal. }
    OPTIONAL { ?person wikibase:sitelinks ?links. }
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "${labels}".
      ?person rdfs:label ?value. ?character rdfs:label ?characterLabel.
    }
    BIND(COALESCE(?characterName, ?characterLabel) AS ?extra)
  } UNION {
    VALUES (?kind ?property) { ${creditProperties(language)
      .map(([key, property]) => `("credit:${key}" wdt:${property})`)
      .join(" ")} }
    ${film} ?property ?person.
    OPTIONAL { ?person wikibase:sitelinks ?links. }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${labels}". ?person rdfs:label ?value. }
  } UNION {
    BIND("award" AS ?kind)
    ${film} p:P166 ?statement. ?statement ps:P166 ?person.
    OPTIONAL { ?statement pq:P585 ?when. }
    BIND(STR(YEAR(?when)) AS ?extra)
    OPTIONAL { ?person wikibase:sitelinks ?links. }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "${labels}". ?person rdfs:label ?value. }
  } UNION {
    BIND("article" AS ?kind)
    ?article schema:about ${film}; schema:isPartOf ?wiki; schema:name ?value.
    FILTER(?wiki IN (${wikis}))
    BIND(STR(?wiki) AS ?extra)
  }
}`;
}

type DetailRow = {
  kind: string;
  value: string;
  extra: string;
  person: string;
  ordinal: string;
  links: string;
};

const DURATION_UNIT = { minute: "Q7727", second: "Q11574", hour: "Q25235" } as const;

const MINUTES_PER_UNIT: Record<string, number> = {
  [DURATION_UNIT.minute]: 1,
  [DURATION_UNIT.second]: 1 / 60,
  [DURATION_UNIT.hour]: 60,
};

export function pickRuntimeMinutes(rows: DetailRow[]): number {
  const minutes = rows
    .map((row) => Number(row.value) * (MINUTES_PER_UNIT[itemId(row.extra)] ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  return minutes.length > 0 ? Math.round(Math.min(...minutes)) : 0;
}

export function pickCast(rows: DetailRow[], limit = CAST_LIMIT): FilmCastCredit[] {
  const byPerson = new Map<
    string,
    { name: string; roles: string[]; ordinal: number; links: number }
  >();
  for (const row of rows) {
    if (!row.value || /^Q\d+$/.test(row.value)) continue;
    const key = row.person || row.value;
    const ordinal = Number(row.ordinal);
    const entry = byPerson.get(key) ?? {
      name: row.value,
      roles: [],
      ordinal: Number.POSITIVE_INFINITY,
      links: Number(row.links) || 0,
    };
    if (row.extra && !/^Q\d+$/.test(row.extra) && !entry.roles.includes(row.extra)) {
      entry.roles.push(row.extra);
    }
    if (row.ordinal && Number.isFinite(ordinal)) entry.ordinal = Math.min(entry.ordinal, ordinal);
    byPerson.set(key, entry);
  }
  return [...byPerson.values()]
    .sort((a, b) => a.ordinal - b.ordinal || b.links - a.links || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((entry) => ({ name: entry.name, role: entry.roles.join(" / ") }));
}

export function pickCredits(rows: DetailRow[], directors: string[]): FilmCredit[] {
  const byKey = new Map<string, DetailRow[]>();
  for (const row of rows) {
    if (!row.kind.startsWith("credit:") || !row.value || /^Q\d+$/.test(row.value)) continue;
    const key = row.kind.slice("credit:".length);
    byKey.set(key, [...(byKey.get(key) ?? []), row]);
  }
  return FILM_CREDIT_KEYS.flatMap((key): FilmCredit[] => {
    const values =
      key === "director"
        ? directors
        : [
            ...new Set(
              (byKey.get(key) ?? [])
                .sort((a, b) => (Number(b.links) || 0) - (Number(a.links) || 0))
                .map((row) => row.value),
            ),
          ];
    return values.length > 0 ? [{ key, values: values.slice(0, MAX_CREDIT_VALUES) }] : [];
  });
}

function names(rows: DetailRow[]): string[] {
  return [
    ...new Set(rows.map((row) => row.value).filter((value) => value && !/^Q\d+$/.test(value))),
  ];
}

const MAX_DIRECTORS = 3;

function pickDirectors(directors: string[], creators: string[]): string[] {
  if (creators.length > 0 && (directors.length === 0 || directors.length > MAX_DIRECTORS)) {
    return creators.slice(0, MAX_DIRECTORS);
  }
  return directors.slice(0, MAX_DIRECTORS);
}

const AWARD_LIMIT = 12;

export function pickAwards(rows: DetailRow[], limit = AWARD_LIMIT): FilmCastCredit[] {
  const seen = new Set<string>();
  return rows
    .filter((row) => row.value && !/^Q\d+$/.test(row.value))
    .sort(
      (a, b) =>
        (Number(b.links) || 0) - (Number(a.links) || 0) ||
        a.extra.localeCompare(b.extra) ||
        a.value.localeCompare(b.value),
    )
    .filter((row) => {
      const key = `${row.value}:${row.extra}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((row) => ({ name: row.value, role: row.extra }));
}

export function filmFromRows(
  id: string,
  rows: DetailRow[],
  language: string,
): Omit<FilmDetail, "summary" | "summarySource"> & {
  article: { wiki: string; title: string } | null;
} {
  const ofKind = (kind: string) => rows.filter((row) => row.kind === kind);
  const directors = names(ofKind("director"));
  const credited = pickDirectors(directors, names(ofKind("creator")));
  const articles = ofKind("article").map((row) => ({
    wiki: /^https:\/\/(\w+)\.wikipedia\.org\//.exec(row.extra)?.[1] ?? "",
    title: row.value,
  }));
  const article =
    wikisFor(language)
      .map((wiki) => articles.find((candidate) => candidate.wiki === wiki))
      .find(Boolean) ?? null;

  return {
    id,
    title: ofKind("label")[0]?.value ?? "",
    directors: credited,
    credits: pickCredits(rows, credited),
    ...pickReleaseDate(ofKind("date").length > 0 ? ofKind("date") : ofKind("start")),
    runtimeMinutes: pickRuntimeMinutes(ofKind("runtime")),
    cast: pickCast(ofKind("cast")),
    awards: pickAwards(ofKind("award")),
    sourceUrl: article
      ? articleUrl(article.wiki, article.title)
      : `https://www.wikidata.org/wiki/${id}`,
    article,
  };
}

export function getFilmDetail(
  id: string,
  language: string,
  signal?: AbortSignal,
): ResultAsync<FilmDetail, Error> {
  if (!ITEM_ID.test(id)) {
    return errAsync(new Error(i18n.t("errors.filmNotFound", { id })));
  }

  return sparqlGet(buildDetailQuery(id, language), detailSchema, signal).andThen((data) => {
    const rows: DetailRow[] = data.results.bindings.map((row) => ({
      kind: row.kind?.value ?? "",
      value: row.value?.value ?? "",
      extra: row.extra?.value ?? "",
      person: row.person?.value ?? "",
      ordinal: row.ordinal?.value ?? "",
      links: row.links?.value ?? "",
    }));
    const { article, ...film } = filmFromRows(id, rows, language);
    if (!film.title) return errAsync(new Error(i18n.t("errors.filmNotFound", { id })));

    return (article ? getArticleText(article.wiki, article.title, signal) : okAsync(""))
      .orElse(() => okAsync(""))
      .map((text) => {
        const summary = text ? extractStorySummary(text) : "";
        return {
          ...film,
          summary,
          summarySource:
            summary && article
              ? {
                  kind: "wikipedia" as const,
                  title: article.title,
                  url: articleUrl(article.wiki, article.title),
                  shortened: summary !== extractStorySummary(text, Number.POSITIVE_INFINITY),
                }
              : null,
        };
      });
  });
}
