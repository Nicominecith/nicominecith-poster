export type PosterFontId =
  | "anton"
  | "archivo"
  | "inter"
  | "mono"
  | "roboto"
  | "open-sans"
  | "montserrat"
  | "poppins"
  | "lato"
  | "raleway"
  | "work-sans"
  | "space-grotesk"
  | "oswald"
  | "barlow-condensed"
  | "playfair-display"
  | "merriweather"
  | "lora"
  | "libre-baskerville"
  | "eb-garamond"
  | "cormorant-garamond"
  | "bodoni-moda"
  | "dm-serif-display"
  | "bebas-neue"
  | "abril-fatface"
  | "alfa-slab-one"
  | "staatliches"
  | "teko"
  | "space-mono"
  | "ibm-plex-mono"
  | "caveat";

export type PosterFontCategory = "sans" | "serif" | "display" | "mono" | "handwriting";

type PosterFont = {
  id: PosterFontId;
  label: string;
  family: string;
  category: PosterFontCategory;
  widthRatio: number;
};

export const POSTER_FONTS: readonly PosterFont[] = [
  {
    id: "anton",
    label: "Anton",
    family: '"Anton", sans-serif',
    category: "display",
    widthRatio: 0.56,
  },
  {
    id: "archivo",
    label: "Archivo Black",
    family: '"Archivo Black", sans-serif',
    category: "display",
    widthRatio: 0.62,
  },
  {
    id: "inter",
    label: "Inter",
    family: '"Inter", sans-serif',
    category: "sans",
    widthRatio: 0.55,
  },
  {
    id: "mono",
    label: "JetBrains Mono",
    family: '"JetBrains Mono", monospace',
    category: "mono",
    widthRatio: 0.6,
  },
  {
    id: "roboto",
    label: "Roboto",
    family: '"Roboto", sans-serif',
    category: "sans",
    widthRatio: 0.52,
  },
  {
    id: "open-sans",
    label: "Open Sans",
    family: '"Open Sans", sans-serif',
    category: "sans",
    widthRatio: 0.53,
  },
  {
    id: "montserrat",
    label: "Montserrat",
    family: '"Montserrat", sans-serif',
    category: "sans",
    widthRatio: 0.58,
  },
  {
    id: "poppins",
    label: "Poppins",
    family: '"Poppins", sans-serif',
    category: "sans",
    widthRatio: 0.58,
  },
  { id: "lato", label: "Lato", family: '"Lato", sans-serif', category: "sans", widthRatio: 0.51 },
  {
    id: "raleway",
    label: "Raleway",
    family: '"Raleway", sans-serif',
    category: "sans",
    widthRatio: 0.52,
  },
  {
    id: "work-sans",
    label: "Work Sans",
    family: '"Work Sans", sans-serif',
    category: "sans",
    widthRatio: 0.53,
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: '"Space Grotesk", sans-serif',
    category: "sans",
    widthRatio: 0.53,
  },
  {
    id: "oswald",
    label: "Oswald",
    family: '"Oswald", sans-serif',
    category: "sans",
    widthRatio: 0.45,
  },
  {
    id: "barlow-condensed",
    label: "Barlow Condensed",
    family: '"Barlow Condensed", sans-serif',
    category: "sans",
    widthRatio: 0.42,
  },
  {
    id: "playfair-display",
    label: "Playfair Display",
    family: '"Playfair Display", serif',
    category: "serif",
    widthRatio: 0.5,
  },
  {
    id: "merriweather",
    label: "Merriweather",
    family: '"Merriweather", serif',
    category: "serif",
    widthRatio: 0.57,
  },
  { id: "lora", label: "Lora", family: '"Lora", serif', category: "serif", widthRatio: 0.52 },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    family: '"Libre Baskerville", serif',
    category: "serif",
    widthRatio: 0.56,
  },
  {
    id: "eb-garamond",
    label: "EB Garamond",
    family: '"EB Garamond", serif',
    category: "serif",
    widthRatio: 0.46,
  },
  {
    id: "cormorant-garamond",
    label: "Cormorant Garamond",
    family: '"Cormorant Garamond", serif',
    category: "serif",
    widthRatio: 0.42,
  },
  {
    id: "bodoni-moda",
    label: "Bodoni Moda",
    family: '"Bodoni Moda", serif',
    category: "serif",
    widthRatio: 0.48,
  },
  {
    id: "dm-serif-display",
    label: "DM Serif Display",
    family: '"DM Serif Display", serif',
    category: "serif",
    widthRatio: 0.48,
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    family: '"Bebas Neue", sans-serif',
    category: "display",
    widthRatio: 0.4,
  },
  {
    id: "abril-fatface",
    label: "Abril Fatface",
    family: '"Abril Fatface", sans-serif',
    category: "display",
    widthRatio: 0.52,
  },
  {
    id: "alfa-slab-one",
    label: "Alfa Slab One",
    family: '"Alfa Slab One", sans-serif',
    category: "display",
    widthRatio: 0.6,
  },
  {
    id: "staatliches",
    label: "Staatliches",
    family: '"Staatliches", sans-serif',
    category: "display",
    widthRatio: 0.42,
  },
  {
    id: "teko",
    label: "Teko",
    family: '"Teko", sans-serif',
    category: "display",
    widthRatio: 0.38,
  },
  {
    id: "space-mono",
    label: "Space Mono",
    family: '"Space Mono", monospace',
    category: "mono",
    widthRatio: 0.6,
  },
  {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    family: '"IBM Plex Mono", monospace',
    category: "mono",
    widthRatio: 0.6,
  },
  {
    id: "caveat",
    label: "Caveat",
    family: '"Caveat", cursive',
    category: "handwriting",
    widthRatio: 0.42,
  },
];

const BY_ID = new Map(POSTER_FONTS.map((font) => [font.id, font]));

export function posterFont(id: PosterFontId): PosterFont {
  return BY_ID.get(id) ?? POSTER_FONTS[0];
}

export function posterFontFamily(id: PosterFontId): string {
  return posterFont(id).family;
}

export function posterFontWidthRatio(id: PosterFontId): number {
  return posterFont(id).widthRatio;
}
