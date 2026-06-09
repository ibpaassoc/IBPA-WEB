import { cn } from "@/lib/utils";
import type { AdminStatusTone } from "../types/admin.types";

const toneClasses: Record<AdminStatusTone, string> = {
  accent: "border-primary/20 bg-primary/10 text-primary",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  info: "border-primary/20 bg-primary/10 text-primary",
  neutral: "border-border bg-muted text-muted-foreground",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700",
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
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
