import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "pending" | "active" | "verified";
}) {
  const classes =
    tone === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "active"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] md:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-2xl font-semibold tracking-tight text-[#10203B] md:text-3xl",
            eyebrow ? "mt-2.5" : "",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function NavButton({
  active,
  label,
  icon,
  onClick,
  accent,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  accent?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
        active
          ? "bg-[#10203B] text-white shadow-[0_12px_28px_rgba(16,32,59,0.16)]"
          : "text-slate-600 hover:bg-slate-50 hover:text-[#10203B]"
      }`}
    >
      <span className={active ? "text-white" : "text-[#4C7D9D]"}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {accent ? <span className="ml-auto">{accent}</span> : null}
    </button>
  );
}

export const dashboardSubtlePanelClassName =
  "rounded-[22px] border border-slate-200 bg-slate-50/70";

export const dashboardMetricCardClassName =
  "rounded-[20px] border border-slate-200 bg-slate-50/80 p-4";

export const dashboardInputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#10203B] outline-none transition focus:border-[#4C7D9D] focus:ring-2 focus:ring-[#4C7D9D]/10";

export const dashboardTextareaClassName =
  "min-h-[160px] w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-[#10203B] outline-none transition focus:border-[#4C7D9D] focus:ring-2 focus:ring-[#4C7D9D]/10";

export const dashboardPrimaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a3157] disabled:cursor-not-allowed disabled:opacity-60";

export const dashboardSecondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B] disabled:cursor-not-allowed disabled:opacity-60";

export const dashboardShellContainerClassName =
  "mx-auto w-full max-w-7xl px-4 md:px-6";

export const dashboardStandalonePageContainerClassName =
  `${dashboardShellContainerClassName} py-6 md:py-8`;

export function getDashboardFilterButtonClassName(active: boolean) {
  return cn(
    "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition",
    active
      ? "border-[#10203B] bg-[#10203B] text-white shadow-[0_10px_24px_rgba(16,32,59,0.14)]"
      : "border-slate-200 bg-white text-slate-600 hover:border-[#4C7D9D]/40 hover:text-[#10203B]",
  );
}

export function getDashboardSelectableCardClassName(active: boolean) {
  return cn(
    "rounded-[22px] border p-4 text-left transition",
    active
      ? "border-[#10203B] bg-[#10203B] text-white shadow-[0_14px_30px_rgba(16,32,59,0.14)]"
      : "border-slate-200 bg-white text-slate-700 hover:border-[#4C7D9D]/30 hover:bg-slate-50",
  );
}
