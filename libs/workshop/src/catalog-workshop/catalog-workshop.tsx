import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { FieldDescription } from "@freetsy/ui/components/field";
import { cn } from "@freetsy/ui/lib/utils";
import { PosterWorkbench } from "../workbench/poster-workbench";
import { usePosterForm } from "../workbench/use-poster-form";
import { WorkshopContentFields } from "../content/workshop-content-fields";
import { CatalogSearchField } from "./catalog-search-field";
import type { CatalogWorkshopDefinition } from "./define-catalog-workshop";
import { SelectedEntryCard } from "./selected-entry-card";
import { useCatalogWorkshop } from "./use-catalog-workshop";

const CANCEL_LABEL = { film: "validation.cancelFilm", book: "validation.cancelBook" } as const;

export function CatalogWorkshop<Summary, Detail>({
  workshop,
}: {
  workshop: CatalogWorkshopDefinition<Summary, Detail>;
}) {
  const { t } = useTranslation();
  const { kind } = workshop;
  const copy = `${kind}Search` as const;
  const form = usePosterForm(kind);
  const entry = useCatalogWorkshop(workshop, form);
  const detail = entry.query.data;

  const searchField = (trigger?: ReactNode) => (
    <CatalogSearchField
      catalog={workshop.catalog}
      toHit={(summary) => workshop.toHit(summary, t)}
      copy={{
        placeholder: t(`${copy}.placeholder`),
        title: t(`${copy}.title`),
        description: t(`${copy}.description`),
      }}
      trigger={trigger}
      onSelect={(hit) => entry.select(hit.id)}
    />
  );

  const search =
    entry.id === null ? (
      <>
        <FieldDescription>
          <Trans
            i18nKey={`${copy}.note`}
            components={{
              privacy: <Link to="/datenschutz" className={cn("underline hover:text-primary")} />,
            }}
          />
        </FieldDescription>
        {searchField()}
      </>
    ) : (
      <SelectedEntryCard
        query={entry.query}
        summary={detail ? workshop.toSummary(detail, t) : null}
        copy={{
          loading: t(`${copy}.loading`),
          loadFailed: t(`${copy}.loadFailed`),
          chooseOther: t(`${copy}.chooseOther`),
          reset: t(`${copy}.resetContent`),
          hint: t(`${copy}.replaceHint`),
        }}
        sources={workshop.sources({ id: entry.id, detail })}
        renderSearch={searchField}
        onReset={entry.reset}
      />
    );

  return (
    <PosterWorkbench
      kind={kind}
      form={form}
      importing={entry.isLoading}
      onCancelImport={entry.cancel}
      cancelImportLabel={t(CANCEL_LABEL[kind])}
      coverHint={detail ? workshop.coverHint(detail) : null}
      contentFields={<WorkshopContentFields form={form} kind={kind} search={search} />}
    />
  );
}
