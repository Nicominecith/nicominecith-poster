import i18n from "i18next";
import type {} from "./i18next-types";
import { initReactI18next } from "react-i18next";
import { de, loadEnglish } from "./resources";

export const LANGUAGES = [
  { code: "de", short: "DE", name: "Deutsch" },
  { code: "en", short: "EN", name: "English" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function isLanguageCode(code: string): code is LanguageCode {
  return LANGUAGES.some((language) => language.code === code);
}

const DEFAULT_LANGUAGE: LanguageCode = "de";

void i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map((language) => language.code),
  interpolation: { escapeValue: false },
});

const LAZY_RESOURCES: Partial<Record<LanguageCode, () => Promise<Record<string, unknown>>>> = {
  en: loadEnglish,
};

const loadedLanguages = new Set<LanguageCode>([DEFAULT_LANGUAGE]);

export async function changeLanguage(code: LanguageCode): Promise<void> {
  if (!loadedLanguages.has(code)) {
    const load = LAZY_RESOURCES[code];
    const resource = load ? await load() : undefined;
    if (resource) i18n.addResourceBundle(code, "translation", resource);
    loadedLanguages.add(code);
  }
  await i18n.changeLanguage(code);
}

export default i18n;
export { useDocumentLanguage } from "./use-document-language";
