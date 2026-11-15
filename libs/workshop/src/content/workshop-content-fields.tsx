import { Suspense, useMemo, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-form";
import { ContentSection } from "./content-section";
import { LazyListEditor } from "./lazy-editors";
import { TextScaleField } from "./text-scale-field";
import { useTranslation } from "react-i18next";
import {
  type ContentFormat,
  isNumberedList,
  isValidCount,
  LIST_KINDS,
  type ListingKind,
  type ListKind,
  type ListRow,
  newListRow,
  WORKSHOP_FORMATS,
} from "@freetsy/poster";
import { touchOnChange } from "@freetsy/ui/form";
import type { PosterFormApi } from "../workbench/use-poster-form";
import { Field, FieldDescription, FieldTitle } from "@freetsy/ui/components/field";

function isListKind(format: ContentFormat): format is ListKind {
  return (LIST_KINDS as readonly string[]).includes(format);
}

const LENGTH_FIELD = {
  film: { name: "content.runtime", placeholder: "148" },
  book: { name: "content.pages", placeholder: "320" },
} as const satisfies Record<ListingKind, { name: string; placeholder: string }>;

function LengthField({ form, kind }: { form: PosterFormApi; kind: ListingKind }) {
  const { t } = useTranslation();
  const { name, placeholder } = LENGTH_FIELD[kind];
  return (
    <form.AppField
      name={name}
      listeners={touchOnChange}
      validators={{
        onChange: ({ value }) => (isValidCount(value) ? undefined : t(`${kind}.lengthInvalid`)),
      }}
    >
      {(field) => (
        <field.TextField
          label={t(`${kind}.length`)}
          description={t(`${kind}.lengthHint`)}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
        />
      )}
    </form.AppField>
  );
}

export function WorkshopContentFields({
  form,
  kind,
  search,
}: {
  form: PosterFormApi;
  kind: ListingKind;
  search: ReactNode;
}) {
  const { t } = useTranslation();
  const format = useSelector(form.store, (state) => state.values.content.format);

  return (
    <ContentSection
      form={form}
      kind={kind}
      search={search}
      lengthField={<LengthField form={form} kind={kind} />}
    >
      <form.AppField name="content.format">
        {(field) => (
          <field.SelectField
            label={t("listing.format")}
            description={t(`listing.formatHint_${format}`)}
            options={WORKSHOP_FORMATS[kind].map((value) => ({
              value,
              label: value === "quote" ? t(`${kind}.quoteFormat`) : t(`listing.format_${value}`),
            }))}
          />
        )}
      </form.AppField>

      <ListingBody form={form} kind={kind} format={format} />

      {!isNumberedList(format) && <TextScaleField form={form} />}
    </ContentSection>
  );
}

function ListingBody({
  form,
  kind,
  format,
}: {
  form: PosterFormApi;
  kind: ListingKind;
  format: ContentFormat;
}) {
  const { t } = useTranslation();
  const listKind = isListKind(format) ? format : null;
  const samples = useMemo<ListRow[]>(
    () => (listKind ? t(`lists.${listKind}.samples`, { returnObjects: true }).map(newListRow) : []),
    [t, listKind],
  );

  if (format === "quote") {
    return (
      <form.AppField
        name="content.quote"
        defaultValue={t(`${kind}Defaults.quote`)}
        listeners={touchOnChange}
      >
        {(field) => (
          <field.TextareaField
            label={t(`${kind}.quoteLabel`)}
            description={t(`${kind}.quoteHint`)}
            placeholder={t("settings.freeformPlaceholder")}
            rows={4}
          />
        )}
      </form.AppField>
    );
  }

  if (!listKind) {
    return (
      <>
        <form.AppField
          name="content.freeformText"
          defaultValue={t(`${kind}Defaults.summary`)}
          listeners={touchOnChange}
        >
          {(field) => (
            <field.TextareaField
              label={t(`${kind}.summaryLabel`)}
              description={t(`${kind}.summaryHint`)}
              placeholder={t("settings.freeformPlaceholder")}
              rows={8}
            />
          )}
        </form.AppField>
        <form.AppField name="showTextSource">
          {(field) => <field.CheckboxField label={t("source.show")} />}
        </form.AppField>
        <form.AppField name="content.textSource" listeners={touchOnChange}>
          {(field) => (
            <field.TextField
              label={t("source.label")}
              description={t("source.hint")}
              type="text"
              placeholder={t("source.placeholder")}
            />
          )}
        </form.AppField>
      </>
    );
  }

  return (
    <>
      <form.AppField name="showListDetails">
        {(field) => <field.CheckboxField label={t(`lists.${listKind}.showDetails`)} />}
      </form.AppField>
      <form.AppField
        key={listKind}
        name={`content.lists.${listKind}`}
        defaultValue={samples}
        listeners={touchOnChange}
      >
        {(field) => (
          <Field>
            <FieldTitle>{t(`lists.${listKind}.label`)}</FieldTitle>
            <FieldDescription>{t(`lists.${listKind}.hint`)}</FieldDescription>
            <Suspense fallback={null}>
              <LazyListEditor
                kind={listKind}
                rows={field.state.value}
                onChange={(next) => field.handleChange(next)}
              />
            </Suspense>
          </Field>
        )}
      </form.AppField>
    </>
  );
}
