import { type ResultAsync, okAsync } from "neverthrow";
import { z } from "zod/mini";
import { requestJson } from "../request-json";
import i18n from "@freetsy/i18n";

const PLOT_HEADINGS = /^(handlung|inhalt|plot|plot summary|synopsis|story|premise)$/i;

const SUMMARY_MAX_CHARS = 700;

const HEADING = /^(={2,})\s*(.*?)\s*\1$/;

function sectionBody(lines: string[], start: number, level: number): string[] {
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const heading = HEADING.exec(line.trim());
    if (heading && heading[1].length <= level) break;
    if (!heading) body.push(line);
  }
  return body;
}

function paragraphs(lines: string[]): string[] {
  return lines.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
}

const SENTENCE_END = /(?<=[.!?…])\s+(?=[\p{Lu}\p{N}„"'(«])/u;

export function shortenToSentences(text: string[], limit = SUMMARY_MAX_CHARS): string[] {
  const kept: string[] = [];
  let used = 0;
  for (const paragraph of text) {
    const sentences: string[] = [];
    for (const sentence of paragraph.split(SENTENCE_END)) {
      const cost = sentence.length + (sentences.length > 0 ? 1 : 0);
      if (used > 0 && used + cost > limit) {
        if (sentences.length > 0) kept.push(sentences.join(" "));
        return kept;
      }
      sentences.push(sentence);
      used += cost;
    }
    if (sentences.length > 0) kept.push(sentences.join(" "));
  }
  return kept;
}

export function extractStorySummary(articleText: string, limit = SUMMARY_MAX_CHARS): string {
  const lines = articleText.split("\n");
  const firstHeading = lines.findIndex((line) => HEADING.test(line.trim()));
  const lead = firstHeading < 0 ? lines : lines.slice(0, firstHeading);

  let plot: string[] = [];
  for (const [index, line] of lines.entries()) {
    const heading = HEADING.exec(line.trim());
    if (heading && PLOT_HEADINGS.test(heading[2])) {
      plot = paragraphs(sectionBody(lines, index, heading[1].length));
      break;
    }
  }

  const chosen = plot.length > 0 ? plot : paragraphs(lead);
  return shortenToSentences(chosen, limit).join("\n");
}

const extractResponseSchema = z.object({
  query: z.optional(
    z.object({
      pages: z.array(
        z.object({
          title: z.string(),
          extract: z.optional(z.string()),
        }),
      ),
    }),
  ),
});

export function getArticleText(
  wiki: string,
  title: string,
  signal?: AbortSignal,
): ResultAsync<string, Error> {
  if (!title) return okAsync("");
  const url = new URL(`https://${wiki}.wikipedia.org/w/api.php`);
  for (const [key, value] of Object.entries({
    action: "query",
    prop: "extracts",
    explaintext: "1",
    exsectionformat: "wiki",
    redirects: "1",
    titles: title,
    format: "json",
    formatversion: "2",
    origin: "*",
  }))
    url.searchParams.set(key, value);

  return requestJson({
    url,
    schema: extractResponseSchema,
    signal,
    errorMessage: i18n.t("errors.wikipediaUnreachable"),
  }).map((data) => data.query?.pages[0]?.extract ?? "");
}

export function articleUrl(wiki: string, title: string): string {
  return `https://${wiki}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}
