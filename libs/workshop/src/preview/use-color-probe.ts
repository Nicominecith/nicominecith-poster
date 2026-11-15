import { useCallback, useEffect, useState, type PointerEvent, type RefObject } from "react";
import { clampNumber, pixelUnder, toHexColor } from "@freetsy/poster";
import { LOUPE_WIDTH_PX, type ColorProbe } from "./color-loupe";

const LOUPE_GAP_PX = 12;
const LOUPE_PANEL_HEIGHT_PX = 152;

export function useColorProbe({
  canvas,
  frame,
  enabled,
  onPick,
}: {
  canvas: RefObject<HTMLCanvasElement | null>;
  frame: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onPick?: (color: string) => void;
}) {
  const [probe, setProbe] = useState<ColorProbe | null>(null);

  useEffect(() => {
    if (!enabled) setProbe(null);
  }, [enabled]);

  const probeAt = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): ColorProbe | null => {
      const node = canvas.current;
      const box = frame.current;
      const context = node?.getContext("2d");
      if (!enabled || !node || !box || !context) return null;
      const rect = node.getBoundingClientRect();
      const x = pixelUnder(event.clientX - rect.left, rect.width, node.width);
      const y = pixelUnder(event.clientY - rect.top, rect.height, node.height);
      const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
      const outer = box.getBoundingClientRect();
      const pointerX = event.clientX - outer.left;
      const pointerY = event.clientY - outer.top;
      const above = pointerY - LOUPE_PANEL_HEIGHT_PX - LOUPE_GAP_PX;
      const next: ColorProbe = {
        x,
        y,
        hex: toHexColor(red, green, blue),
        left: clampNumber(
          pointerX - LOUPE_WIDTH_PX / 2,
          0,
          Math.max(0, outer.width - LOUPE_WIDTH_PX),
        ),
        top: above >= 0 ? above : pointerY + LOUPE_GAP_PX * 2,
      };
      setProbe(next);
      return next;
    },
    [canvas, frame, enabled],
  );

  const clear = useCallback(() => setProbe(null), []);

  return {
    probe,
    handlers: {
      onPointerDown: probeAt,
      onPointerMove: probeAt,
      onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
        const picked = probeAt(event);
        if (!picked) return;
        setProbe(null);
        if (onPick) onPick(picked.hex);
      },
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}
