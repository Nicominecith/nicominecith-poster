import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { OperatorGate } from "./operator-gate";
import { LEGAL_LINK, LegalChapter, LegalHighlight, LegalPage, LegalSection } from "./legal-page";
import { OperatorAddress, OperatorEmailLink } from "./operator-details";
import { cn } from "@freetsy/ui/lib/utils";

function ExternalLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn(LEGAL_LINK)}>
      {children}
    </a>
  );
}

export function PrivacyRoute() {
  const { t } = useTranslation();

  return (
    <OperatorGate title={t("legal.privacy.title")}>
      {(operator) => (
        <LegalPage title={t("legal.privacy.title")}>
          <LegalChapter title={t("legal.privacy.glance.title")}>
            <LegalSection title={t("legal.privacy.glance.generalHeading")}>
              <p>{t("legal.privacy.glance.generalBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.glance.controllerHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.glance.controllerBody"
                  components={{ imprint: <Link to="/impressum" className={cn(LEGAL_LINK)} /> }}
                />
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.glance.collectionHeading")}>
              <p>{t("legal.privacy.glance.collectionBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.glance.purposeHeading")}>
              <p>{t("legal.privacy.glance.purposeBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.glance.rightsHeading")}>
              <p>{t("legal.privacy.glance.rightsBody")}</p>
            </LegalSection>
          </LegalChapter>

          <LegalChapter title={t("legal.privacy.hosting.title")}>
            <LegalSection title={t("legal.privacy.hosting.externalHeading")}>
              <p>{t("legal.privacy.hosting.externalBody")}</p>
              <p>
                {t("legal.privacy.hosting.hosterIntro")}
                <br />
                Google Ireland Limited
                <br />
                Gordon House, Barrow Street
                <br />
                Dublin 4, Irland
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.hosting.processingHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.hosting.processingBody"
                  components={{
                    dpa: (
                      <ExternalLink href="https://cloud.google.com/terms/data-processing-addendum" />
                    ),
                  }}
                />
              </p>
            </LegalSection>
          </LegalChapter>

          <LegalChapter title={t("legal.privacy.general.title")}>
            <LegalSection title={t("legal.privacy.general.protectionHeading")}>
              <p>{t("legal.privacy.general.protectionBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.controllerHeading")}>
              <p>
                {t("legal.privacy.general.controllerIntro")}
                <br />
                <OperatorAddress operator={operator} />
                <br />
                {t("legal.imprint.contactEmail")} <OperatorEmailLink operator={operator} />
              </p>
              <p>{t("legal.privacy.general.controllerDefinition")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.retentionHeading")}>
              <p>{t("legal.privacy.general.retentionBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.legalBasisHeading")}>
              <p>{t("legal.privacy.general.legalBasisBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.recipientsHeading")}>
              <p>{t("legal.privacy.general.recipientsBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.objectionHeading")}>
              <LegalHighlight>
                <p>{t("legal.privacy.general.objectionBody1")}</p>
                <p>{t("legal.privacy.general.objectionBody2")}</p>
              </LegalHighlight>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.complaintHeading")}>
              <p>{t("legal.privacy.general.complaintBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.portabilityHeading")}>
              <p>{t("legal.privacy.general.portabilityBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.accessHeading")}>
              <p>{t("legal.privacy.general.accessBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.restrictionHeading")}>
              <p>{t("legal.privacy.general.restrictionIntro")}</p>
              <ul className={cn("flex list-disc flex-col gap-s pl-lg")}>
                <li>{t("legal.privacy.general.restrictionAccuracy")}</li>
                <li>{t("legal.privacy.general.restrictionUnlawful")}</li>
                <li>{t("legal.privacy.general.restrictionClaims")}</li>
                <li>{t("legal.privacy.general.restrictionObjection")}</li>
              </ul>
              <p>{t("legal.privacy.general.restrictionOutro")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.general.sslHeading")}>
              <p>{t("legal.privacy.general.sslBody")}</p>
            </LegalSection>
          </LegalChapter>

          <LegalChapter title={t("legal.privacy.collection.title")}>
            <LegalSection title={t("legal.privacy.collection.logsHeading")}>
              <p>{t("legal.privacy.collection.logsIntro")}</p>
              <ul className={cn("flex list-disc flex-col gap-xs pl-lg")}>
                <li>{t("legal.privacy.collection.logsBrowser")}</li>
                <li>{t("legal.privacy.collection.logsOs")}</li>
                <li>{t("legal.privacy.collection.logsReferrer")}</li>
                <li>{t("legal.privacy.collection.logsHostname")}</li>
                <li>{t("legal.privacy.collection.logsTime")}</li>
                <li>{t("legal.privacy.collection.logsIp")}</li>
              </ul>
              <p>{t("legal.privacy.collection.logsOutro")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.browserHeading")}>
              <p>{t("legal.privacy.collection.browserBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.searchHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.collection.searchBody"
                  components={{
                    apple: <ExternalLink href="https://www.apple.com/legal/privacy/" />,
                    metabrainz: <ExternalLink href="https://metabrainz.org/privacy" />,
                  }}
                />
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.filmSearchHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.collection.filmSearchBody"
                  components={{
                    wikimedia: (
                      <ExternalLink href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy" />
                    ),
                  }}
                />
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.bookSearchHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.collection.bookSearchBody"
                  components={{
                    archive: <ExternalLink href="https://archive.org/about/terms.php" />,
                    wikimedia: (
                      <ExternalLink href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy" />
                    ),
                  }}
                />
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.transferHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.collection.transferBody"
                  components={{
                    dpf: <ExternalLink href="https://www.dataprivacyframework.gov/list" />,
                  }}
                />
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.spotifyHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.collection.spotifyBody"
                  components={{
                    spotify: <ExternalLink href="https://www.spotify.com/legal/privacy-policy/" />,
                  }}
                />
              </p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.collection.storageHeading")}>
              <p>{t("legal.privacy.collection.storageBody")}</p>
            </LegalSection>
          </LegalChapter>

          <LegalChapter title={t("legal.privacy.meta.title")}>
            <LegalSection title={t("legal.privacy.meta.statusHeading")}>
              <p>{t("legal.privacy.meta.statusBody")}</p>
            </LegalSection>

            <LegalSection title={t("legal.privacy.meta.sourceHeading")}>
              <p>
                <Trans
                  i18nKey="legal.privacy.meta.sourceBody"
                  components={{ erecht24: <ExternalLink href="https://www.e-recht24.de" /> }}
                />
              </p>
            </LegalSection>
          </LegalChapter>
        </LegalPage>
      )}
    </OperatorGate>
  );
}
