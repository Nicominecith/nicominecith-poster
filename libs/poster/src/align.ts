export type PosterTextAlign = "left" | "center" | "right";

export const POSTER_TEXT_ALIGNS = [
  "left",
  "center",
  "right",
] as const satisfies readonly PosterTextAlign[];

export const DEFAULT_TITLE_ALIGN: PosterTextAlign = "left";
