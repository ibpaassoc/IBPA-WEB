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
    <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_70px_rgba(15,35,70,0.10)] backdrop-blur-2xl lg:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 8% 0%, rgba(33,70,109,0.14), transparent 34%), radial-gradient(circle at 92% 12%, rgba(138,162,189,0.16), transparent 30%)",
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8AA2BD]">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[#10203B] lg:text-5xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7C93] lg:text-[15px]">
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
