import { useId, type ReactNode } from "react";
import { cn } from "@freetsy/ui/lib/utils";

type SettingsBlockProps = {
  title: string;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

function Description({ children }: { children: ReactNode }) {
  return (
    <p className={cn("font-mono-ui text-xs leading-relaxed text-secondary-soft")}>{children}</p>
  );
}

export function SettingsSection({ title, description, className, children }: SettingsBlockProps) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      data-slot="settings-section"
      className={cn("flex flex-col gap-lg border-t border-tertiary pt-lg", className)}
    >
      <header className={cn("flex flex-col gap-xs")}>
        <h3 id={id} className={cn("font-display text-lg leading-tight text-primary")}>
          {title}
        </h3>
        {description && <Description>{description}</Description>}
      </header>
      {children}
    </section>
  );
}

export function SettingsGroup({ title, description, className, children }: SettingsBlockProps) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      data-slot="settings-group"
      className={cn("flex flex-col gap-l", className)}
    >
      <div className={cn("flex flex-col gap-xs")}>
        <h4
          id={id}
          className={cn("font-mono-ui text-xs font-bold tracking-eyebrow text-primary uppercase")}
        >
          {title}
        </h4>
        {description && <Description>{description}</Description>}
      </div>
      {children}
    </div>
  );
}
