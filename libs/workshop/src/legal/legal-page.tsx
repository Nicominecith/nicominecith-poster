import { createContext, useContext, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Card } from "@freetsy/ui/components/card";
import { cn } from "@freetsy/ui/lib/utils";

export const LEGAL_LINK = "underline hover:text-primary";

const NestedContext = createContext(false);

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <main
      className={cn("mx-auto flex w-full max-w-3xl flex-1 flex-col gap-xl px-lg py-xl sm:px-xl")}
    >
      <header className={cn("flex flex-col gap-l")}>
        <Link
          to="/"
          className={cn(
            "w-fit font-mono-ui text-xs tracking-eyebrow text-secondary uppercase hover:text-primary",
          )}
        >
          ← {t("nav.back")}
        </Link>
        <h1 className={cn("font-display text-4xl leading-[1.05] text-primary sm:text-5xl")}>
          {title}
        </h1>
      </header>
      <Card className={cn("font-body text-base leading-relaxed text-secondary")}>{children}</Card>
    </main>
  );
}

export function LegalChapter({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "flex flex-col gap-lg border-t border-tertiary pt-lg first:border-t-0 first:pt-0",
      )}
    >
      <h2 className={cn("font-display text-xl leading-tight text-primary sm:text-2xl")}>{title}</h2>
      <NestedContext.Provider value={true}>
        <div className={cn("flex flex-col gap-lg")}>{children}</div>
      </NestedContext.Provider>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  const Heading = useContext(NestedContext) ? "h3" : "h2";
  return (
    <section className={cn("flex flex-col gap-s")}>
      <Heading className={cn("font-mono-ui text-xs tracking-eyebrow text-primary uppercase")}>
        {title}
      </Heading>
      {children}
    </section>
  );
}

export function LegalHighlight({ children }: { children: ReactNode }) {
  return (
    <Alert>
      <AlertDescription className={cn("font-body text-base text-primary")}>
        {children}
      </AlertDescription>
    </Alert>
  );
}
