import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { AdminStatusTone } from "../types/admin.types";

const toneClasses: Record<AdminStatusTone, string> = {
  accent: "border-primary/20 bg-primary/10 text-primary",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  neutral: "border-border bg-muted text-muted-foreground",
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
