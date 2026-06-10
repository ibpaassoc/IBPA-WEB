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
        "relative overflow-hidden rounded-[28px] border border-[#D7E5F4] shadow-[0_18px_45px_rgba(15,46,83,0.06)]",
        variant === "paper" ? "bg-white" : "bg-[#F8FBFF]",
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex items-start justify-between gap-6 border-b border-[#E4EEF8] px-6 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8AA2BD]">
                {eyebrow}
              </span>
            ) : null}

            {title ? (
              <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#10203B]">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-[#6C7F95]">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}

      <div className={cn(!noPadding && "p-6", contentClassName)}>{children}</div>
    </section>
  );
}
