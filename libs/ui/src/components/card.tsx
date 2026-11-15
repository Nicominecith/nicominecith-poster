import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "../lib/utils";

function Card({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card"
      className={cn(
        "flex flex-col gap-xl border border-tertiary bg-surface-raised p-lg",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-xs", className)} {...props} />
  );
}

function CardEyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="card-eyebrow"
      className={cn("font-mono-ui text-xs tracking-eyebrow text-secondary uppercase", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("font-display text-xl leading-tight text-primary", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("font-mono-ui text-xs text-secondary", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("flex flex-col gap-xl", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex flex-col gap-m border-t border-tertiary pt-lg", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardEyebrow, CardFooter, CardHeader, CardTitle };
