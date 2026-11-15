import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const mergeClasses = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "2xs",
        "poster-title",
        "poster-artist",
        "poster-track",
        "poster-credit-label",
        "poster-credit-value",
        "poster-brand",
        "poster-palette-index",
      ],
      spacing: ["xs", "s", "m", "l", "lg", "xl", (value: string) => value.startsWith("poster-")],
    },
    classGroups: { "border-w": [{ border: ["poster-frame"] }] },
  },
});

export function cn(...inputs: ClassValue[]) {
  return mergeClasses(clsx(inputs));
}
