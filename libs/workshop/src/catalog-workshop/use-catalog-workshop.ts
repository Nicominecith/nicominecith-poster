import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCatalogSelection } from "@freetsy/catalog";
import {
  CONTENT_FIELDS,
  LIST_KINDS,
  newInfoRow,
  newListRow,
  textSourceCredit,
} from "@freetsy/poster";
import type { PosterFormApi } from "../workbench/use-poster-form";
import type { CatalogContent, CatalogWorkshopDefinition } from "./define-catalog-workshop";
import { textSourceWords } from "./text-source-words";

const TEXT_FIELDS = [
  "title",
  "subtitle",
  "releaseDate",
  "runtime",
  "pages",
  "quote",
  "freeformText",
  "sourceUrl",
] as const satisfies ReadonlyArray<keyof CatalogContent>;

function fillForm(form: PosterFormApi, content: CatalogContent, sourceCredit: string): void {
  for (const name of TEXT_FIELDS) {
    const value = content[name];
    if (value !== undefined) form.setFieldValue(`content.${name}`, value);
  }
  for (const kind of LIST_KINDS) {
    const entries = content.lists?.[kind];
    if (entries) form.setFieldValue(`content.lists.${kind}`, entries.map(newListRow));
  }
  if (content.credits) form.setFieldValue("content.credits", content.credits.map(newInfoRow));
  if (content.creditOptions) form.setFieldValue("content.creditOptions", content.creditOptions);
  if (content.textSource !== undefined) form.setFieldValue("content.textSource", sourceCredit);
  if (content.format) form.setFieldValue("content.format", content.format);
}

export function useCatalogWorkshop<Summary, Detail>(
  workshop: CatalogWorkshopDefinition<Summary, Detail>,
  form: PosterFormApi,
) {
  const { t } = useTranslation();
  const loaded = useRef<Detail | null>(null);
  const fill = useCallback(
    (detail: Detail) => {
      loaded.current = detail;
      const content = workshop.toContent(detail, t);
      fillForm(form, content, textSourceCredit(content.textSource ?? null, textSourceWords(t)));
    },
    [form, t, workshop],
  );
  const selection = useCatalogSelection(workshop.catalog, fill);

  return {
    ...selection,
    reset() {
      if (loaded.current) {
        fill(loaded.current);
        return;
      }
      for (const field of CONTENT_FIELDS) form.resetField(`content.${field}`);
    },
  };
}
