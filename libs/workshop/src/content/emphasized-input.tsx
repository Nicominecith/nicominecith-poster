import type { ComponentProps } from "react";
import { StarIcon } from "lucide-react";
import { Input } from "@freetsy/ui/components/input";
import { Toggle } from "@freetsy/ui/components/toggle";
import { cn } from "@freetsy/ui/lib/utils";

export function EmphasizedInput({
  emphasized,
  onEmphasizedChange,
  emphasizeLabel,
  className,
  ...input
}: ComponentProps<typeof Input> & {
  emphasized: boolean;
  onEmphasizedChange: (emphasized: boolean) => void;
  emphasizeLabel: string;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1")}>
      <Input type="text" className={cn("pr-10", emphasized && "font-bold", className)} {...input} />
      <Toggle
        pressed={emphasized}
        onPressedChange={onEmphasizedChange}
        aria-label={emphasizeLabel}
        title={emphasizeLabel}
        className={cn(
          "absolute top-1/2 right-1 size-7 -translate-y-1/2 border-transparent p-0 normal-case",
          "hover:border-tertiary data-[state=on]:border-primary",
        )}
      >
        <StarIcon fill={emphasized ? "currentColor" : "none"} strokeWidth="var(--stroke-icon)" />
      </Toggle>
    </div>
  );
}
