import type { TFunction } from "i18next";

export function textSourceWords(t: TFunction) {
  return {
    wikipedia: (title: string) => t("source.wikipedia", { title }),
    openLibrary: t("source.openLibrary"),
    shortened: t("source.shortened"),
    license: "CC BY-SA 4.0",
  };
}
