import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { AdminStatusTone } from "../types/admin.types";

const toneClasses: Record<AdminStatusTone, string> = {
  accent: "border-[#d4e0f0] bg-[#e9f1f8] text-[#21466d]",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  info: "border-[#d6e3f2] bg-[#eaf4ff] text-[#2b5c99]",
  neutral: "border-border bg-secondary text-[#21466d]/80",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

type AdminStatusBadgeProps = {
  children: React.ReactNode;
  tone?: AdminStatusTone;
  className?: string;
};

export function AdminStatusBadge({
  children,
  className,
  tone = "neutral",
}: AdminStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full", toneClasses[tone], className)}>
      {children}
    </Badge>
  );
}
