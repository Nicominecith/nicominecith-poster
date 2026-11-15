import type { EditableContent } from "./content";
import { listingTextInfo } from "./listing";
import type { PosterKind } from "./kind";
import { contentTextInfo, type AlbumTextInfo } from "./spec";

type PosterTextDisplay = {
  showSubtitle: boolean;
  showListDetails: boolean;
  showTextSource: boolean;
  textSourceLabel: string;
};

const SHOW_ALL: PosterTextDisplay = {
  showSubtitle: true,
  showListDetails: true,
  showTextSource: true,
  textSourceLabel: "Text",
};

function textSourceCredits(
  content: EditableContent,
  display: PosterTextDisplay,
): Array<{ label: string; value: string }> {
  const value = content.textSource.trim();
  return content.format === "freeform" && display.showTextSource && value
    ? [{ label: display.textSourceLabel, value }]
    : [];
}

export function posterTextInfo(
  content: EditableContent,
  kind: PosterKind,
  display: PosterTextDisplay = SHOW_ALL,
): AlbumTextInfo {
  const info =
    kind === "music"
      ? contentTextInfo(content)
      : listingTextInfo(content, kind, display.showListDetails);
  return {
    ...info,
    artist: display.showSubtitle ? info.artist : "",
    extraCredits: [
      ...content.credits
        .filter((credit) => credit.value.trim())
        .map((credit) => ({ label: credit.label.trim(), value: credit.value.trim() })),
      ...(kind === "music" ? [] : textSourceCredits(content, display)),
    ],
  };
}
