import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
};

/**
 * Asymmetric page header. Editorial italic eyebrow + display title on the left,
 * primary actions floated right. Generous breathing room.
 */
export function AdminHeader({ actions, eyebrow, subtitle, title }: AdminHeaderProps) {
  return (
    <div className="admin-rise flex flex-col gap-6 pb-2 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow ? (
          <span className="editorial-eyebrow text-sm tracking-tight">{eyebrow}</span>
        ) : null}
        <h1
          className="font-serif text-[2.6rem] font-medium leading-[1.02] tracking-[-0.02em] text-foreground lg:text-[3.4rem]"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground lg:text-[0.95rem]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}
