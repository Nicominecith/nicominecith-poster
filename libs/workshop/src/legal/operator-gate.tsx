import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SITE, type SiteOperator } from "../app/site-config";
import { LegalPage } from "./legal-page";

export function OperatorGate({
  title,
  children,
}: {
  title: string;
  children: (operator: SiteOperator) => ReactNode;
}) {
  const { t } = useTranslation();
  if (!SITE.operator) {
    return (
      <LegalPage title={title}>
        <p>{t("legal.unconfigured")}</p>
      </LegalPage>
    );
  }
  return children(SITE.operator);
}
