import type { ResultAsync } from "neverthrow";
import { qrCodeColor, qrCodeDataUri } from "./qr-code";
import { SPOTIFY_CODE_ASPECT_RATIO, spotifyCodeDataUri } from "./spotify-code";

export type PosterCode =
  { kind: "qr"; targetUrl: string } | { kind: "spotify"; spotifyUri: string };

export type PosterCodeKind = PosterCode["kind"];

export type CodeVariant = "light" | "dark";
type CodeInk = CodeVariant | string;

export function posterCodeDataUri(code: PosterCode, ink: CodeInk): ResultAsync<string, Error> {
  const customColor = ink === "light" || ink === "dark" ? undefined : ink;
  const variant = ink === "dark" ? "dark" : "light";
  return code.kind === "qr"
    ? qrCodeDataUri(code.targetUrl, customColor ?? qrCodeColor(variant))
    : spotifyCodeDataUri(code.spotifyUri, variant, customColor);
}

export function posterCodeAspectRatio(kind: PosterCodeKind): number {
  return kind === "qr" ? 1 : SPOTIFY_CODE_ASPECT_RATIO;
}
