import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: AdminHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#D7E5F4] bg-white p-6 shadow-[0_18px_45px_rgba(15,46,83,0.06)] lg:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 4% 0%, rgba(31,93,143,0.08), transparent 38%), radial-gradient(circle at 96% 8%, rgba(138,162,189,0.10), transparent 36%)",
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#8AA2BD]">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#10203B] lg:text-4xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6C7F95] lg:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
