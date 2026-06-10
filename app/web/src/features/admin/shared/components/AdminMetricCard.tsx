import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  hint?: string;
  active?: boolean;
};

export function AdminMetricCard({
  active,
  description,
  hint,
  icon: Icon,
  label,
  value,
}: AdminMetricCardProps) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-US") : value;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_45px_rgba(15,46,83,0.08)]",
        active
          ? "border-transparent bg-[linear-gradient(135deg,#10203B_0%,#1F5D8F_100%)] text-white"
          : "border-[#D7E5F4] bg-white text-[#10203B]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.22em]",
            active ? "text-white/70" : "text-[#8AA2BD]",
          )}
        >
          {label}
        </span>

        {Icon ? (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-2xl",
              active
                ? "bg-white/15 text-white"
                : "bg-[#EEF6FF] text-[#1F5D8F]",
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>

      <p className="mt-5 truncate text-3xl font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {formattedValue}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        {description ? (
          <p
            className={cn(
              "text-sm leading-5",
              active ? "text-white/70" : "text-[#6C7F95]",
            )}
          >
            {description}
          </p>
        ) : (
          <span />
        )}

        {hint ? (
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold",
              active
                ? "border-white/25 bg-white/10 text-white/80"
                : "border-[#D7E5F4] bg-[#EEF6FF] text-[#1F5D8F]",
            )}
          >
            {hint}
          </span>
        ) : null}
      </div>
    </section>
  );
}
