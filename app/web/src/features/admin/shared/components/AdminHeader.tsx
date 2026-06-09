import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function AdminHeader({ actions, title }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 pb-1">
      <h1 className="font-serif text-3xl font-medium text-foreground lg:text-4xl">{title}</h1>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
