import { useTranslation } from "react-i18next";
import { SettingsDialog } from "./settings-dialog";
import { useWorkshopId } from "./workshop-context";
import { WORKSHOPS } from "./workshops";
import { cn } from "@freetsy/ui/lib/utils";

export function SiteHeader() {
  const { t } = useTranslation();
  const current = useWorkshopId();

  return (
    <header className={cn("border-b border-tertiary")}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-m px-lg pt-l sm:px-xl",
          "sm:flex-row sm:items-end sm:justify-between sm:gap-l",
        )}
      >
        <div className={cn("flex items-center justify-between gap-l sm:pb-l")}>
          <a
            href="/"
            className={cn(
              "font-mono-ui text-xs tracking-eyebrow text-secondary uppercase hover:text-primary",
            )}
          >
            {t("nav.brand")}
          </a>
          <div className={cn("sm:hidden")}>
            <SettingsDialog />
          </div>
        </div>

        <nav
          aria-label={t("nav.workshops")}
          className={cn("-mb-px flex gap-m overflow-x-auto sm:gap-l")}
        >
          {WORKSHOPS.map((workshop) => (
            <a
              key={workshop.id}
              href={workshop.href}
              data-status={workshop.id === current ? "active" : undefined}
              aria-current={workshop.id === current ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 border-transparent pb-m font-mono-ui text-2xs whitespace-nowrap sm:text-xs sm:tracking-ui",
                "text-secondary uppercase transition-colors hover:text-primary",
                "data-[status=active]:border-accent data-[status=active]:text-primary",
              )}
            >
              {t(workshop.label)}
            </a>
          ))}
        </nav>

        <div className={cn("hidden sm:block sm:pb-l")}>
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
}
