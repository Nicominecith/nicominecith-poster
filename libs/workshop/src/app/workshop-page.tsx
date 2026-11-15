import type { ReactNode } from "react";
import { cn } from "@freetsy/ui/lib/utils";

export function WorkshopPage({ children }: { children: ReactNode }) {
  return (
    <main
      className={cn("mx-auto flex w-full max-w-6xl flex-1 flex-col gap-xl px-lg py-xl sm:px-xl")}
    >
      {children}
    </main>
  );
}
