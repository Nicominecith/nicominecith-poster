import * as React from "react";

import { cn } from "../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full resize-y border border-tertiary bg-transparent px-m py-s font-mono-ui text-sm text-primary transition-colors outline-none",
        "pointer-coarse:text-base",
        "placeholder:text-secondary-soft focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
