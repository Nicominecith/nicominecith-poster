import { ResultAsync, err, ok, type Result } from "neverthrow";
import type { CodeVariant } from "./poster-code";
import { toError } from "@freetsy/utils";
import i18n from "@freetsy/i18n";

const SCANNABLES_ORIGIN = "https://scannables.scdn.co";

export const SPOTIFY_CODE_ASPECT_RATIO = 4;

const SOURCE_WIDTH = 640;

const RENDER_WIDTH = 1024;
const RENDER_HEIGHT = RENDER_WIDTH / SPOTIFY_CODE_ASPECT_RATIO;

function inkFor(variant: CodeVariant): "black" | "white" {
  return variant === "dark" ? "white" : "black";
}

function groundFor(variant: CodeVariant): string {
  return variant === "dark" ? "000000" : "ffffff";
}

function scannableUrl(spotifyUri: string, variant: CodeVariant): string {
  return `${SCANNABLES_ORIGIN}/uri/plain/svg/${groundFor(variant)}/${inkFor(variant)}/${SOURCE_WIDTH}/${spotifyUri}`;
}

function fetchScannableSvg(url: string): ResultAsync<string, Error> {
  return ResultAsync.fromPromise(
    fetch(url).then((response) => {
      if (!response.ok) throw new Error(i18n.t("errors.spotifyCodeUnreachable"));
      return response.text();
    }),
    (cause) => toError(cause, i18n.t("errors.spotifyCodeUnreachable")),
  );
}

function numericAttribute(element: Element, name: string): number {
  return Number(element.getAttribute(name));
}

function removeBackground(svg: Element): void {
  const [, , viewBoxWidth, viewBoxHeight] = (svg.getAttribute("viewBox") ?? "")
    .split(/[\s,]+/)
    .map(Number);
  if (!viewBoxWidth || !viewBoxHeight) return;

  for (const rect of Array.from(svg.querySelectorAll("rect"))) {
    if (
      numericAttribute(rect, "width") >= viewBoxWidth &&
      numericAttribute(rect, "height") >= viewBoxHeight
    ) {
      rect.remove();
    }
  }
}

function applyCustomInk(svg: Element, color?: string): void {
  if (!color) return;
  for (const element of Array.from(
    svg.querySelectorAll("path, rect, circle, ellipse, polygon, polyline, line"),
  )) {
    const fill = element.getAttribute("fill");
    if (fill !== "none" && fill !== "transparent") element.setAttribute("fill", color);
    const stroke = element.getAttribute("stroke");
    if (stroke && stroke !== "none" && stroke !== "transparent") {
      element.setAttribute("stroke", color);
    }
  }
}

function toTransparentSvgDataUri(svgText: string, color?: string): Result<string, Error> {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = parsed.documentElement;
  if (svg.tagName !== "svg" || parsed.querySelector("parsererror")) {
    return err(new Error(i18n.t("errors.spotifyCodeUnreadable")));
  }

  removeBackground(svg);
  applyCustomInk(svg, color);
  const markup = encodeURIComponent(new XMLSerializer().serializeToString(svg));
  return ok(`data:image/svg+xml;charset=utf-8,${markup}`);
}

function loadImage(source: string): ResultAsync<HTMLImageElement, Error> {
  return ResultAsync.fromPromise(
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error(i18n.t("errors.spotifyCodeUnreadable"))),
        { once: true },
      );
      image.src = source;
    }),
    (cause) => toError(cause, i18n.t("errors.spotifyCodeUnreadable")),
  );
}

function rasterizeToPng(image: HTMLImageElement): Result<string, Error> {
  const canvas = document.createElement("canvas");
  canvas.width = RENDER_WIDTH;
  canvas.height = RENDER_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return err(new Error(i18n.t("errors.canvasUnsupported")));

  context.drawImage(image, 0, 0, RENDER_WIDTH, RENDER_HEIGHT);
  const dataUri = canvas.toDataURL("image/png");
  return dataUri.startsWith("data:image/png")
    ? ok(dataUri)
    : err(new Error(i18n.t("errors.spotifyCodeCreate")));
}

export function spotifyCodeDataUri(
  spotifyUri: string,
  variant: CodeVariant,
  color?: string,
): ResultAsync<string, Error> {
  return fetchScannableSvg(scannableUrl(spotifyUri, variant))
    .andThen((svgText) => toTransparentSvgDataUri(svgText, color))
    .andThen((svgDataUri) => loadImage(svgDataUri))
    .andThen((image) => rasterizeToPng(image));
}
