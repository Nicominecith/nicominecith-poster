import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { OperatorGate } from "./operator-gate";
import { LEGAL_LINK, LegalPage, LegalSection } from "./legal-page";
import { cn } from "@freetsy/ui/lib/utils";

export function TermsRoute() {
  const { t, i18n } = useTranslation();

  return (
    <OperatorGate title={t("legal.terms.title")}>
      {() => (
        <LegalPage title={t("legal.terms.title")}>
          <LegalSection title={t("legal.terms.scopeHeading")}>
            <p>
              <Trans
                i18nKey="legal.terms.scopeBody"
                components={{ imprint: <Link to="/impressum" className={cn(LEGAL_LINK)} /> }}
              />
            </p>
          </LegalSection>

          <LegalSection title={t("legal.terms.ownContentHeading")}>
            <p>{t("legal.terms.ownContentBody")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.imageRightsHeading")}>
            <p>{t("legal.terms.imageRightsBody")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.textRightsHeading")}>
            <p>{t("legal.terms.textRightsBody1")}</p>
            <p>
              <Trans
                i18nKey="legal.terms.textRightsBody2"
                components={{
                  ccbysa: (
                    <a
                      href={`https://creativecommons.org/licenses/by-sa/4.0/deed.${i18n.language === "en" ? "en" : "de"}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(LEGAL_LINK)}
                    />
                  ),
                }}
              />
            </p>
            <p>{t("legal.terms.textRightsBody3")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.usageHeading")}>
            <p>{t("legal.terms.usageBody1")}</p>
            <p>{t("legal.terms.usageBody2")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.liabilityHeading")}>
            <p>{t("legal.terms.liabilityBody")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.browserHeading")}>
            <p>{t("legal.terms.browserBody")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.servicesHeading")}>
            <p>{t("legal.terms.servicesBody")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.spotifyHeading")}>
            <p>
              <Trans
                i18nKey="legal.terms.spotifyBody1"
                components={{ privacy: <Link to="/datenschutz" className={cn(LEGAL_LINK)} /> }}
              />
            </p>
            <p>{t("legal.terms.spotifyBody2")}</p>
          </LegalSection>

          <LegalSection title={t("legal.terms.statusHeading")}>
            <p>{t("legal.terms.statusBody")}</p>
          </LegalSection>
        </LegalPage>
      )}
    </OperatorGate>
  );
}
