import * as React from "react";

import { cn } from "../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 border border-tertiary bg-transparent px-m py-s font-mono-ui text-sm text-primary transition-colors outline-none",
        "pointer-coarse:text-base",
        "placeholder:text-secondary-soft focus-visible:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
