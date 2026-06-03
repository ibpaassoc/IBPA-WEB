import type { ReactNode } from "react";

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
      className={`rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-7 ${className}`}
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
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10203B] md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
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
          ? "bg-[#10203B] text-white shadow-[0_16px_36px_rgba(16,32,59,0.18)]"
          : "text-slate-600 hover:bg-[#F3F7FB] hover:text-[#10203B]"
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
