import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useDocumentLanguage(): void {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = t("app.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("app.description"));
  }, [t, i18n.language]);
}
