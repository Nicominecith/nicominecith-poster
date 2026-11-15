import { useId } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage, isLanguageCode, LANGUAGES } from "@freetsy/i18n";
import { Field, FieldTitle } from "@freetsy/ui/components/field";
import { ToggleGroup, ToggleGroupItem } from "@freetsy/ui/components/toggle-group";
import { cn } from "@freetsy/ui/lib/utils";

export function LanguageSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const { t, i18n } = useTranslation();
  const labelId = useId();

  return (
    <Field orientation="horizontal" className={cn("w-fit gap-m")}>
      {showLabel && (
        <FieldTitle id={labelId} className={cn("flex-none")}>
          {t("language.label")}
        </FieldTitle>
      )}
      <ToggleGroup
        type="single"
        value={i18n.language}
        aria-label={showLabel ? undefined : t("language.ariaLabel")}
        aria-labelledby={showLabel ? labelId : undefined}
        className={cn("gap-xs")}
        onValueChange={(code) => {
          if (isLanguageCode(code)) void changeLanguage(code);
        }}
      >
        {LANGUAGES.map((language) => (
          <ToggleGroupItem
            key={language.code}
            value={language.code}
            lang={language.code}
            title={language.name}
            size="sm"
          >
            {language.short}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}
