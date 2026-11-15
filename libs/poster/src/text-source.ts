export type TextSource =
  | { kind: "wikipedia"; title: string; url: string; shortened: boolean }
  | { kind: "openlibrary"; url: string; shortened: boolean };

export function textSourceCredit(
  source: TextSource | null,
  words: {
    wikipedia: (title: string) => string;
    openLibrary: string;
    shortened: string;
    license: string;
  },
): string {
  if (!source) return "";
  const shortened = source.shortened ? `, ${words.shortened}` : "";
  return source.kind === "wikipedia"
    ? `${words.wikipedia(source.title)}${shortened} · ${words.license}`
    : `${words.openLibrary}${shortened}`;
}
