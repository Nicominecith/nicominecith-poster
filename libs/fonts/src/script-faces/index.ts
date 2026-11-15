import type { ScriptFamily } from "./types";

export const DEJAVU_COVERAGE: ReadonlyArray<readonly [number, number]> = [
  [0xa4, 0xa4], [0xad, 0xad], [0xb5, 0xb5], [0xbc, 0xbe], [0x100, 0x130], [0x132, 0x151], [0x154, 0x2c5], [0x2c7, 0x2d9], [0x2db, 0x2db], [0x2dd, 0x2e9], [0x2ec, 0x2ee], [0x2f3, 0x2f3], [0x2f7, 0x2f7], [0x300, 0x34f], [0x351, 0x353], [0x357, 0x358], [0x35a, 0x35a], [0x35c, 0x362], [0x370, 0x377], [0x37a, 0x37f], [0x384, 0x38a], [0x38c, 0x38c], [0x38e, 0x3a1], [0x3a3, 0x525], [0x1e00, 0x1efb], [0x2000, 0x2012], [0x2015, 0x2017], [0x201b, 0x201b], [0x201f, 0x2021], [0x2023, 0x2025], [0x2027, 0x2038], [0x203b, 0x2043], [0x2045, 0x2064], [0x206a, 0x2071], [0x2074, 0x208e], [0x2090, 0x209c], [0x20a0, 0x20ab], [0x20ad, 0x20b5], [0x20b8, 0x20ba], [0x20bd, 0x20bd], [0x2100, 0x2109], [0x210b, 0x2121], [0x2123, 0x2149], [0x214b, 0x214b], [0x214e, 0x214e], [0x2150, 0x2185], [0x2189, 0x2189], [0x2190, 0x2211], [0x2213, 0x22ff], [0x25a0, 0x269c], [0x269e, 0x26b8], [0x26c0, 0x26c3], [0x26e2, 0x26e2], [0x2701, 0x2704], [0x2706, 0x2709], [0x270c, 0x2727], [0x2729, 0x274b], [0x274d, 0x274d], [0x274f, 0x2752], [0x2756, 0x2756], [0x2758, 0x275e], [0x2761, 0x2794], [0x2798, 0x27af], [0x27b1, 0x27be],
];

export const SCRIPT_FAMILIES: readonly ScriptFamily[] = [
  {
    id: "noto-sans-arabic",
    outline: [[0x600, 0x8ff], [0x2e41, 0x2e41], [0xfb50, 0xfeff], [0x10efd, 0x10eff]],
    load: async () => (await import("./noto-sans-arabic")).default,
  },
  {
    id: "noto-sans-hebrew",
    outline: [[0x591, 0x5f4], [0xfb1d, 0xfb4f]],
    load: async () => (await import("./noto-sans-hebrew")).default,
  },
  {
    id: "noto-sans-devanagari",
    outline: [[0x900, 0x97f], [0x1cd0, 0x1cf9], [0x20f0, 0x20f0], [0xa830, 0xa8ff], [0x11b00, 0x11b09]],
    load: async () => (await import("./noto-sans-devanagari")).default,
  },
  {
    id: "noto-sans-bengali",
    outline: [[0x951, 0x9fe], [0x1cd0, 0x1cf7], [0xa8f1, 0xa8f1]],
    load: async () => (await import("./noto-sans-bengali")).default,
  },
  {
    id: "noto-sans-gurmukhi",
    outline: [[0x951, 0xa76], [0xa830, 0xa839]],
    load: async () => (await import("./noto-sans-gurmukhi")).default,
  },
  {
    id: "noto-sans-gujarati",
    outline: [[0x951, 0x965], [0xa81, 0xaff], [0xa830, 0xa839]],
    load: async () => (await import("./noto-sans-gujarati")).default,
  },
  {
    id: "noto-sans-oriya",
    outline: [[0x964, 0x965], [0xb01, 0xb77]],
    load: async () => (await import("./noto-sans-oriya")).default,
  },
  {
    id: "noto-sans-tamil",
    outline: [[0x964, 0x965], [0xb82, 0xbfa]],
    load: async () => (await import("./noto-sans-tamil")).default,
  },
  {
    id: "noto-sans-telugu",
    outline: [[0x951, 0x965], [0xc00, 0xc7f], [0x1cda, 0x1cf2]],
    load: async () => (await import("./noto-sans-telugu")).default,
  },
  {
    id: "noto-sans-kannada",
    outline: [[0x951, 0x965], [0xc80, 0xcf3], [0x1cd0, 0x1cf4], [0xa830, 0xa835]],
    load: async () => (await import("./noto-sans-kannada")).default,
  },
  {
    id: "noto-sans-malayalam",
    outline: [[0x951, 0x965], [0xd00, 0xd7f], [0x1cda, 0x1cda], [0xa830, 0xa832]],
    load: async () => (await import("./noto-sans-malayalam")).default,
  },
  {
    id: "noto-sans-sinhala",
    outline: [[0x964, 0x965], [0xd81, 0xdf4], [0x111e1, 0x111f4]],
    load: async () => (await import("./noto-sans-sinhala")).default,
  },
  {
    id: "noto-sans-thai",
    outline: [[0xe01, 0xe5b]],
    load: async () => (await import("./noto-sans-thai")).default,
  },
  {
    id: "noto-sans-lao",
    outline: [[0xe81, 0xedf]],
    load: async () => (await import("./noto-sans-lao")).default,
  },
  {
    id: "noto-sans-khmer",
    outline: [[0x1780, 0x17f9], [0x19e0, 0x19ff]],
    load: async () => (await import("./noto-sans-khmer")).default,
  },
  {
    id: "noto-sans-myanmar",
    outline: [[0x1000, 0x109f], [0xa92e, 0xaa7f], [0xfe00, 0xfe00]],
    load: async () => (await import("./noto-sans-myanmar")).default,
  },
  {
    id: "noto-sans-armenian",
    outline: [[0x531, 0x58f], [0xfb13, 0xfb17]],
    load: async () => (await import("./noto-sans-armenian")).default,
  },
  {
    id: "noto-sans-georgian",
    outline: [[0x589, 0x589], [0x10a0, 0x10ff], [0x1c90, 0x1cbf], [0x20be, 0x20be], [0x2d00, 0x2d2d]],
    load: async () => (await import("./noto-sans-georgian")).default,
  },
  {
    id: "noto-sans-ethiopic",
    outline: [[0x1200, 0x1399], [0x2d80, 0x2dde], [0xab01, 0xab2e], [0x1e7e0, 0x1e7fe]],
    load: async () => (await import("./noto-sans-ethiopic")).default,
  },
  {
    id: "noto-serif-tibetan",
    outline: [[0xf00, 0xfda]],
    load: async () => (await import("./noto-serif-tibetan")).default,
  },
  {
    id: "noto-sans-thaana",
    outline: [[0x60c, 0x66c], [0x780, 0x7b1], [0xfdf2, 0xfdfd]],
    load: async () => (await import("./noto-sans-thaana")).default,
  },
  {
    id: "noto-sans-syriac",
    outline: [[0x60c, 0x74f]],
    load: async () => (await import("./noto-sans-syriac")).default,
  },
  {
    id: "noto-sans-mongolian",
    outline: [[0x1800, 0x18aa], [0x3001, 0x300f], [0xff01, 0xff3d], [0x11660, 0x1166c]],
    load: async () => (await import("./noto-sans-mongolian")).default,
  },
  {
    id: "noto-sans-nko",
    outline: [[0x60c, 0x66a], [0x7c0, 0x7ff], [0x2e1c, 0x2e1d], [0xfd3e, 0xfd3f]],
    load: async () => (await import("./noto-sans-nko")).default,
  },
  {
    id: "noto-sans-tifinagh",
    outline: [[0x2d30, 0x2d7f]],
    load: async () => (await import("./noto-sans-tifinagh")).default,
  },
  {
    id: "noto-sans-cherokee",
    outline: [[0x13a0, 0x13fd], [0xab70, 0xabbf]],
    load: async () => (await import("./noto-sans-cherokee")).default,
  },
  {
    id: "noto-sans-canadian-aboriginal",
    outline: [[0x1400, 0x167f], [0x18b0, 0x18f5], [0x11ab0, 0x11abf]],
    load: async () => (await import("./noto-sans-canadian-aboriginal")).default,
  },
  {
    id: "noto-sans-yi",
    outline: [[0x3001, 0x30fb], [0xa000, 0xa4c6], [0xff01, 0xff65]],
    load: async () => (await import("./noto-sans-yi")).default,
  },
  {
    id: "noto-sans-adlam",
    outline: [[0x61f, 0x640], [0x2e28, 0x2e41], [0x1e900, 0x1e95f]],
    load: async () => (await import("./noto-sans-adlam")).default,
  },
  {
    id: "noto-sans-javanese",
    outline: [[0xa980, 0xa9df]],
    load: async () => (await import("./noto-sans-javanese")).default,
  },
  {
    id: "noto-sans-balinese",
    outline: [[0x1b00, 0x1b7c]],
    load: async () => (await import("./noto-sans-balinese")).default,
  },
  {
    id: "noto-sans-sundanese",
    outline: [[0x1b80, 0x1bbf], [0x1cc0, 0x1cc7]],
    load: async () => (await import("./noto-sans-sundanese")).default,
  },
  {
    id: "noto-sans-ol-chiki",
    outline: [[0x1c50, 0x1c7f]],
    load: async () => (await import("./noto-sans-ol-chiki")).default,
  },
  {
    id: "noto-sans-lisu",
    outline: [[0x300a, 0x300b], [0xa4d0, 0xa4ff], [0x11fb0, 0x11fb0]],
    load: async () => (await import("./noto-sans-lisu")).default,
  },
  {
    id: "noto-sans-vai",
    outline: [[0xa500, 0xa62b]],
    load: async () => (await import("./noto-sans-vai")).default,
  },
  {
    id: "noto-sans-bamum",
    outline: [[0xa6a0, 0xa6f7], [0x16800, 0x16a38]],
    load: async () => (await import("./noto-sans-bamum")).default,
  },
  {
    id: "noto-sans-osage",
    outline: [[0x104b0, 0x104fb]],
    load: async () => (await import("./noto-sans-osage")).default,
  },
  {
    id: "noto-sans-tai-viet",
    outline: [[0xaa80, 0xaadf]],
    load: async () => (await import("./noto-sans-tai-viet")).default,
  },
  {
    id: "noto-sans-tai-le",
    outline: [[0x1040, 0x1049], [0x1950, 0x1974], [0x3001, 0x300b]],
    load: async () => (await import("./noto-sans-tai-le")).default,
  },
  {
    id: "noto-sans-tai-tham",
    outline: [[0x1a20, 0x1aad]],
    load: async () => (await import("./noto-sans-tai-tham")).default,
  },
  {
    id: "noto-sans-new-tai-lue",
    outline: [[0x1980, 0x19df]],
    load: async () => (await import("./noto-sans-new-tai-lue")).default,
  },
  {
    id: "noto-sans-buginese",
    outline: [[0x1a00, 0x1a1f], [0xa9cf, 0xa9cf]],
    load: async () => (await import("./noto-sans-buginese")).default,
  },
  {
    id: "noto-sans-batak",
    outline: [[0x1bc0, 0x1bff]],
    load: async () => (await import("./noto-sans-batak")).default,
  },
  {
    id: "noto-sans-cham",
    outline: [[0xaa00, 0xaa5f]],
    load: async () => (await import("./noto-sans-cham")).default,
  },
  {
    id: "noto-sans-chakma",
    outline: [[0x9e6, 0x9ef], [0x1040, 0x1049], [0x11100, 0x11147]],
    load: async () => (await import("./noto-sans-chakma")).default,
  },
  {
    id: "noto-sans-meetei-mayek",
    outline: [[0xaae0, 0xabf9]],
    load: async () => (await import("./noto-sans-meetei-mayek")).default,
  },
  {
    id: "noto-sans-lepcha",
    outline: [[0x1c00, 0x1c4f]],
    load: async () => (await import("./noto-sans-lepcha")).default,
  },
  {
    id: "noto-sans-limbu",
    outline: [[0x964, 0x965], [0x1900, 0x194f]],
    load: async () => (await import("./noto-sans-limbu")).default,
  },
  {
    id: "noto-sans-saurashtra",
    outline: [[0xa880, 0xa8d9]],
    load: async () => (await import("./noto-sans-saurashtra")).default,
  },
  {
    id: "noto-sans-syloti-nagri",
    outline: [[0x964, 0x9ef], [0xa800, 0xa82c]],
    load: async () => (await import("./noto-sans-syloti-nagri")).default,
  },
  {
    id: "noto-sans-kayah-li",
    outline: [[0xa900, 0xa92f]],
    load: async () => (await import("./noto-sans-kayah-li")).default,
  },
  {
    id: "noto-sans-rejang",
    outline: [[0xa930, 0xa95f]],
    load: async () => (await import("./noto-sans-rejang")).default,
  },
  {
    id: "noto-sans-tagalog",
    outline: [[0x1700, 0x1736]],
    load: async () => (await import("./noto-sans-tagalog")).default,
  },
  {
    id: "noto-sans-hanunoo",
    outline: [[0x1720, 0x1736]],
    load: async () => (await import("./noto-sans-hanunoo")).default,
  },
  {
    id: "noto-sans-buhid",
    outline: [[0x1735, 0x1753]],
    load: async () => (await import("./noto-sans-buhid")).default,
  },
  {
    id: "noto-sans-tagbanwa",
    outline: [[0x1735, 0x1773]],
    load: async () => (await import("./noto-sans-tagbanwa")).default,
  },
  {
    id: "noto-sans-samaritan",
    outline: [[0x800, 0x83e], [0x2e31, 0x2e31]],
    load: async () => (await import("./noto-sans-samaritan")).default,
  },
  {
    id: "noto-sans-mandaic",
    outline: [[0x640, 0x640], [0x840, 0x85e]],
    load: async () => (await import("./noto-sans-mandaic")).default,
  },
  {
    id: "noto-sans-hanifi-rohingya",
    outline: [[0x60c, 0x6d4], [0x10d00, 0x10d39]],
    load: async () => (await import("./noto-sans-hanifi-rohingya")).default,
  },
  {
    id: "noto-sans-wancho",
    outline: [[0x1e2c0, 0x1e2ff]],
    load: async () => (await import("./noto-sans-wancho")).default,
  },
  {
    id: "noto-sans-nag-mundari",
    outline: [[0x1e4d0, 0x1e4f9]],
    load: async () => (await import("./noto-sans-nag-mundari")).default,
  },
  {
    id: "noto-sans-tangsa",
    outline: [[0x16a70, 0x16ac9]],
    load: async () => (await import("./noto-sans-tangsa")).default,
  },
  {
    id: "noto-sans-sunuwar",
    outline: [[0x11bc0, 0x11bf9]],
    load: async () => (await import("./noto-sans-sunuwar")).default,
  },
  {
    id: "noto-sans-kawi",
    outline: [[0x11f00, 0x11f59]],
    load: async () => (await import("./noto-sans-kawi")).default,
  },
  {
    id: "noto-sans-medefaidrin",
    outline: [[0x16e40, 0x16e9a]],
    load: async () => (await import("./noto-sans-medefaidrin")).default,
  },
  {
    id: "noto-sans-mende-kikakui",
    outline: [[0x1e800, 0x1e8d6]],
    load: async () => (await import("./noto-sans-mende-kikakui")).default,
  },
  {
    id: "noto-sans-miao",
    outline: [[0x16f00, 0x16f9f]],
    load: async () => (await import("./noto-sans-miao")).default,
  },
  {
    id: "noto-sans-mro",
    outline: [[0x16a40, 0x16a6f]],
    load: async () => (await import("./noto-sans-mro")).default,
  },
  {
    id: "noto-sans-pahawh-hmong",
    outline: [[0x16b00, 0x16b8f]],
    load: async () => (await import("./noto-sans-pahawh-hmong")).default,
  },
  {
    id: "noto-serif-np-hmong",
    outline: [[0x1e100, 0x1e14f]],
    load: async () => (await import("./noto-serif-np-hmong")).default,
  },
  {
    id: "noto-sans-pau-cin-hau",
    outline: [[0x11ac0, 0x11af8]],
    load: async () => (await import("./noto-sans-pau-cin-hau")).default,
  },
  {
    id: "noto-sans-bassa-vah",
    outline: [[0x16ad0, 0x16af5]],
    load: async () => (await import("./noto-sans-bassa-vah")).default,
  },
  {
    id: "noto-sans-masaram-gondi",
    outline: [[0x964, 0x965], [0x11d00, 0x11d59]],
    load: async () => (await import("./noto-sans-masaram-gondi")).default,
  },
  {
    id: "noto-sans-gunjala-gondi",
    outline: [[0x11d60, 0x11da9]],
    load: async () => (await import("./noto-sans-gunjala-gondi")).default,
  },
  {
    id: "noto-sans-warang-citi",
    outline: [[0x118a0, 0x118ff]],
    load: async () => (await import("./noto-sans-warang-citi")).default,
  },
  {
    id: "noto-sans-sora-sompeng",
    outline: [[0x110d0, 0x110f9]],
    load: async () => (await import("./noto-sans-sora-sompeng")).default,
  },
  {
    id: "noto-serif-toto",
    outline: [[0x1e290, 0x1e2ae]],
    load: async () => (await import("./noto-serif-toto")).default,
  },
  {
    id: "noto-serif-yezidi",
    outline: [[0x60c, 0x6d4], [0x10e80, 0x10eb1]],
    load: async () => (await import("./noto-serif-yezidi")).default,
  },
  {
    id: "noto-sans-vithkuqi",
    outline: [[0x10570, 0x105bc]],
    load: async () => (await import("./noto-sans-vithkuqi")).default,
  },
  {
    id: "noto-serif-ottoman-siyaq",
    outline: [[0x1ed01, 0x1ed3d]],
    load: async () => (await import("./noto-serif-ottoman-siyaq")).default,
  },
  {
    id: "noto-sans-indic-siyaq-numbers",
    outline: [[0x627, 0x6f9], [0x1ec71, 0x1ecb4]],
    load: async () => (await import("./noto-sans-indic-siyaq-numbers")).default,
  },
  {
    id: "noto-sans-tamil-supplement",
    outline: [[0x11fc0, 0x11fff]],
    load: async () => (await import("./noto-sans-tamil-supplement")).default,
  },
  {
    id: "noto-sans-newa",
    outline: [[0x1dfb, 0x1dfb], [0x11400, 0x11461]],
    load: async () => (await import("./noto-sans-newa")).default,
  },
  {
    id: "noto-sans-tirhuta",
    outline: [[0x951, 0x9f7], [0x1cf2, 0x1cf2], [0xa830, 0xa839], [0x11480, 0x114d9]],
    load: async () => (await import("./noto-sans-tirhuta")).default,
  },
  {
    id: "noto-sans-sharada",
    outline: [[0x951, 0x951], [0x1cd7, 0x1ce0], [0x11180, 0x111df]],
    load: async () => (await import("./noto-sans-sharada")).default,
  },
  {
    id: "noto-sans-siddham",
    outline: [[0x11580, 0x115dd]],
    load: async () => (await import("./noto-sans-siddham")).default,
  },
  {
    id: "noto-sans-modi",
    outline: [[0xa830, 0xa839], [0x11600, 0x11659]],
    load: async () => (await import("./noto-sans-modi")).default,
  },
  {
    id: "noto-sans-takri",
    outline: [[0x964, 0x965], [0xa830, 0xa839], [0x11680, 0x116c9]],
    load: async () => (await import("./noto-sans-takri")).default,
  },
  {
    id: "noto-sans-khojki",
    outline: [[0xae6, 0xaef], [0xa830, 0xa839], [0x11200, 0x11240]],
    load: async () => (await import("./noto-sans-khojki")).default,
  },
  {
    id: "noto-sans-khudawadi",
    outline: [[0x964, 0x965], [0xa830, 0xa839], [0x112b0, 0x112f9]],
    load: async () => (await import("./noto-sans-khudawadi")).default,
  },
  {
    id: "noto-sans-mahajani",
    outline: [[0x964, 0x96f], [0xa830, 0xa839], [0x11150, 0x11176]],
    load: async () => (await import("./noto-sans-mahajani")).default,
  },
  {
    id: "noto-sans-multani",
    outline: [[0x964, 0x965], [0xa66, 0xa6f], [0x11280, 0x112a9]],
    load: async () => (await import("./noto-sans-multani")).default,
  },
  {
    id: "noto-sans-marchen",
    outline: [[0x11c70, 0x11cb6]],
    load: async () => (await import("./noto-sans-marchen")).default,
  },
  {
    id: "noto-sans-bhaiksuki",
    outline: [[0x11c00, 0x11c6c]],
    load: async () => (await import("./noto-sans-bhaiksuki")).default,
  },
  {
    id: "noto-sans-zanabazar-square",
    outline: [[0x11a00, 0x11a47]],
    load: async () => (await import("./noto-sans-zanabazar-square")).default,
  },
  {
    id: "noto-sans-soyombo",
    outline: [[0x11a50, 0x11aa2]],
    load: async () => (await import("./noto-sans-soyombo")).default,
  },
  {
    id: "noto-sans-nandinagari",
    outline: [[0x964, 0x965], [0xce6, 0xcef], [0x1ce9, 0x1cfa], [0xa830, 0xa835], [0x119a0, 0x119e4]],
    load: async () => (await import("./noto-sans-nandinagari")).default,
  },
  {
    id: "noto-sans-grantha",
    outline: [[0x951, 0x965], [0xbaa, 0xbf2], [0x1cd0, 0x1cf9], [0x20f0, 0x20f0], [0x11300, 0x11374]],
    load: async () => (await import("./noto-sans-grantha")).default,
  },
  {
    id: "noto-sans-kaithi",
    outline: [[0x966, 0x96f], [0xa830, 0xa839], [0x11080, 0x110cd]],
    load: async () => (await import("./noto-sans-kaithi")).default,
  },
  {
    id: "noto-sans-brahmi",
    outline: [[0x11000, 0x1107f]],
    load: async () => (await import("./noto-sans-brahmi")).default,
  },
  {
    id: "noto-sans-kharoshthi",
    outline: [[0x10a00, 0x10a58]],
    load: async () => (await import("./noto-sans-kharoshthi")).default,
  },
  {
    id: "noto-serif-ahom",
    outline: [[0x11700, 0x11746]],
    load: async () => (await import("./noto-serif-ahom")).default,
  },
  {
    id: "noto-serif-dives-akuru",
    outline: [[0x11900, 0x11946]],
    load: async () => (await import("./noto-serif-dives-akuru")).default,
  },
  {
    id: "noto-serif-dogra",
    outline: [[0x964, 0x965], [0x11800, 0x1183b]],
    load: async () => (await import("./noto-serif-dogra")).default,
  },
  {
    id: "noto-serif-makasar",
    outline: [[0x11ee0, 0x11ef8]],
    load: async () => (await import("./noto-serif-makasar")).default,
  },
  {
    id: "noto-serif-todhri",
    outline: [[0x105c0, 0x105f3]],
    load: async () => (await import("./noto-serif-todhri")).default,
  },
  {
    id: "noto-sans-phags-pa",
    outline: [[0x1801, 0x1805], [0x3001, 0x301b], [0xa840, 0xa877], [0xfe00, 0xfe00]],
    load: async () => (await import("./noto-sans-phags-pa")).default,
  },
  {
    id: "noto-sans-coptic",
    outline: [[0x1dcd, 0x1dcd], [0x2c80, 0x2cff], [0x2e17, 0x2e34], [0xfe24, 0xfe26], [0x102e0, 0x102fb]],
    load: async () => (await import("./noto-sans-coptic")).default,
  },
  {
    id: "noto-sans-glagolitic",
    outline: [[0x2c00, 0x2c5e], [0xa66f, 0xa66f], [0xfe2e, 0xfe2f], [0x1e000, 0x1e02a]],
    load: async () => (await import("./noto-sans-glagolitic")).default,
  },
  {
    id: "noto-sans-gothic",
    outline: [[0x10330, 0x1034a]],
    load: async () => (await import("./noto-sans-gothic")).default,
  },
  {
    id: "noto-sans-runic",
    outline: [[0x16a0, 0x16f8]],
    load: async () => (await import("./noto-sans-runic")).default,
  },
  {
    id: "noto-sans-ogham",
    outline: [[0x1680, 0x169c]],
    load: async () => (await import("./noto-sans-ogham")).default,
  },
  {
    id: "noto-sans-deseret",
    outline: [[0x10400, 0x1044f]],
    load: async () => (await import("./noto-sans-deseret")).default,
  },
  {
    id: "noto-sans-shavian",
    outline: [[0x10450, 0x1047f]],
    load: async () => (await import("./noto-sans-shavian")).default,
  },
  {
    id: "noto-sans-duployan",
    outline: [[0x2e3c, 0x2e3c], [0x1bc00, 0x1bca3]],
    load: async () => (await import("./noto-sans-duployan")).default,
  },
  {
    id: "noto-sans-elbasan",
    outline: [[0x10500, 0x10527]],
    load: async () => (await import("./noto-sans-elbasan")).default,
  },
  {
    id: "noto-sans-caucasian-albanian",
    outline: [[0xfe24, 0xfe2d], [0x10530, 0x1056f]],
    load: async () => (await import("./noto-sans-caucasian-albanian")).default,
  },
  {
    id: "noto-sans-old-italic",
    outline: [[0x10300, 0x1032f]],
    load: async () => (await import("./noto-sans-old-italic")).default,
  },
  {
    id: "noto-sans-old-hungarian",
    outline: [[0x10c80, 0x10cff]],
    load: async () => (await import("./noto-sans-old-hungarian")).default,
  },
  {
    id: "noto-sans-old-turkic",
    outline: [[0x10c00, 0x10c48]],
    load: async () => (await import("./noto-sans-old-turkic")).default,
  },
  {
    id: "noto-sans-old-persian",
    outline: [[0x103a0, 0x103d5]],
    load: async () => (await import("./noto-sans-old-persian")).default,
  },
  {
    id: "noto-sans-old-permic",
    outline: [[0x20db, 0x20db], [0x10350, 0x1037a]],
    load: async () => (await import("./noto-sans-old-permic")).default,
  },
  {
    id: "noto-sans-old-north-arabian",
    outline: [[0x10a80, 0x10a9f]],
    load: async () => (await import("./noto-sans-old-north-arabian")).default,
  },
  {
    id: "noto-sans-old-south-arabian",
    outline: [[0x10a60, 0x10a7f]],
    load: async () => (await import("./noto-sans-old-south-arabian")).default,
  },
  {
    id: "noto-sans-old-sogdian",
    outline: [[0x10f00, 0x10f27]],
    load: async () => (await import("./noto-sans-old-sogdian")).default,
  },
  {
    id: "noto-sans-sogdian",
    outline: [[0x640, 0x640], [0x10f30, 0x10f59]],
    load: async () => (await import("./noto-sans-sogdian")).default,
  },
  {
    id: "noto-serif-old-uyghur",
    outline: [[0x640, 0x640], [0x10af2, 0x10af2], [0x10f70, 0x10f89]],
    load: async () => (await import("./noto-serif-old-uyghur")).default,
  },
  {
    id: "noto-sans-ugaritic",
    outline: [[0x10380, 0x1039f]],
    load: async () => (await import("./noto-sans-ugaritic")).default,
  },
  {
    id: "noto-sans-cuneiform",
    outline: [[0x12000, 0x12543]],
    load: async () => (await import("./noto-sans-cuneiform")).default,
  },
  {
    id: "noto-sans-egyptian-hieroglyphs",
    outline: [[0x13000, 0x13446]],
    load: async () => (await import("./noto-sans-egyptian-hieroglyphs")).default,
  },
  {
    id: "noto-sans-anatolian-hieroglyphs",
    outline: [[0x14400, 0x14646]],
    load: async () => (await import("./noto-sans-anatolian-hieroglyphs")).default,
  },
  {
    id: "noto-sans-linear-a",
    outline: [[0x10107, 0x10133], [0x10600, 0x10767]],
    load: async () => (await import("./noto-sans-linear-a")).default,
  },
  {
    id: "noto-sans-linear-b",
    outline: [[0x10000, 0x1013f]],
    load: async () => (await import("./noto-sans-linear-b")).default,
  },
  {
    id: "noto-sans-cypriot",
    outline: [[0x10100, 0x10133], [0x10800, 0x1083f]],
    load: async () => (await import("./noto-sans-cypriot")).default,
  },
  {
    id: "noto-sans-cypro-minoan",
    outline: [[0x12f90, 0x12ff2]],
    load: async () => (await import("./noto-sans-cypro-minoan")).default,
  },
  {
    id: "noto-sans-phoenician",
    outline: [[0x10900, 0x1091f]],
    load: async () => (await import("./noto-sans-phoenician")).default,
  },
  {
    id: "noto-sans-imperial-aramaic",
    outline: [[0x10840, 0x1085f]],
    load: async () => (await import("./noto-sans-imperial-aramaic")).default,
  },
  {
    id: "noto-sans-avestan",
    outline: [[0x2e30, 0x2e31], [0x10b00, 0x10b3f]],
    load: async () => (await import("./noto-sans-avestan")).default,
  },
  {
    id: "noto-sans-chorasmian",
    outline: [[0x10fb0, 0x10fcb]],
    load: async () => (await import("./noto-sans-chorasmian")).default,
  },
  {
    id: "noto-sans-elymaic",
    outline: [[0x10fe0, 0x10ff6]],
    load: async () => (await import("./noto-sans-elymaic")).default,
  },
  {
    id: "noto-sans-hatran",
    outline: [[0x108e0, 0x108ff]],
    load: async () => (await import("./noto-sans-hatran")).default,
  },
  {
    id: "noto-sans-nabataean",
    outline: [[0x10880, 0x108af]],
    load: async () => (await import("./noto-sans-nabataean")).default,
  },
  {
    id: "noto-sans-palmyrene",
    outline: [[0x10860, 0x1087f]],
    load: async () => (await import("./noto-sans-palmyrene")).default,
  },
  {
    id: "noto-sans-manichaean",
    outline: [[0x640, 0x640], [0xfe00, 0xfe00], [0x10ac0, 0x10af6]],
    load: async () => (await import("./noto-sans-manichaean")).default,
  },
  {
    id: "noto-sans-psalter-pahlavi",
    outline: [[0x640, 0x640], [0x10b80, 0x10baf]],
    load: async () => (await import("./noto-sans-psalter-pahlavi")).default,
  },
  {
    id: "noto-sans-inscriptional-pahlavi",
    outline: [[0x10b60, 0x10b7f]],
    load: async () => (await import("./noto-sans-inscriptional-pahlavi")).default,
  },
  {
    id: "noto-sans-inscriptional-parthian",
    outline: [[0x10b40, 0x10b5f]],
    load: async () => (await import("./noto-sans-inscriptional-parthian")).default,
  },
  {
    id: "noto-sans-meroitic",
    outline: [[0x10980, 0x109ff]],
    load: async () => (await import("./noto-sans-meroitic")).default,
  },
  {
    id: "noto-sans-carian",
    outline: [[0x102a0, 0x102d0]],
    load: async () => (await import("./noto-sans-carian")).default,
  },
  {
    id: "noto-sans-lycian",
    outline: [[0x10280, 0x1029c]],
    load: async () => (await import("./noto-sans-lycian")).default,
  },
  {
    id: "noto-sans-lydian",
    outline: [[0x10920, 0x1093f]],
    load: async () => (await import("./noto-sans-lydian")).default,
  },
  {
    id: "noto-sans-osmanya",
    outline: [[0x10480, 0x104a9]],
    load: async () => (await import("./noto-sans-osmanya")).default,
  },
  {
    id: "noto-sans-signwriting",
    outline: [[0x1d800, 0x1daaf]],
    load: async () => (await import("./noto-sans-signwriting")).default,
  },
  {
    id: "noto-sans-mayan-numerals",
    outline: [[0x1d2e0, 0x1d2f3]],
    load: async () => (await import("./noto-sans-mayan-numerals")).default,
  },
  {
    id: "noto-sans-nushu",
    outline: [[0x16fe1, 0x16fe1], [0x1b170, 0x1b2fb]],
    load: async () => (await import("./noto-sans-nushu")).default,
  },
  {
    id: "noto-serif-tangut",
    outline: [[0x16fe0, 0x18aff], [0x18d00, 0x18d08]],
    load: async () => (await import("./noto-serif-tangut")).default,
  },
  {
    id: "noto-serif-khitan-small-script",
    outline: [[0x16fe4, 0x16fe4], [0x18b00, 0x18cd5]],
    load: async () => (await import("./noto-serif-khitan-small-script")).default,
  },
  {
    id: "noto-sans-symbols",
    outline: [[0x20dd, 0x218b], [0x2300, 0x24ff], [0x269d, 0x26ff], [0x2921, 0x2922], [0x1f100, 0x1f1ac], [0x1f546, 0x1f773]],
    load: async () => (await import("./noto-sans-symbols")).default,
  },
  {
    id: "noto-sans-symbols-2",
    outline: [[0x20e2, 0x20e3], [0x2316, 0x244a], [0x26bd, 0x29eb], [0x2b00, 0x2bff], [0x4dc0, 0x4dff], [0xfff9, 0xfffb], [0x10140, 0x102fb], [0x10e60, 0x10e7e], [0x1d2c0, 0x1d378], [0x1f000, 0x1f1ad], [0x1f30d, 0x1fbf9]],
    load: async () => (await import("./noto-sans-symbols-2")).default,
  },
  {
    id: "noto-sans-math",
    outline: [[0x606, 0x6f9], [0x1d46, 0x1d46], [0x20d0, 0x214a], [0x2300, 0x2593], [0x27c0, 0x27ff], [0x2900, 0x2bfe], [0x3012, 0x3030], [0xfe00, 0xfe00], [0xff5b, 0xff5d], [0x1d400, 0x1d7ff], [0x1ee00, 0x1eef1], [0x1f780, 0x1f7d8]],
    load: async () => (await import("./noto-sans-math")).default,
  },
  {
    id: "noto-music",
    outline: [[0x1d000, 0x1d245]],
    load: async () => (await import("./noto-music")).default,
  },
  {
    id: "noto-znamenny-musical-notation",
    outline: [[0x1cf00, 0x1cfc3]],
    load: async () => (await import("./noto-znamenny-musical-notation")).default,
  },
  {
    id: "noto-sans-sc",
    outline: [[0x2ea, 0x2eb], [0x20dd, 0x20dd], [0x2307, 0x2318], [0x2460, 0x2595], [0x26bd, 0x26be], [0x2934, 0x2935], [0x2b05, 0x2b07], [0x2ebb, 0x36ab], [0x38a8, 0x38a8], [0x3dab, 0x3e1a], [0x3f1b, 0x3f6d], [0x4495, 0x4495], [0x4723, 0x4723], [0x48fa, 0x48fa], [0x4ca3, 0x4ca3], [0x4e00, 0x9fa2], [0xf901, 0xfb02], [0xfe30, 0xffed], [0x1f170, 0x1f251]],
    load: async () => (await import("./noto-sans-sc")).default,
  },
  {
    id: "noto-sans-tc",
    outline: [[0x2ea, 0x2eb], [0x20dd, 0x20dd], [0x2312, 0x2318], [0x2460, 0x2597], [0x26bd, 0x26be], [0x2934, 0x29bf], [0x2b05, 0x2b07], [0x2f00, 0x3440], [0x3551, 0x373a], [0x3863, 0x3863], [0x39b8, 0x3bd7], [0x3ddb, 0x3f0e], [0x4102, 0x4181], [0x4552, 0x4552], [0x4837, 0x4837], [0x4d09, 0x9fa4], [0xf901, 0xfb01], [0xfe30, 0xffed], [0x1f141, 0x1f251], [0x20487, 0x20487], [0x20779, 0x20779], [0x20c41, 0x20d71], [0x20e98, 0x20ef9], [0x2107b, 0x210c1], [0x22c51, 0x22c51], [0x233b4, 0x233b4], [0x24a12, 0x24a12], [0x2512b, 0x2512b], [0x2546e, 0x2546e], [0x25683, 0x25683], [0x267cc, 0x267cc], [0x269f2, 0x269f2], [0x27657, 0x27657], [0x282e2, 0x282e2], [0x29d5a, 0x29d5a]],
    load: async () => (await import("./noto-sans-tc")).default,
  },
  {
    id: "noto-sans-jp",
    outline: [[0x2ea, 0x2eb], [0x20dd, 0x210a], [0x2305, 0x259f], [0x26bd, 0x26be], [0x2934, 0x29fb], [0x2b05, 0x2b95], [0x2e3a, 0x9fcc], [0xf900, 0xfb04], [0xfe10, 0xffee], [0x1f100, 0x1f251], [0x2000b, 0x20213], [0x2032b, 0x20bb7], [0x20d45, 0x20f5f], [0x21201, 0x2146e], [0x215d7, 0x21742], [0x218bd, 0x218bd], [0x219c3, 0x21a1a], [0x21c56, 0x21ffa], [0x2217b, 0x22218], [0x2231e, 0x223ad], [0x22609, 0x226f3], [0x2285b, 0x2298f], [0x22ab8, 0x22c24], [0x22de1, 0x22e42], [0x22feb, 0x22feb], [0x231b6, 0x231f5], [0x23372, 0x2383d], [0x23a98, 0x23a98], [0x23c7f, 0x23dfa], [0x23f7e, 0x243d0], [0x24629, 0x246a5], [0x247f1, 0x248e9], [0x24a4d, 0x24a4d], [0x24b56, 0x24e8b], [0x24ff2, 0x2524c], [0x2542e, 0x25874], [0x259c4, 0x259d4], [0x25ad7, 0x25c64], [0x25da1, 0x260ed], [0x26222, 0x26402], [0x2667e, 0x2671d], [0x268dd, 0x26aff], [0x26c29, 0x26cdd], [0x26e40, 0x26e65], [0x26f94, 0x27139], [0x273da, 0x27449], [0x27614, 0x27752], [0x278b2, 0x27a84], [0x27bb3, 0x27eaf], [0x27fb7, 0x280bb], [0x28277, 0x285c9], [0x286d7, 0x286fa], [0x28946, 0x28ff8], [0x292a0, 0x292b1], [0x29490, 0x29490], [0x295cf, 0x298c6], [0x29a72, 0x29a72], [0x29d4b, 0x2a190], [0x2a2b2, 0x2a437], [0x2a5f1, 0x2a6b2], [0x2a9e6, 0x2a9e6], [0x2b746, 0x2b81a], [0x2d544, 0x2d544], [0x2e278, 0x2e278], [0x2e569, 0x2e569], [0x2e6ea, 0x2e6ea], [0x2f804, 0x2f9f4]],
    load: async () => (await import("./noto-sans-jp")).default,
  },
  {
    id: "noto-sans-kr",
    outline: [[0x2ea, 0x2eb], [0x2306, 0x2312], [0x2460, 0x2592], [0x2f00, 0x33dd], [0x4e00, 0x9f9c], [0xac00, 0xd7a3], [0xf900, 0xfa0b], [0xff01, 0xffe6]],
    load: async () => (await import("./noto-sans-kr")).default,
  },
  {
    id: "noto-serif-hentaigana",
    outline: [[0x3099, 0x309a], [0x1b000, 0x1b122]],
    load: async () => (await import("./noto-serif-hentaigana")).default,
  },
  {
    id: "noto-emoji",
    outline: [[0x20e3, 0x20e3], [0x231a, 0x24c2], [0x26bd, 0x27bf], [0x2934, 0x2935], [0x2b05, 0x2b55], [0x3030, 0x303d], [0x3297, 0x3299], [0xfe0e, 0xfe0f], [0x1f004, 0x1f7f0], [0x1f90c, 0x1fafa], [0xe0062, 0xe007f]],
    load: async () => (await import("./noto-emoji")).default,
  },
];
