import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@freetsy/ui/lib/utils";
import { SITE } from "./site-config";

const LINKS = [
  { to: "/nutzungsbedingungen", labelKey: "nav.terms" },
  { to: "/datenschutz", labelKey: "nav.privacy" },
  { to: "/impressum", labelKey: "nav.imprint" },
] as const;

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className={cn("mt-xl border-t border-tertiary")}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-m p-lg sm:flex-row sm:items-center sm:justify-between sm:px-xl",
        )}
      >
        <span className={cn("font-mono-ui text-xs tracking-eyebrow text-secondary uppercase")}>
          {[t("nav.brand"), `von ${SITE.owner}`].join(" · ")}
        </span>
        <nav className={cn("flex flex-wrap gap-x-lg gap-y-s")}>
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "font-mono-ui text-xs tracking-ui text-secondary uppercase hover:text-primary",
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
