import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-s border font-mono-ui whitespace-nowrap uppercase transition-colors outline-none focus-visible:border-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-on-primary transition-opacity hover:opacity-85",
        outline: "border-tertiary text-secondary hover:border-primary hover:text-primary",
        destructive: "border-tertiary text-secondary hover:border-accent hover:text-accent",
        ghost: "border-transparent text-secondary hover:text-primary",
        link: "border-transparent tracking-normal text-secondary normal-case underline underline-offset-2 hover:text-primary",
      },
      size: {
        default: "px-m py-s text-xs",
        sm: "px-s py-xs text-xs tracking-ui",
        lg: "px-l py-m text-sm tracking-wide",
        icon: "p-s",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
