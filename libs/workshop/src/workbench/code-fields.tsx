import type { ReactNode } from "react";
import { useSelector } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import type { PosterKind } from "@freetsy/poster";
import { touchOnChange } from "@freetsy/ui/form";
import { cn } from "@freetsy/ui/lib/utils";
import { CodeLinkField } from "./code-link-field";
import { SettingsGroup } from "./settings-layout";
import type { PosterFormApi } from "./use-poster-form";
import { WORKSHOP_COPY } from "./workshop-copy";

function CodeGroup({
  grouped,
  title,
  children,
}: {
  grouped: boolean;
  title: string;
  children: ReactNode;
}) {
  return grouped ? <SettingsGroup title={title}>{children}</SettingsGroup> : children;
}

export function CodeFields({
  form,
  kind,
  sourceUrl,
  qrUrlIsCustom,
  spotifyLinkIsInvalid,
}: {
  form: PosterFormApi;
  kind: PosterKind;
  sourceUrl: string;
  qrUrlIsCustom: boolean;
  spotifyLinkIsInvalid: boolean;
}) {
  const { t } = useTranslation();
  const codeKind = useSelector(form.store, (state) => state.values.codeKind);
  const offersSpotify = kind === "music";
  const copy = WORKSHOP_COPY[kind];

  return (
    <CodeGroup grouped={offersSpotify} title={t("settings.codeGroup")}>
      {offersSpotify && (
        <form.AppField name="codeKind">
          {(field) => (
            <field.ToggleField
              label={t("settings.codeKind")}
              options={[
                { value: "qr", label: t("settings.codeKindQr") },
                { value: "spotify", label: t("settings.codeKindSpotify") },
              ]}
            />
          )}
        </form.AppField>
      )}

      {offersSpotify && codeKind === "spotify" ? (
        <form.AppField name="spotifyUrl">
          {(field) => (
            <CodeLinkField
              id="spotify-url"
              label={t("settings.spotifyLabel")}
              description={t("settings.spotifyHint")}
              note={
                <Trans
                  i18nKey="settings.spotifyNote"
                  components={{
                    privacy: (
                      <Link to="/datenschutz" className={cn("underline hover:text-primary")} />
                    ),
                  }}
                />
              }
              placeholder="https://open.spotify.com/album/…"
              value={field.state.value}
              onChange={(next) => field.handleChange(next)}
              onBlur={field.handleBlur}
              clearLabel={t("settings.spotifyClear")}
              error={spotifyLinkIsInvalid ? t("settings.spotifyInvalid") : undefined}
            />
          )}
        </form.AppField>
      ) : (
        <form.AppField name="qrUrl" defaultValue={sourceUrl} listeners={touchOnChange}>
          {(field) => (
            <CodeLinkField
              id="qr-url"
              label={t("settings.qrLabel")}
              description={sourceUrl ? t(copy.qrHint) : t("settings.qrHintNoSource")}
              placeholder={sourceUrl || "https://…"}
              value={field.state.value}
              onChange={(next) => field.handleChange(next)}
              onBlur={field.handleBlur}
              clearLabel={t("settings.qrClear")}
              reset={
                qrUrlIsCustom
                  ? { label: t(copy.qrReset), onReset: () => field.handleChange(sourceUrl) }
                  : undefined
              }
            />
          )}
        </form.AppField>
      )}
    </CodeGroup>
  );
}
