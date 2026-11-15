import { useCallback, useEffect, useState } from "react";

type PipetteTarget = { key: string; apply: (color: string) => void };

export type ColorPipette = {
  activeKey: string | null;
  isActive: boolean;
  toggle: (key: string, apply: (color: string) => void) => void;
  pick: (color: string) => void;
  cancel: () => void;
};

export function useColorPipette(): ColorPipette {
  const [target, setTarget] = useState<PipetteTarget | null>(null);
  const cancel = useCallback(() => setTarget(null), []);
  const toggle = useCallback((key: string, apply: (color: string) => void) => {
    setTarget((current) => (current?.key === key ? null : { key, apply }));
  }, []);
  const pick = useCallback(
    (color: string) => {
      target?.apply(color);
      setTarget(null);
    },
    [target],
  );
  useEffect(() => {
    if (!target) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [target]);
  return { activeKey: target?.key ?? null, isActive: target !== null, toggle, pick, cancel };
}
