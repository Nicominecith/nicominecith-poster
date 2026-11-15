import { useId, type ComponentProps, type CSSProperties } from "react";
import { useFieldContext } from "./form-context";
import { Checkbox } from "../components/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "../components/field";
import { Input } from "../components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { Slider } from "../components/slider";
import { Textarea } from "../components/textarea";
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group";

export function TextField({
  label,
  description,
  ...props
}: { label: string; description?: string } & Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "id"
>) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Input
        id={id}
        value={field.state.value}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        aria-describedby={field.state.meta.errors.length ? `${id}-error` : undefined}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
      <FieldError
        id={`${id}-error`}
        errors={field.state.meta.errors.map((error) => ({ message: String(error) }))}
      />
    </Field>
  );
}

export function NumberField({
  label,
  description,
  ...props
}: { label: string; description?: string } & Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "id" | "type"
>) {
  const field = useFieldContext<number | "">();
  const id = useId();

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Input
        id={id}
        type="number"
        value={field.state.value}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        aria-describedby={field.state.meta.errors.length ? `${id}-error` : undefined}
        onChange={(e) => field.handleChange(e.target.value === "" ? "" : Number(e.target.value))}
        onBlur={field.handleBlur}
        {...props}
      />
      <FieldError
        id={`${id}-error`}
        errors={field.state.meta.errors.map((error) => ({ message: String(error) }))}
      />
    </Field>
  );
}

export function TextareaField({
  label,
  description,
  ...props
}: { label: string; description?: string } & Omit<
  ComponentProps<typeof Textarea>,
  "value" | "onChange" | "id"
>) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Textarea
        id={id}
        value={field.state.value}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        aria-describedby={field.state.meta.errors.length ? `${id}-error` : undefined}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
      <FieldError
        id={`${id}-error`}
        errors={field.state.meta.errors.map((error) => ({ message: String(error) }))}
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  options,
  description,
}: {
  label: string;
  options: Array<{ value: T; label: string; style?: CSSProperties }>;
  description?: string;
}) {
  const field = useFieldContext<T>();
  const id = useId();
  const selected = options.find((option) => option.value === field.state.value);

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Select
        value={field.state.value}
        onValueChange={(next) => {
          const option = options.find((o) => o.value === next);
          if (option) field.handleChange(option.value);
        }}
      >
        <SelectTrigger id={id} onBlur={field.handleBlur}>
          <SelectValue>
            <span style={selected?.style}>{selected?.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} style={option.style}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function ToggleField<T extends string | number>({
  label,
  options,
  disabled = false,
  description,
}: {
  label: string;
  options: Array<{ value: T; label: string; title?: string }>;
  disabled?: boolean;
  description?: string;
}) {
  const field = useFieldContext<T>();
  const labelId = useId();

  return (
    <Field>
      <FieldTitle id={labelId}>{label}</FieldTitle>
      {description && <FieldDescription>{description}</FieldDescription>}
      <ToggleGroup
        type="single"
        value={String(field.state.value)}
        disabled={disabled}
        aria-labelledby={labelId}
        onValueChange={(next) => {
          const option = options.find((o) => String(o.value) === next);
          if (option) field.handleChange(option.value);
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={String(option.value)}
            title={option.title}
            className="flex-1"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}

export function SliderField({
  label,
  min,
  max,
  step,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
}) {
  const field = useFieldContext<number>();
  const labelId = useId();

  return (
    <Field>
      <FieldTitle id={labelId}>{label}</FieldTitle>
      <Slider
        value={[field.state.value]}
        min={min}
        max={max}
        step={step}
        aria-labelledby={labelId}
        onValueChange={([next]) => field.handleChange(next)}
      />
    </Field>
  );
}

export function CheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>();
  const id = useId();

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        checked={field.state.value}
        onCheckedChange={(next) => field.handleChange(next === true)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id} className="tracking-normal">
          {label}
        </FieldLabel>
      </FieldContent>
    </Field>
  );
}
