import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
  /** Use the warmer vellum surface for nested cards. */
  variant?: "paper" | "vellum";
};

export function AdminSectionCard({
  actions,
  children,
  className,
  contentClassName,
  description,
  eyebrow,
  noPadding,
  title,
  variant = "paper",
}: AdminSectionCardProps) {
  const hasHeader = title || description || actions || eyebrow;

  return (
    <section
      className={cn(
        variant === "paper" ? "card-premium" : "card-vellum",
        "relative overflow-hidden",
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex items-start justify-between gap-6 border-b border-[var(--hairline)] px-7 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow ? (
              <span className="editorial-eyebrow text-xs">{eyebrow}</span>
            ) : null}
            {title ? (
              <h2 className="font-serif text-xl font-medium leading-tight tracking-tight text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn(!noPadding && "p-7", contentClassName)}>{children}</div>
    </section>
  );
}
