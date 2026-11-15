import { type ResultAsync, okAsync } from "neverthrow";
import {
  bindingValue,
  isBareItemId,
  labelLanguages,
  sparqlGet,
  sparqlResponse,
  wikisFor,
} from "@freetsy/catalog";

export const WORK_ID = /^OL\d+W$/;

export type BookWikidataRow = {
  kind: string;
  value: string;
  extra: string;
  links: string;
};

const schema = sparqlResponse({
  kind: bindingValue,
  value: bindingValue,
  extra: bindingValue,
  links: bindingValue,
});

export function buildBookQuery(workId: string, language: string): string {
  const labels = labelLanguages(language);
  const wikis = wikisFor(language)
    .map((wiki) => `<https://${wiki}.wikipedia.org/>`)
    .join(", ");
  const label = (variable: string) =>
    `SERVICE wikibase:label { bd:serviceParam wikibase:language "${labels}". ${variable} rdfs:label ?value. }`;
  return `SELECT ?kind ?value ?extra ?links WHERE {
  ?book wdt:P648 "${workId}".
  {
    BIND("label" AS ?kind) ${label("?book")}
  } UNION {
    BIND("firstLine" AS ?kind) ?book wdt:P1922 ?value.
  } UNION {
    BIND("date" AS ?kind)
    ?book p:P577/psv:P577 ?node. ?node wikibase:timeValue ?value; wikibase:timePrecision ?extra.
  } UNION {
    VALUES (?kind ?property) {
      ("character" wdt:P674) ("place" wdt:P840) ("genre" wdt:P136)
      ("form" wdt:P7937) ("language" wdt:P407)
    }
    ?book ?property ?item.
    OPTIONAL { ?item wikibase:sitelinks ?links. }
    ${label("?item")}
  } UNION {
    BIND("series" AS ?kind)
    ?book p:P179 ?statement. ?statement ps:P179 ?item.
    OPTIONAL { ?statement pq:P1545 ?extra. }
    ${label("?item")}
  } UNION {
    BIND("work" AS ?kind)
    ?book wdt:P50 ?author. ?author wdt:P800 ?item.
    FILTER(?item != ?book)
    OPTIONAL { ?item wdt:P577 ?published. }
    BIND(STR(YEAR(?published)) AS ?extra)
    OPTIONAL { ?item wikibase:sitelinks ?links. }
    ${label("?item")}
  } UNION {
    BIND("article" AS ?kind)
    ?article schema:about ?book; schema:isPartOf ?wiki; schema:name ?value.
    FILTER(?wiki IN (${wikis}))
    BIND(STR(?wiki) AS ?extra)
  }
}`;
}

export function getBookWikidata(
  workId: string,
  language: string,
  signal?: AbortSignal,
): ResultAsync<BookWikidataRow[], Error> {
  if (!WORK_ID.test(workId)) return okAsync([]);
  return sparqlGet(buildBookQuery(workId, language), schema, signal).map((data) =>
    data.results.bindings
      .map((row) => ({
        kind: row.kind?.value ?? "",
        value: row.value?.value ?? "",
        extra: row.extra?.value ?? "",
        links: row.links?.value ?? "",
      }))
      .filter((row) => row.value && !isBareItemId(row.value)),
  );
}
