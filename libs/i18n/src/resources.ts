import book from "../locales/de/book.json";
import common from "../locales/de/common.json";
import film from "../locales/de/film.json";
import legal from "../locales/de/legal.json";
import music from "../locales/de/music.json";
import workshop from "../locales/de/workshop.json";

export const de = { ...common, ...workshop, ...music, ...film, ...book, ...legal };

export type Resources = typeof de;

export type Translated<T> = T extends string
  ? string
  : T extends ReadonlyArray<infer Item>
    ? Array<Translated<Item>>
    : { [K in keyof T]: Translated<T[K]> };

export type Superset<T extends Subset, Subset> = T;

export const loadEnglish = (): Promise<Translated<Resources>> =>
  import("./english").then((module) => module.en);
