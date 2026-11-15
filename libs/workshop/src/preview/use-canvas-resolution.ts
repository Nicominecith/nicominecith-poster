import { useLayoutEffect, useRef, useState, type RefObject } from "react";

const INITIAL_WIDTH_PX = 600;
const MAX_WIDTH_PX = 900;
const MAX_ZOOMED_WIDTH_PX = 1600;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

export function useCanvasResolution(canvas: RefObject<HTMLCanvasElement | null>, zoomed: boolean) {
  const [widthPx, setWidthPx] = useState(INITIAL_WIDTH_PX);
  const ceiling = useRef(MAX_WIDTH_PX);
  ceiling.current = zoomed ? MAX_ZOOMED_WIDTH_PX : MAX_WIDTH_PX;

  useLayoutEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const update = (cssWidth: number) => {
      if (cssWidth <= 0) return;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const next = Math.min(ceiling.current, Math.max(1, Math.round(cssWidth * ratio)));
      setWidthPx((current) => (current === next ? current : next));
    };
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(node);
    update(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [canvas]);

  return widthPx;
}
