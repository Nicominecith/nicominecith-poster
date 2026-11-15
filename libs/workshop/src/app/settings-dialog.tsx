import { SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@freetsy/ui/components/button";
import { Checkbox } from "@freetsy/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@freetsy/ui/components/dialog";
import { Field, FieldDescription, FieldTitle } from "@freetsy/ui/components/field";
import { ToggleGroup, ToggleGroupItem } from "@freetsy/ui/components/toggle-group";
import { cn } from "@freetsy/ui/lib/utils";
import { updateSettings, useAppSettings, type ThemeChoice } from "./app-settings";
import { LanguageSwitcher } from "./language-switcher";

const THEMES: ThemeChoice[] = ["system", "light", "dark"];

export function SettingsDialog() {
  const { t } = useTranslation();
  const settings = useAppSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t("prefs.open")}>
          <SettingsIcon strokeWidth="var(--stroke-icon)" />
          <span className={cn("hidden sm:inline")}>{t("prefs.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("prefs.title")}</DialogTitle>
          <DialogDescription>{t("prefs.description")}</DialogDescription>
        </DialogHeader>
        <div className={cn("flex flex-col gap-l")}>
          <LanguageSwitcher showLabel />
          <Field>
            <FieldTitle>{t("prefs.theme")}</FieldTitle>
            <ToggleGroup
              type="single"
              value={settings.theme}
              onValueChange={(value) => {
                if (THEMES.includes(value as ThemeChoice))
                  updateSettings({ theme: value as ThemeChoice });
              }}
            >
              {THEMES.map((theme) => (
                <ToggleGroupItem key={theme} value={theme} className={cn("flex-1")}>
                  {t(`prefs.theme_${theme}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              id="prefs-auto-cover"
              checked={settings.autoCover}
              onCheckedChange={(checked) => updateSettings({ autoCover: checked === true })}
            />
            <div className={cn("flex flex-col gap-xs")}>
              <FieldTitle>
                <label htmlFor="prefs-auto-cover">{t("prefs.autoCover")}</label>
              </FieldTitle>
              <FieldDescription>{t("prefs.autoCoverHint")}</FieldDescription>
            </div>
          </Field>
          <FieldDescription>{t("prefs.credit")}</FieldDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
