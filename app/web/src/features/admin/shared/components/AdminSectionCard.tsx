import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
};

export function AdminSectionCard({
  actions,
  children,
  className,
  contentClassName,
  description,
  noPadding,
  title,
}: AdminSectionCardProps) {
  const hasHeader = title || description || actions;

  return (
    <div
      className={cn(
        "rounded-xl bg-card",
        "border border-border",
        "[box-shadow:var(--card-shadow)] transition-shadow duration-200 hover:[box-shadow:var(--card-shadow-hover)]",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(!noPadding && "p-5", contentClassName)}>{children}</div>
    </div>
  );
}
