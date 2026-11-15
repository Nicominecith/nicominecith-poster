import sansUrl from "../assets/DejaVuSans.fallback.ttf?url";
import sansBoldUrl from "../assets/DejaVuSans-Bold.fallback.ttf?url";
import serifUrl from "../assets/DejaVuSerif.fallback.ttf?url";
import serifBoldUrl from "../assets/DejaVuSerif-Bold.fallback.ttf?url";
import monoUrl from "../assets/DejaVuSansMono.fallback.ttf?url";
import monoBoldUrl from "../assets/DejaVuSansMono-Bold.fallback.ttf?url";

import type { PosterFontCategory } from "./catalog";

export function fallbackAssets(category: PosterFontCategory, weight: 400 | 700): string[] {
  const bold = weight === 700;
  const sans = bold ? sansBoldUrl : sansUrl;
  if (category === "serif") return [bold ? serifBoldUrl : serifUrl, sans];
  if (category === "mono") return [bold ? monoBoldUrl : monoUrl, sans];
  return [sans];
}
