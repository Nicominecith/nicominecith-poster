import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  renderPosterToPixels,
  type PosterRenderInput,
  type RenderedPoster,
} from "@freetsy/renderer";

const DRAFT_SCALE = 0.5;
const MIN_DRAFT_WIDTH_PX = 320;

const draftWidth = (width: number) =>
  Math.min(width, Math.max(MIN_DRAFT_WIDTH_PX, Math.round(width * DRAFT_SCALE)));

type RenderRequest = Omit<PosterRenderInput, "signal">;

function useCanvasPainter(canvas: RefObject<HTMLCanvasElement | null>) {
  const scratch = useRef<HTMLCanvasElement | null>(null);
  return useCallback(
    (rendered: RenderedPoster, width: number, height: number) => {
      const context = canvas.current?.getContext("2d");
      if (!context) return;
      const image = new ImageData(
        new Uint8ClampedArray(rendered.pixels),
        rendered.width,
        rendered.height,
      );
      if (rendered.width === width && rendered.height === height) {
        context.putImageData(image, 0, 0);
        return;
      }
      scratch.current ??= document.createElement("canvas");
      const buffer = scratch.current;
      buffer.width = rendered.width;
      buffer.height = rendered.height;
      buffer.getContext("2d")?.putImageData(image, 0, 0);
      context.drawImage(buffer, 0, 0, width, height);
    },
    [canvas],
  );
}

export function useProgressiveRender(
  canvas: RefObject<HTMLCanvasElement | null>,
  request: RenderRequest,
) {
  const [failure, setFailure] = useState<string | null>(null);
  const [painted, setPainted] = useState(false);
  const paint = useCanvasPainter(canvas);
  const latest = useRef(request);
  const running = useRef(false);
  const superseded = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const aborted = useCallback(() => lifetime.current?.signal.aborted ?? false, []);

  const renderOnce = useCallback(
    async (sharp: boolean) => {
      const input = latest.current;
      if (aborted()) return true;
      const width = sharp ? input.widthPx : draftWidth(input.widthPx);
      const height = Math.max(1, Math.round((width * input.heightPx) / input.widthPx));
      const signal = lifetime.current?.signal;
      await renderPosterToPixels({ ...input, widthPx: width, heightPx: height, signal }).match(
        (rendered) => {
          if (aborted()) return;
          paint(rendered, input.widthPx, input.heightPx);
          setFailure(null);
          setPainted(true);
        },
        (error) => {
          if (!aborted()) setFailure(error.message);
        },
      );
      return width >= input.widthPx;
    },
    [aborted, paint],
  );

  const pump = useCallback(async () => {
    if (running.current) {
      superseded.current = true;
      return;
    }
    running.current = true;
    try {
      let sharp = false;
      for (;;) {
        superseded.current = false;
        // eslint-disable-next-line no-await-in-loop
        const reachedFullSize = await renderOnce(sharp);
        if (aborted()) break;
        if (superseded.current) {
          sharp = false;
          continue;
        }
        if (reachedFullSize) break;
        sharp = true;
      }
    } finally {
      running.current = false;
      superseded.current = false;
    }
  }, [aborted, renderOnce]);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);

  useEffect(() => {
    latest.current = request;
    void pump();
  }, [pump, request]);

  return { failure, painted };
}
