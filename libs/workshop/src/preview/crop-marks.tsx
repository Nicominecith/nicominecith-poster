import { cn } from "@freetsy/ui/lib/utils";

export function CropMarks({ color = "var(--primary)" }: { color?: string }) {
  const corners = [
    { top: 0, left: 0 },
    { top: 0, right: 0 },
    { bottom: 0, left: 0 },
    { bottom: 0, right: 0 },
  ] as const;

  return (
    <>
      {corners.map((corner, i) => {
        const isTop = "top" in corner;
        const isLeft = "left" in corner;
        return (
          <div
            key={i}
            aria-hidden
            className={cn("pointer-events-none absolute size-m")}
            style={{
              ...corner,
              borderTop: isTop ? `var(--stroke-registration) solid ${color}` : undefined,
              borderBottom: !isTop ? `var(--stroke-registration) solid ${color}` : undefined,
              borderLeft: isLeft ? `var(--stroke-registration) solid ${color}` : undefined,
              borderRight: !isLeft ? `var(--stroke-registration) solid ${color}` : undefined,
              margin: "calc(var(--spacing-m) / -2)",
            }}
          />
        );
      })}
    </>
  );
}
