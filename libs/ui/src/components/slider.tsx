import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbCount = React.useMemo(
    () =>
      Array.isArray(value) ? value.length : Array.isArray(defaultValue) ? defaultValue.length : 1,
    [value, defaultValue],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center py-s select-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn("relative h-1 w-full grow overflow-hidden bg-tertiary")}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn("absolute h-full bg-primary")}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "block size-4 shrink-0 border border-primary bg-surface-raised transition-colors outline-none hover:border-accent focus-visible:border-accent",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
