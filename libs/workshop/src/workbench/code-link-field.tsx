import type { ReactNode } from "react";
import { RotateCcwIcon, XIcon } from "lucide-react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@freetsy/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@freetsy/ui/components/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@freetsy/ui/components/tooltip";

function AddonButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InputGroupButton size="icon-xs" onClick={onClick} disabled={disabled} aria-label={label}>
          {children}
        </InputGroupButton>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type CodeLinkFieldProps = {
  id: string;
  label: string;
  description: string;
  note?: ReactNode;
  placeholder: string;
  value: string;
  error?: string;
  clearLabel: string;
  reset?: { label: string; onReset: () => void };
  onChange: (next: string) => void;
  onBlur: () => void;
};

export function CodeLinkField({
  id,
  label,
  description,
  note,
  placeholder,
  value,
  error,
  clearLabel,
  reset,
  onChange,
  onBlur,
}: CodeLinkFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldDescription>{description}</FieldDescription>
      {note && <FieldDescription>{note}</FieldDescription>}
      <InputGroup>
        <InputGroupInput
          id={id}
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
        />
        <InputGroupAddon align="inline-end">
          <AddonButton label={clearLabel} disabled={!value} onClick={() => onChange("")}>
            <XIcon strokeWidth="var(--stroke-icon)" />
          </AddonButton>
          {reset && (
            <AddonButton label={reset.label} onClick={reset.onReset}>
              <RotateCcwIcon strokeWidth="var(--stroke-icon)" />
            </AddonButton>
          )}
        </InputGroupAddon>
      </InputGroup>
      <FieldError>{error}</FieldError>
    </Field>
  );
}
