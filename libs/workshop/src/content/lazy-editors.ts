import { lazy } from "react";

export const LazyListEditor = lazy(() =>
  import("./list-editor").then((module) => ({ default: module.ListEditor })),
);

export const LazyInfoCreditsEditor = lazy(() =>
  import("./info-credits-editor").then((module) => ({ default: module.InfoCreditsEditor })),
);
