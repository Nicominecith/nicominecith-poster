import type { EditableContent, InfoCredit, ListEntry } from "@freetsy/poster";
import type { FilmCastCredit, FilmCreditKey, FilmDetail } from "./types";

const SHOWN_BY_DEFAULT = new Set<FilmCreditKey>(["writer", "composer"]);

type FilmFields = Pick<
  EditableContent,
  "title" | "subtitle" | "releaseDate" | "freeformText" | "sourceUrl" | "runtime"
> & {
  cast: ListEntry[];
  awards: ListEntry[];
  credits: InfoCredit[];
  creditOptions: InfoCredit[];
};

const withoutKey = ({ label, value }: InfoCredit): InfoCredit => ({ label, value });

function entries(credits: FilmCastCredit[]): ListEntry[] {
  return credits.map((credit) => ({ name: credit.name, detail: credit.role, emphasized: false }));
}

export function filmContent(
  film: FilmDetail,
  labelFor: (key: FilmCreditKey) => string,
): FilmFields {
  const credits = film.credits.map((credit) => ({
    key: credit.key,
    label: labelFor(credit.key),
    value: credit.values.join(", "),
  }));
  return {
    title: film.title,
    subtitle: film.directors.join(", "),
    releaseDate: film.releaseDate,
    runtime: film.runtimeMinutes > 0 ? String(film.runtimeMinutes) : "",
    cast: entries(film.cast),
    awards: entries(film.awards),
    freeformText: film.summary,
    sourceUrl: film.sourceUrl,
    credits: credits.filter(({ key }) => SHOWN_BY_DEFAULT.has(key)).map(withoutKey),
    creditOptions: credits.map(withoutKey),
  };
}
