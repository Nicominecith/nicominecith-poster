import { useTranslation } from "react-i18next";
import type { PosterKind } from "@freetsy/poster";
import { cn } from "@freetsy/ui/lib/utils";
import { SITE } from "../app/site-config";
import { WORKSHOP_COPY } from "./workshop-copy";

export function PageHeader({ kind }: { kind: PosterKind }) {
  const { t } = useTranslation();
  const { page } = WORKSHOP_COPY[kind];

  return (
    <header className={cn("flex flex-col gap-l")}>
      <span className={cn("font-mono-ui text-xs tracking-brand text-secondary uppercase")}>
        {[SITE.owner, t(`${page}.eyebrow`)].filter(Boolean).join(" · ")}
      </span>
      <h1 className={cn("font-display text-5xl leading-display text-primary sm:text-6xl")}>
        {t(`${page}.titleTop`)}
        <br />
        {t(`${page}.titleBottom`)}
      </h1>
    </header>
  );
}
