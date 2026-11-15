import antonUrl from "../assets/Anton-Regular.ttf?url";
import archivoUrl from "../assets/ArchivoBlack-Regular.ttf?url";
import interUrl from "../assets/Inter-Regular.woff?url";
import interBoldUrl from "../assets/Inter-Bold.woff?url";
import monoUrl from "../assets/JetBrainsMono-Regular.woff2?url";
import monoBoldUrl from "../assets/JetBrainsMono-Bold.woff2?url";
import robotoUrl from "../assets/Roboto-Regular.woff2?url";
import robotoBoldUrl from "../assets/Roboto-Bold.woff2?url";
import openSansUrl from "../assets/OpenSans-Regular.woff2?url";
import openSansBoldUrl from "../assets/OpenSans-Bold.woff2?url";
import montserratUrl from "../assets/Montserrat-Regular.woff2?url";
import montserratBoldUrl from "../assets/Montserrat-Bold.woff2?url";
import poppinsUrl from "../assets/Poppins-Regular.woff2?url";
import poppinsBoldUrl from "../assets/Poppins-Bold.woff2?url";
import latoUrl from "../assets/Lato-Regular.woff2?url";
import latoBoldUrl from "../assets/Lato-Bold.woff2?url";
import ralewayUrl from "../assets/Raleway-Regular.woff2?url";
import ralewayBoldUrl from "../assets/Raleway-Bold.woff2?url";
import workSansUrl from "../assets/WorkSans-Regular.woff2?url";
import workSansBoldUrl from "../assets/WorkSans-Bold.woff2?url";
import spaceGroteskUrl from "../assets/SpaceGrotesk-Regular.woff2?url";
import spaceGroteskBoldUrl from "../assets/SpaceGrotesk-Bold.woff2?url";
import oswaldUrl from "../assets/Oswald-Regular.woff2?url";
import oswaldBoldUrl from "../assets/Oswald-Bold.woff2?url";
import barlowCondensedUrl from "../assets/BarlowCondensed-Regular.woff2?url";
import barlowCondensedBoldUrl from "../assets/BarlowCondensed-Bold.woff2?url";
import playfairDisplayUrl from "../assets/PlayfairDisplay-Regular.woff2?url";
import playfairDisplayBoldUrl from "../assets/PlayfairDisplay-Bold.woff2?url";
import merriweatherUrl from "../assets/Merriweather-Regular.woff2?url";
import merriweatherBoldUrl from "../assets/Merriweather-Bold.woff2?url";
import loraUrl from "../assets/Lora-Regular.woff2?url";
import loraBoldUrl from "../assets/Lora-Bold.woff2?url";
import libreBaskervilleUrl from "../assets/LibreBaskerville-Regular.woff2?url";
import libreBaskervilleBoldUrl from "../assets/LibreBaskerville-Bold.woff2?url";
import ebGaramondUrl from "../assets/EBGaramond-Regular.woff2?url";
import ebGaramondBoldUrl from "../assets/EBGaramond-Bold.woff2?url";
import cormorantGaramondUrl from "../assets/CormorantGaramond-Regular.woff2?url";
import cormorantGaramondBoldUrl from "../assets/CormorantGaramond-Bold.woff2?url";
import bodoniModaUrl from "../assets/BodoniModa-Regular.woff2?url";
import bodoniModaBoldUrl from "../assets/BodoniModa-Bold.woff2?url";
import dmSerifDisplayUrl from "../assets/DMSerifDisplay-Regular.woff2?url";
import bebasNeueUrl from "../assets/BebasNeue-Regular.woff2?url";
import abrilFatfaceUrl from "../assets/AbrilFatface-Regular.woff2?url";
import alfaSlabOneUrl from "../assets/AlfaSlabOne-Regular.woff2?url";
import staatlichesUrl from "../assets/Staatliches-Regular.woff2?url";
import tekoUrl from "../assets/Teko-Regular.woff2?url";
import tekoBoldUrl from "../assets/Teko-Bold.woff2?url";
import spaceMonoUrl from "../assets/SpaceMono-Regular.woff2?url";
import spaceMonoBoldUrl from "../assets/SpaceMono-Bold.woff2?url";
import ibmPlexMonoUrl from "../assets/IBMPlexMono-Regular.woff2?url";
import ibmPlexMonoBoldUrl from "../assets/IBMPlexMono-Bold.woff2?url";
import caveatUrl from "../assets/Caveat-Regular.woff2?url";
import caveatBoldUrl from "../assets/Caveat-Bold.woff2?url";
import { POSTER_FONTS, type PosterFontId } from "./catalog";

type PosterFontFace = {
  weight: 400 | 700;
  url: string;
  format: "woff2" | "woff" | "truetype";
};

const POSTER_FONT_FACES: Record<PosterFontId, PosterFontFace[]> = {
  anton: [{ weight: 400, url: antonUrl, format: "truetype" }],
  archivo: [{ weight: 400, url: archivoUrl, format: "truetype" }],
  inter: [
    { weight: 400, url: interUrl, format: "woff" },
    { weight: 700, url: interBoldUrl, format: "woff" },
  ],
  mono: [
    { weight: 400, url: monoUrl, format: "woff2" },
    { weight: 700, url: monoBoldUrl, format: "woff2" },
  ],
  roboto: [
    { weight: 400, url: robotoUrl, format: "woff2" },
    { weight: 700, url: robotoBoldUrl, format: "woff2" },
  ],
  "open-sans": [
    { weight: 400, url: openSansUrl, format: "woff2" },
    { weight: 700, url: openSansBoldUrl, format: "woff2" },
  ],
  montserrat: [
    { weight: 400, url: montserratUrl, format: "woff2" },
    { weight: 700, url: montserratBoldUrl, format: "woff2" },
  ],
  poppins: [
    { weight: 400, url: poppinsUrl, format: "woff2" },
    { weight: 700, url: poppinsBoldUrl, format: "woff2" },
  ],
  lato: [
    { weight: 400, url: latoUrl, format: "woff2" },
    { weight: 700, url: latoBoldUrl, format: "woff2" },
  ],
  raleway: [
    { weight: 400, url: ralewayUrl, format: "woff2" },
    { weight: 700, url: ralewayBoldUrl, format: "woff2" },
  ],
  "work-sans": [
    { weight: 400, url: workSansUrl, format: "woff2" },
    { weight: 700, url: workSansBoldUrl, format: "woff2" },
  ],
  "space-grotesk": [
    { weight: 400, url: spaceGroteskUrl, format: "woff2" },
    { weight: 700, url: spaceGroteskBoldUrl, format: "woff2" },
  ],
  oswald: [
    { weight: 400, url: oswaldUrl, format: "woff2" },
    { weight: 700, url: oswaldBoldUrl, format: "woff2" },
  ],
  "barlow-condensed": [
    { weight: 400, url: barlowCondensedUrl, format: "woff2" },
    { weight: 700, url: barlowCondensedBoldUrl, format: "woff2" },
  ],
  "playfair-display": [
    { weight: 400, url: playfairDisplayUrl, format: "woff2" },
    { weight: 700, url: playfairDisplayBoldUrl, format: "woff2" },
  ],
  merriweather: [
    { weight: 400, url: merriweatherUrl, format: "woff2" },
    { weight: 700, url: merriweatherBoldUrl, format: "woff2" },
  ],
  lora: [
    { weight: 400, url: loraUrl, format: "woff2" },
    { weight: 700, url: loraBoldUrl, format: "woff2" },
  ],
  "libre-baskerville": [
    { weight: 400, url: libreBaskervilleUrl, format: "woff2" },
    { weight: 700, url: libreBaskervilleBoldUrl, format: "woff2" },
  ],
  "eb-garamond": [
    { weight: 400, url: ebGaramondUrl, format: "woff2" },
    { weight: 700, url: ebGaramondBoldUrl, format: "woff2" },
  ],
  "cormorant-garamond": [
    { weight: 400, url: cormorantGaramondUrl, format: "woff2" },
    { weight: 700, url: cormorantGaramondBoldUrl, format: "woff2" },
  ],
  "bodoni-moda": [
    { weight: 400, url: bodoniModaUrl, format: "woff2" },
    { weight: 700, url: bodoniModaBoldUrl, format: "woff2" },
  ],
  "dm-serif-display": [{ weight: 400, url: dmSerifDisplayUrl, format: "woff2" }],
  "bebas-neue": [{ weight: 400, url: bebasNeueUrl, format: "woff2" }],
  "abril-fatface": [{ weight: 400, url: abrilFatfaceUrl, format: "woff2" }],
  "alfa-slab-one": [{ weight: 400, url: alfaSlabOneUrl, format: "woff2" }],
  staatliches: [{ weight: 400, url: staatlichesUrl, format: "woff2" }],
  teko: [
    { weight: 400, url: tekoUrl, format: "woff2" },
    { weight: 700, url: tekoBoldUrl, format: "woff2" },
  ],
  "space-mono": [
    { weight: 400, url: spaceMonoUrl, format: "woff2" },
    { weight: 700, url: spaceMonoBoldUrl, format: "woff2" },
  ],
  "ibm-plex-mono": [
    { weight: 400, url: ibmPlexMonoUrl, format: "woff2" },
    { weight: 700, url: ibmPlexMonoBoldUrl, format: "woff2" },
  ],
  caveat: [
    { weight: 400, url: caveatUrl, format: "woff2" },
    { weight: 700, url: caveatBoldUrl, format: "woff2" },
  ],
};

function fontFaceRule(label: string, face: PosterFontFace, src: string, display?: "swap"): string {
  return `@font-face {
  font-family: "${label}";
  src: url("${src}") format("${face.format}");
  font-weight: ${face.weight};
  font-style: normal;${display ? `\n  font-display: ${display};` : ""}
}`;
}

let declared = false;

export function declarePosterFonts(): void {
  if (declared || typeof document === "undefined") return;
  declared = true;
  const style = document.createElement("style");
  style.dataset.posterFonts = "";
  style.textContent = POSTER_FONTS.flatMap((font) =>
    POSTER_FONT_FACES[font.id].map((face) => fontFaceRule(font.label, face, face.url, "swap")),
  ).join("\n");
  document.head.append(style);
}
