import { cn } from "@/lib/utils";
import type { AdminStatusTone } from "../types/admin.types";

const toneClasses: Record<AdminStatusTone, string> = {
  accent: "border-[#B9D4F0] bg-[#EEF6FF] text-[#1F5D8F]",
  danger: "border-[#F2C7C7] bg-[#FFF5F5] text-[#B42318]",
  info: "border-[#B9D4F0] bg-[#EEF6FF] text-[#1F5D8F]",
  neutral: "border-[#D7E5F4] bg-[#F6FAFF] text-[#315F8A]",
  success: "border-[#BFE6D4] bg-[#F2FBF7] text-[#197A52]",
  warning: "border-[#D7E5F4] bg-[#F8FBFF] text-[#55708D]",
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
