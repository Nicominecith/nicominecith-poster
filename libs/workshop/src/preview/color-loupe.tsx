import { useEffect, useRef, type RefObject } from "react";
import { clampNumber, LOUPE_PIXELS } from "@freetsy/poster";
import { cn } from "@freetsy/ui/lib/utils";

export const LOUPE_WIDTH_PX = 128;

const MARKER_INNER = { width: 2, color: "#ffffff", inset: 0 };
const MARKER_OUTER = { width: 1, color: "#000000", inset: 1.5 };

export type ColorProbe = { x: number; y: number; hex: string; left: number; top: number };

export function ColorLoupe({
  probe,
  source,
}: {
  probe: ColorProbe;
  source: RefObject<HTMLCanvasElement | null>;
}) {
  const loupe = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = loupe.current;
    const poster = source.current;
    const context = node?.getContext("2d");
    if (!node || !poster || !context) return;
    const span = Math.min(LOUPE_PIXELS, poster.width, poster.height);
    const cell = node.width / span;
    const originX = clampNumber(probe.x - (span - 1) / 2, 0, poster.width - span);
    const originY = clampNumber(probe.y - (span - 1) / 2, 0, poster.height - span);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, node.width, node.height);
    context.drawImage(poster, originX, originY, span, span, 0, 0, node.width, node.height);
    const markerX = (probe.x - originX) * cell;
    const markerY = (probe.y - originY) * cell;
    for (const marker of [MARKER_INNER, MARKER_OUTER]) {
      context.lineWidth = marker.width;
      context.strokeStyle = marker.color;
      context.strokeRect(
        markerX - marker.inset,
        markerY - marker.inset,
        cell + marker.inset * 2,
        cell + marker.inset * 2,
      );
    }
  }, [probe, source]);

  return (
    <div
      aria-hidden
      data-slot="color-loupe"
      className={cn(
        "pointer-events-none absolute z-10 flex flex-col border border-primary bg-surface-raised",
      )}
      style={{ left: probe.left, top: probe.top, width: LOUPE_WIDTH_PX }}
    >
      <canvas
        ref={loupe}
        width={LOUPE_WIDTH_PX}
        height={LOUPE_WIDTH_PX}
        className={cn("block w-full")}
      />
      <span
        className={cn(
          "border-t border-tertiary py-xs text-center font-mono-ui text-2xs text-primary",
        )}
      >
        {probe.hex.toUpperCase()}
      </span>
    </div>
  );
}
