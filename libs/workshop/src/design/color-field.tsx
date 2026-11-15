import { useId } from "react";
import { useTranslation } from "react-i18next";
import { PipetteIcon } from "lucide-react";
import { Button } from "@freetsy/ui/components/button";
import { ColorInput } from "@freetsy/ui/components/color-input";
import { Field, FieldContent, FieldLabel } from "@freetsy/ui/components/field";
import { Label } from "@freetsy/ui/components/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@freetsy/ui/components/tooltip";
import { cn } from "@freetsy/ui/lib/utils";
import type { ColorPipette } from "./use-color-pipette";

function PipetteButton({
  label,
  active,
  className,
  onClick,
}: {
  label: string;
  active: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={active ? "default" : "outline"}
          aria-label={label}
          aria-pressed={active}
          className={cn("shrink-0", className)}
          onClick={onClick}
        >
          <PipetteIcon strokeWidth="var(--stroke-icon)" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type ColorProps = {
  label: string;
  value: string;
  pipetteKey: string;
  pipette: ColorPipette;
  onChange: (value: string) => void;
};

export function ColorField({ label, value, pipetteKey, pipette, onChange }: ColorProps) {
  const id = useId();
  const { t } = useTranslation();

  return (
    <Field orientation="horizontal" className={cn("justify-between")}>
      <FieldContent className={cn("gap-xs")}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className={cn("font-mono-ui text-xs font-normal tracking-normal text-secondary")}>
          {value.toUpperCase()}
        </span>
      </FieldContent>
      <div className={cn("flex shrink-0 items-center gap-s")}>
        <PipetteButton
          label={t("pipette.pick", { label })}
          active={pipette.activeKey === pipetteKey}
          className={cn("size-11")}
          onClick={() => pipette.toggle(pipetteKey, onChange)}
        />
        <ColorInput
          id={id}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field>
  );
}

export function ColorSwatchField({
  index,
  label,
  value,
  pipetteKey,
  pipette,
  onChange,
}: ColorProps & { index: number }) {
  const id = useId();
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col items-center gap-xs")}>
      <Label htmlFor={id} className={cn("tracking-normal")}>
        {index + 1}
      </Label>
      <ColorInput
        id={id}
        aria-label={label}
        value={value}
        className={cn("size-10")}
        onChange={(event) => onChange(event.target.value)}
      />
      <PipetteButton
        label={t("pipette.pick", { label })}
        active={pipette.activeKey === pipetteKey}
        className={cn("size-10")}
        onClick={() => pipette.toggle(pipetteKey, onChange)}
      />
    </div>
  );
}
