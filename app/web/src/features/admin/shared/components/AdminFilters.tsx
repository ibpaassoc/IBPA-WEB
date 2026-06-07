import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminFiltersProps = {
  children: ReactNode;
  className?: string;
};

export function AdminFilters({ children, className }: AdminFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
