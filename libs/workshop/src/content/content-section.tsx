import { Suspense, useMemo, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { isValidReleaseDate, type PosterKind } from "@freetsy/poster";
import { touchOnChange } from "@freetsy/ui/form";
import { SettingsGroup, SettingsSection } from "../workbench/settings-layout";
import type { PosterFormApi } from "../workbench/use-poster-form";
import { WORKSHOP_COPY } from "../workbench/workshop-copy";
import { LazyInfoCreditsEditor } from "./lazy-editors";

function CreditLabelField({
  form,
  name,
  hint,
  placeholder,
}: {
  form: PosterFormApi;
  name: "releaseDateLabel" | "lengthLabel";
  hint: string;
  placeholder: string;
}) {
  const { t } = useTranslation();
  return (
    <form.AppField name={name}>
      {(field) => (
        <field.TextField
          label={t(
            name === "releaseDateLabel" ? "settings.releaseDateLabel" : "settings.lengthLabel",
          )}
          description={hint}
          type="text"
          placeholder={placeholder}
        />
      )}
    </form.AppField>
  );
}

function TitleGroup({ form, kind }: { form: PosterFormApi; kind: PosterKind }) {
  const { t } = useTranslation();
  const copy = WORKSHOP_COPY[kind];

  return (
    <SettingsGroup title={t("settings.groupTitle")}>
      <form.AppField
        name="content.title"
        defaultValue={t(copy.titleDefault)}
        listeners={touchOnChange}
      >
        {(field) => (
          <field.TextField
            label={t(copy.title)}
            type="text"
            placeholder={t("settings.contentTitlePlaceholder")}
          />
        )}
      </form.AppField>
      <form.AppField
        name="content.subtitle"
        defaultValue={t(copy.subtitleDefault)}
        listeners={touchOnChange}
      >
        {(field) => (
          <field.TextField
            label={t(copy.subtitle)}
            description={copy.subtitleHint ? t(copy.subtitleHint) : undefined}
            type="text"
            placeholder={t(copy.subtitlePlaceholder)}
          />
        )}
      </form.AppField>
      <form.AppField name="showSubtitle">
        {(field) => <field.CheckboxField label={t(copy.showSubtitle)} />}
      </form.AppField>
    </SettingsGroup>
  );
}

function DateGroup({ form, kind }: { form: PosterFormApi; kind: PosterKind }) {
  const { t } = useTranslation();
  const copy = WORKSHOP_COPY[kind];
  const shown = useSelector(form.store, (state) => state.values.showReleaseDate);

  return (
    <SettingsGroup title={t(copy.releaseDateCredit)}>
      <form.AppField
        name="content.releaseDate"
        listeners={touchOnChange}
        validators={{
          onChange: ({ value }) =>
            isValidReleaseDate(value) ? undefined : t("validation.releaseDate"),
        }}
      >
        {(field) => (
          <field.TextField
            label={t(copy.releaseDate)}
            description={t("settings.contentReleaseDateHint")}
            type="text"
            placeholder={t("settings.contentReleaseDatePlaceholder")}
          />
        )}
      </form.AppField>
      <form.AppField name="showReleaseDate">
        {(field) => <field.CheckboxField label={t(copy.showReleaseDate)} />}
      </form.AppField>
      {shown && (
        <CreditLabelField
          form={form}
          name="releaseDateLabel"
          hint={t(copy.releaseDateLabelHint)}
          placeholder={t(copy.releaseDateCredit)}
        />
      )}
    </SettingsGroup>
  );
}

function LengthGroup({
  form,
  kind,
  lengthField,
}: {
  form: PosterFormApi;
  kind: PosterKind;
  lengthField?: ReactNode;
}) {
  const { t } = useTranslation();
  const copy = WORKSHOP_COPY[kind];
  const shown = useSelector(form.store, (state) => state.values.showAlbumLength);

  return (
    <SettingsGroup title={t(copy.lengthCredit)}>
      {lengthField}
      <form.AppField name="showAlbumLength">
        {(field) => <field.CheckboxField label={t(copy.showLength)} />}
      </form.AppField>
      {shown && (
        <CreditLabelField
          form={form}
          name="lengthLabel"
          hint={t(copy.lengthLabelHint)}
          placeholder={t(copy.lengthCredit)}
        />
      )}
    </SettingsGroup>
  );
}

function InfosGroup({ form, kind }: { form: PosterFormApi; kind: PosterKind }) {
  const { t } = useTranslation();
  const copy = WORKSHOP_COPY[kind];
  const options = useSelector(form.store, (state) => state.values.content.creditOptions);
  const suggestions = useMemo(
    () => t(copy.infoSuggestions, { returnObjects: true }),
    [t, copy.infoSuggestions],
  );

  return (
    <SettingsGroup title={t("infos.label")} description={t(copy.infosHint)}>
      <form.AppField name="content.credits" listeners={touchOnChange}>
        {(field) => (
          <Suspense fallback={null}>
            <LazyInfoCreditsEditor
              credits={field.state.value}
              onChange={(next) => field.handleChange(next)}
              options={options}
              suggestions={suggestions}
            />
          </Suspense>
        )}
      </form.AppField>
    </SettingsGroup>
  );
}

export function ContentSection({
  form,
  kind,
  search,
  lengthField,
  children,
}: {
  form: PosterFormApi;
  kind: PosterKind;
  search: ReactNode;
  lengthField?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const copy = WORKSHOP_COPY[kind];

  return (
    <SettingsSection title={t("settings.content")} description={t(copy.contentHint)}>
      <SettingsGroup title={t(copy.search)}>{search}</SettingsGroup>
      <TitleGroup form={form} kind={kind} />
      <DateGroup form={form} kind={kind} />
      <LengthGroup form={form} kind={kind} lengthField={lengthField} />
      <InfosGroup form={form} kind={kind} />
      <SettingsGroup title={t("settings.groupBody")}>{children}</SettingsGroup>
    </SettingsSection>
  );
}
