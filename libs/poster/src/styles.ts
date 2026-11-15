export type PosterStyleId =
  "classic" | "gallery" | "sand" | "paper" | "onyx" | "noir" | "mono" | "bloom";

type PosterStyleOption = {
  id: PosterStyleId;
  label: string;
};

export const POSTER_STYLES: PosterStyleOption[] = [
  { id: "bloom", label: "Bloom" },
  { id: "classic", label: "Classic" },
  { id: "gallery", label: "Gallery" },
  { id: "mono", label: "Mono" },
  { id: "noir", label: "Noir" },
  { id: "onyx", label: "Onyx" },
  { id: "paper", label: "Paper" },
  { id: "sand", label: "Sand" },
];

export const DEFAULT_STYLE_ID: PosterStyleId = "bloom";
