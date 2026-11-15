import { POSTER_FONTS, type PosterFontCategory } from "@freetsy/fonts";

const CATEGORY_ORDER: PosterFontCategory[] = ["sans", "serif", "display", "mono", "handwriting"];

export const FONT_OPTIONS = [...POSTER_FONTS]
  .sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.label.localeCompare(b.label),
  )
  .map((font) => ({ value: font.id, label: font.label, style: { fontFamily: font.family } }));
