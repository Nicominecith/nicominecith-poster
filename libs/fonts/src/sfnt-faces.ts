import antonUrlSfnt from "../assets/Anton-Regular.ttf?url";
import archivoUrlSfnt from "../assets/ArchivoBlack-Regular.ttf?url";
import interUrlSfnt from "../assets/Inter-Regular.sfnt.ttf?url";
import interBoldUrlSfnt from "../assets/Inter-Bold.sfnt.ttf?url";
import monoUrlSfnt from "../assets/JetBrainsMono-Regular.sfnt.ttf?url";
import monoBoldUrlSfnt from "../assets/JetBrainsMono-Bold.sfnt.ttf?url";
import robotoUrlSfnt from "../assets/Roboto-Regular.sfnt.ttf?url";
import robotoBoldUrlSfnt from "../assets/Roboto-Bold.sfnt.ttf?url";
import openSansUrlSfnt from "../assets/OpenSans-Regular.sfnt.ttf?url";
import openSansBoldUrlSfnt from "../assets/OpenSans-Bold.sfnt.ttf?url";
import montserratUrlSfnt from "../assets/Montserrat-Regular.sfnt.ttf?url";
import montserratBoldUrlSfnt from "../assets/Montserrat-Bold.sfnt.ttf?url";
import poppinsUrlSfnt from "../assets/Poppins-Regular.sfnt.ttf?url";
import poppinsBoldUrlSfnt from "../assets/Poppins-Bold.sfnt.ttf?url";
import latoUrlSfnt from "../assets/Lato-Regular.sfnt.ttf?url";
import latoBoldUrlSfnt from "../assets/Lato-Bold.sfnt.ttf?url";
import ralewayUrlSfnt from "../assets/Raleway-Regular.sfnt.ttf?url";
import ralewayBoldUrlSfnt from "../assets/Raleway-Bold.sfnt.ttf?url";
import workSansUrlSfnt from "../assets/WorkSans-Regular.sfnt.ttf?url";
import workSansBoldUrlSfnt from "../assets/WorkSans-Bold.sfnt.ttf?url";
import spaceGroteskUrlSfnt from "../assets/SpaceGrotesk-Regular.sfnt.ttf?url";
import spaceGroteskBoldUrlSfnt from "../assets/SpaceGrotesk-Bold.sfnt.ttf?url";
import oswaldUrlSfnt from "../assets/Oswald-Regular.sfnt.ttf?url";
import oswaldBoldUrlSfnt from "../assets/Oswald-Bold.sfnt.ttf?url";
import barlowCondensedUrlSfnt from "../assets/BarlowCondensed-Regular.sfnt.ttf?url";
import barlowCondensedBoldUrlSfnt from "../assets/BarlowCondensed-Bold.sfnt.ttf?url";
import playfairDisplayUrlSfnt from "../assets/PlayfairDisplay-Regular.sfnt.ttf?url";
import playfairDisplayBoldUrlSfnt from "../assets/PlayfairDisplay-Bold.sfnt.ttf?url";
import merriweatherUrlSfnt from "../assets/Merriweather-Regular.sfnt.ttf?url";
import merriweatherBoldUrlSfnt from "../assets/Merriweather-Bold.sfnt.ttf?url";
import loraUrlSfnt from "../assets/Lora-Regular.sfnt.ttf?url";
import loraBoldUrlSfnt from "../assets/Lora-Bold.sfnt.ttf?url";
import libreBaskervilleUrlSfnt from "../assets/LibreBaskerville-Regular.sfnt.ttf?url";
import libreBaskervilleBoldUrlSfnt from "../assets/LibreBaskerville-Bold.sfnt.ttf?url";
import ebGaramondUrlSfnt from "../assets/EBGaramond-Regular.sfnt.ttf?url";
import ebGaramondBoldUrlSfnt from "../assets/EBGaramond-Bold.sfnt.ttf?url";
import cormorantGaramondUrlSfnt from "../assets/CormorantGaramond-Regular.sfnt.ttf?url";
import cormorantGaramondBoldUrlSfnt from "../assets/CormorantGaramond-Bold.sfnt.ttf?url";
import bodoniModaUrlSfnt from "../assets/BodoniModa-Regular.sfnt.ttf?url";
import bodoniModaBoldUrlSfnt from "../assets/BodoniModa-Bold.sfnt.ttf?url";
import dmSerifDisplayUrlSfnt from "../assets/DMSerifDisplay-Regular.sfnt.ttf?url";
import bebasNeueUrlSfnt from "../assets/BebasNeue-Regular.sfnt.ttf?url";
import abrilFatfaceUrlSfnt from "../assets/AbrilFatface-Regular.sfnt.ttf?url";
import alfaSlabOneUrlSfnt from "../assets/AlfaSlabOne-Regular.sfnt.ttf?url";
import staatlichesUrlSfnt from "../assets/Staatliches-Regular.sfnt.ttf?url";
import tekoUrlSfnt from "../assets/Teko-Regular.sfnt.ttf?url";
import tekoBoldUrlSfnt from "../assets/Teko-Bold.sfnt.ttf?url";
import spaceMonoUrlSfnt from "../assets/SpaceMono-Regular.sfnt.ttf?url";
import spaceMonoBoldUrlSfnt from "../assets/SpaceMono-Bold.sfnt.ttf?url";
import ibmPlexMonoUrlSfnt from "../assets/IBMPlexMono-Regular.sfnt.ttf?url";
import ibmPlexMonoBoldUrlSfnt from "../assets/IBMPlexMono-Bold.sfnt.ttf?url";
import caveatUrlSfnt from "../assets/Caveat-Regular.sfnt.ttf?url";
import caveatBoldUrlSfnt from "../assets/Caveat-Bold.sfnt.ttf?url";

import type { PosterFontId } from "./catalog";

type PosterFontSfntFace = { weight: 400 | 700; asset: string };

export const POSTER_FONT_SFNT_FACES: Record<PosterFontId, PosterFontSfntFace[]> = {
  anton: [{ weight: 400, asset: antonUrlSfnt }],
  archivo: [{ weight: 400, asset: archivoUrlSfnt }],
  inter: [
    { weight: 400, asset: interUrlSfnt },
    { weight: 700, asset: interBoldUrlSfnt },
  ],
  mono: [
    { weight: 400, asset: monoUrlSfnt },
    { weight: 700, asset: monoBoldUrlSfnt },
  ],
  roboto: [
    { weight: 400, asset: robotoUrlSfnt },
    { weight: 700, asset: robotoBoldUrlSfnt },
  ],
  "open-sans": [
    { weight: 400, asset: openSansUrlSfnt },
    { weight: 700, asset: openSansBoldUrlSfnt },
  ],
  montserrat: [
    { weight: 400, asset: montserratUrlSfnt },
    { weight: 700, asset: montserratBoldUrlSfnt },
  ],
  poppins: [
    { weight: 400, asset: poppinsUrlSfnt },
    { weight: 700, asset: poppinsBoldUrlSfnt },
  ],
  lato: [
    { weight: 400, asset: latoUrlSfnt },
    { weight: 700, asset: latoBoldUrlSfnt },
  ],
  raleway: [
    { weight: 400, asset: ralewayUrlSfnt },
    { weight: 700, asset: ralewayBoldUrlSfnt },
  ],
  "work-sans": [
    { weight: 400, asset: workSansUrlSfnt },
    { weight: 700, asset: workSansBoldUrlSfnt },
  ],
  "space-grotesk": [
    { weight: 400, asset: spaceGroteskUrlSfnt },
    { weight: 700, asset: spaceGroteskBoldUrlSfnt },
  ],
  oswald: [
    { weight: 400, asset: oswaldUrlSfnt },
    { weight: 700, asset: oswaldBoldUrlSfnt },
  ],
  "barlow-condensed": [
    { weight: 400, asset: barlowCondensedUrlSfnt },
    { weight: 700, asset: barlowCondensedBoldUrlSfnt },
  ],
  "playfair-display": [
    { weight: 400, asset: playfairDisplayUrlSfnt },
    { weight: 700, asset: playfairDisplayBoldUrlSfnt },
  ],
  merriweather: [
    { weight: 400, asset: merriweatherUrlSfnt },
    { weight: 700, asset: merriweatherBoldUrlSfnt },
  ],
  lora: [
    { weight: 400, asset: loraUrlSfnt },
    { weight: 700, asset: loraBoldUrlSfnt },
  ],
  "libre-baskerville": [
    { weight: 400, asset: libreBaskervilleUrlSfnt },
    { weight: 700, asset: libreBaskervilleBoldUrlSfnt },
  ],
  "eb-garamond": [
    { weight: 400, asset: ebGaramondUrlSfnt },
    { weight: 700, asset: ebGaramondBoldUrlSfnt },
  ],
  "cormorant-garamond": [
    { weight: 400, asset: cormorantGaramondUrlSfnt },
    { weight: 700, asset: cormorantGaramondBoldUrlSfnt },
  ],
  "bodoni-moda": [
    { weight: 400, asset: bodoniModaUrlSfnt },
    { weight: 700, asset: bodoniModaBoldUrlSfnt },
  ],
  "dm-serif-display": [{ weight: 400, asset: dmSerifDisplayUrlSfnt }],
  "bebas-neue": [{ weight: 400, asset: bebasNeueUrlSfnt }],
  "abril-fatface": [{ weight: 400, asset: abrilFatfaceUrlSfnt }],
  "alfa-slab-one": [{ weight: 400, asset: alfaSlabOneUrlSfnt }],
  staatliches: [{ weight: 400, asset: staatlichesUrlSfnt }],
  teko: [
    { weight: 400, asset: tekoUrlSfnt },
    { weight: 700, asset: tekoBoldUrlSfnt },
  ],
  "space-mono": [
    { weight: 400, asset: spaceMonoUrlSfnt },
    { weight: 700, asset: spaceMonoBoldUrlSfnt },
  ],
  "ibm-plex-mono": [
    { weight: 400, asset: ibmPlexMonoUrlSfnt },
    { weight: 700, asset: ibmPlexMonoBoldUrlSfnt },
  ],
  caveat: [
    { weight: 400, asset: caveatUrlSfnt },
    { weight: 700, asset: caveatBoldUrlSfnt },
  ],
};
