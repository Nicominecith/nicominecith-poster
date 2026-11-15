import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { declarePosterFonts } from "@freetsy/fonts";
import "@freetsy/i18n";
import { followLegacyHashLink } from "./legacy-hash-link";
import { QueryProvider } from "./query-provider";
import { createWorkshopRouter } from "./router";
import { WorkshopContext } from "./workshop-context";
import type { WorkshopId } from "./workshops";

export type WorkshopApp = {
  id: WorkshopId;
  Home: ComponentType;
};

export function mountWorkshop({ id, Home }: WorkshopApp): void {
  if (followLegacyHashLink()) return;
  declarePosterFonts();

  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element #root not found");

  const router = createWorkshopRouter(Home);
  createRoot(rootElement).render(
    <StrictMode>
      <WorkshopContext value={id}>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </WorkshopContext>
    </StrictMode>,
  );
}
