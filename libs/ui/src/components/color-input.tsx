import * as React from "react";

import { cn } from "../lib/utils";

function ColorInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="color"
      data-slot="color-input"
      className={cn(
        "size-11 shrink-0 cursor-pointer border border-tertiary bg-transparent p-1 outline-none focus-visible:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export { ColorInput };
