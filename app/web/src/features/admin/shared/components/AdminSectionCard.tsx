import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
  variant?: "paper" | "vellum";
};

export function AdminSectionCard({
  actions,
  children,
  className,
  contentClassName,
  description,
  eyebrow,
  noPadding,
  title,
  variant = "paper",
}: AdminSectionCardProps) {
  const hasHeader = title || description || actions || eyebrow;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[30px] border shadow-[0_22px_60px_rgba(15,35,70,0.09)] backdrop-blur-2xl",
        variant === "paper"
          ? "border-white/70 bg-white/78"
          : "border-[#D9E4F2]/80 bg-[#F7FAFE]/82",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[30px] before:bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(255,255,255,0)_52%)] before:content-['']",
        className,
      )}
    >
      {hasHeader ? (
        <header className="relative z-[1] flex items-start justify-between gap-6 border-b border-[#D9E4F2]/80 px-6 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7A94B2]">
                {eyebrow}
              </span>
            ) : null}

            {title ? (
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#10203B]">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-[#6B7C93]">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}

      <div className={cn("relative z-[1]", !noPadding && "p-6", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
