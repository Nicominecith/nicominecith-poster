import { useTranslation } from "react-i18next";
import { OperatorGate } from "./operator-gate";
import { LegalPage, LegalSection } from "./legal-page";
import { OperatorAddress, OperatorEmailLink } from "./operator-details";

export function ImprintRoute() {
  const { t } = useTranslation();

  return (
    <OperatorGate title={t("legal.imprint.title")}>
      {(operator) => (
        <LegalPage title={t("legal.imprint.title")}>
          <LegalSection title={t("legal.imprint.detailsHeading")}>
            <p>
              <OperatorAddress operator={operator} />
            </p>
          </LegalSection>
          <LegalSection title={t("legal.imprint.contactHeading")}>
            <p>
              {t("legal.imprint.contactEmail")} <OperatorEmailLink operator={operator} />
            </p>
          </LegalSection>
          <LegalSection title={t("legal.imprint.responsibleHeading")}>
            <p>
              <OperatorAddress operator={operator} />
            </p>
          </LegalSection>
        </LegalPage>
      )}
    </OperatorGate>
  );
}
