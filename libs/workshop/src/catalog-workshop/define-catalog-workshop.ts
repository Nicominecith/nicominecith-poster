import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import type { Catalog, CoverHint } from "@freetsy/catalog";
import type {
  EditableContent,
  InfoCredit,
  ListEntry,
  ListingKind,
  ListKind,
  TextSource,
} from "@freetsy/poster";
import type { CatalogHit } from "./catalog-search-field";

export type CatalogContent = Partial<
  Pick<
    EditableContent,
    | "title"
    | "subtitle"
    | "releaseDate"
    | "runtime"
    | "pages"
    | "quote"
    | "freeformText"
    | "sourceUrl"
    | "format"
  >
> & {
  lists?: Partial<Record<ListKind, ListEntry[]>>;
  credits?: InfoCredit[];
  creditOptions?: InfoCredit[];
  textSource?: TextSource | null;
};

export type CatalogEntrySummary = { title: string; facts: string };

export type CatalogWorkshopDefinition<Summary, Detail> = {
  kind: ListingKind;
  catalog: Catalog<Summary, Detail>;
  toHit: (summary: Summary, t: TFunction) => CatalogHit;
  toSummary: (detail: Detail, t: TFunction) => CatalogEntrySummary;
  toContent: (detail: Detail, t: TFunction) => CatalogContent;
  coverHint: (detail: Detail) => CoverHint;
  sources: (selection: { id: string; detail: Detail | undefined }) => ReactNode;
};

export function defineCatalogWorkshop<Summary, Detail>(
  definition: CatalogWorkshopDefinition<Summary, Detail>,
): CatalogWorkshopDefinition<Summary, Detail> {
  return definition;
}
