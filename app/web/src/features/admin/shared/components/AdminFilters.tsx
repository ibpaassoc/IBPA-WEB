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
        "flex flex-col gap-3 rounded-[28px] border border-[#D7E5F4] bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)] lg:flex-row lg:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
