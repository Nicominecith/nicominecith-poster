import book from "../locales/en/book.json";
import common from "../locales/en/common.json";
import film from "../locales/en/film.json";
import legal from "../locales/en/legal.json";
import music from "../locales/en/music.json";
import workshop from "../locales/en/workshop.json";
import type { Resources, Superset, Translated } from "./resources";

const translation = {
  ...common,
  ...workshop,
  ...music,
  ...film,
  ...book,
  ...legal,
} satisfies Translated<Resources>;

export const en: Superset<Translated<Resources>, typeof translation> = translation;
