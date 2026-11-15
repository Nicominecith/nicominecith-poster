import type { ComponentType } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { RootLayout } from "./root-layout";
import { WorkshopPage } from "./workshop-page";

export function createWorkshopRouter(Home: ComponentType) {
  const rootRoute = createRootRoute({ component: RootLayout });

  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => (
        <WorkshopPage>
          <Home />
        </WorkshopPage>
      ),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/nutzungsbedingungen",
      component: lazyRouteComponent(() => import("../legal/terms-route"), "TermsRoute"),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/datenschutz",
      component: lazyRouteComponent(() => import("../legal/privacy-route"), "PrivacyRoute"),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/impressum",
      component: lazyRouteComponent(() => import("../legal/imprint-route"), "ImprintRoute"),
    }),
  ]);

  return createRouter({
    routeTree,
    basepath: import.meta.env.BASE_URL,
    defaultPreload: "intent",
  });
}

type WorkshopRouter = ReturnType<typeof createWorkshopRouter>;

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: WorkshopRouter;
  }
}
