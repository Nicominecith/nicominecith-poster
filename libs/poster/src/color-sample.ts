import { clampNumber } from "./design";

export const LOUPE_PIXELS = 15;

function byte(value: number): number {
  return clampNumber(Math.round(value), 0, 255);
}

export function toHexColor(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((channel) => byte(channel).toString(16).padStart(2, "0")).join("")}`;
}

export function pixelUnder(offset: number, boxSize: number, pixels: number): number {
  if (!(boxSize > 0) || !(pixels > 0)) return 0;
  return clampNumber(Math.floor((offset / boxSize) * pixels), 0, pixels - 1);
}
