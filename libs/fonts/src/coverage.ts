export const POSTER_FONT_COMMON_COVERAGE: ReadonlyArray<readonly [number, number]> = [
  [0x0020, 0x007e],
  [0x00a0, 0x00a3],
  [0x00a5, 0x00ac],
  [0x00ae, 0x00b4],
  [0x00b6, 0x00bb],
  [0x00bf, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x2013, 0x2014],
  [0x2018, 0x201a],
  [0x201c, 0x201e],
  [0x2022, 0x2022],
  [0x2026, 0x2026],
  [0x2039, 0x203a],
  [0x2044, 0x2044],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2212, 0x2212],
];

function isCovered(char: string): boolean {
  if (/\s/u.test(char)) return true;
  const code = char.codePointAt(0) ?? 0;
  return POSTER_FONT_COMMON_COVERAGE.some(([start, end]) => code >= start && code <= end);
}

export function needsFallbackFaces(texts: readonly string[]): boolean {
  return texts.some((text) => [...`${text}${text.toUpperCase()}`].some((char) => !isCovered(char)));
}
