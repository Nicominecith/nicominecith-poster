import type { ResultAsync } from "neverthrow";
import { z, type ZodMiniType } from "zod/mini";
import { requestJson } from "../request-json";
import i18n from "@freetsy/i18n";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

export function wikisFor(language: string): [string, string] {
  return language === "en" ? ["en", "de"] : ["de", "en"];
}

export function labelLanguages(language: string): string {
  const [first, second] = wikisFor(language);
  return `${first},mul,${second}`;
}

export function sparqlString(text: string): string {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n\t]+/g, " ");
  return `"${escaped}"`;
}

export const bindingValue = z.optional(z.object({ value: z.string() }));

export function sparqlResponse<T extends Record<string, typeof bindingValue>>(shape: T) {
  return z.object({ results: z.object({ bindings: z.array(z.object(shape)) }) });
}

export function sparqlGet<T>(
  query: string,
  schema: ZodMiniType<T>,
  signal?: AbortSignal,
): ResultAsync<T, Error> {
  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  return requestJson({ url, schema, signal, errorMessage: i18n.t("errors.wikidataUnreachable") });
}

export function itemId(uri: string): string {
  return uri.slice(uri.lastIndexOf("/") + 1);
}

export function isBareItemId(text: string): boolean {
  return /^Q\d+$/.test(text);
}
