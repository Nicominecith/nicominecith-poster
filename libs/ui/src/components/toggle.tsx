import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";

import { cn } from "../lib/utils";

const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-s border font-mono-ui whitespace-nowrap uppercase transition-colors outline-none focus-visible:border-accent disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-tertiary text-secondary hover:border-primary hover:text-primary data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-surface",
      },
      size: {
        default: "px-m py-s text-xs",
        sm: "px-s py-xs text-xs tracking-ui",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
