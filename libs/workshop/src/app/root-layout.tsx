import { Outlet } from "@tanstack/react-router";
import { useDocumentLanguage } from "@freetsy/i18n";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { TooltipProvider } from "@freetsy/ui/components/tooltip";
import { cn } from "@freetsy/ui/lib/utils";

export function RootLayout() {
  useDocumentLanguage();

  return (
    <TooltipProvider>
      <div className={cn("flex min-h-full flex-1 flex-col")}>
        <SiteHeader />
        <Outlet />
        <SiteFooter />
      </div>
    </TooltipProvider>
  );
}
