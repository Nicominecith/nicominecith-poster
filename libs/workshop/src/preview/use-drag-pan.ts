import { useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

type Held = { pointer: number; x: number; y: number };

export function useDragPan({
  viewport,
  zoom,
  enabled,
}: {
  viewport: RefObject<HTMLDivElement | null>;
  zoom: number;
  enabled: boolean;
}) {
  const held = useRef<Held | null>(null);
  const [dragging, setDragging] = useState(false);
  const previousZoom = useRef(zoom);

  useLayoutEffect(() => {
    const node = viewport.current;
    const ratio = zoom / previousZoom.current;
    previousZoom.current = zoom;
    if (!node || ratio === 1) return;
    node.scrollLeft = (node.scrollLeft + node.clientWidth / 2) * ratio - node.clientWidth / 2;
    node.scrollTop = (node.scrollTop + node.clientHeight / 2) * ratio - node.clientHeight / 2;
  }, [viewport, zoom]);

  function end(event: PointerEvent<HTMLDivElement>) {
    if (held.current?.pointer !== event.pointerId) return;
    held.current = null;
    viewport.current?.releasePointerCapture(event.pointerId);
    setDragging(false);
  }

  return {
    dragging,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (!enabled || event.pointerType === "touch" || event.button !== 0) return;
        held.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
        viewport.current?.setPointerCapture(event.pointerId);
        setDragging(true);
      },
      onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const current = held.current;
        const node = viewport.current;
        if (!current || !node || current.pointer !== event.pointerId) return;
        node.scrollLeft -= event.clientX - current.x;
        node.scrollTop -= event.clientY - current.y;
        current.x = event.clientX;
        current.y = event.clientY;
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
