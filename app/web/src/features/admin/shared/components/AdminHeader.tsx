import type { ReactNode } from "react";

import { formatAdminTime } from "../utils/admin-formatters";

type AdminHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  lastSyncedAt?: string | null;
};

export function AdminHeader({
  actions,
  description,
  lastSyncedAt,
  title,
}: AdminHeaderProps) {
  const syncedTime = formatAdminTime(lastSyncedAt);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-[linear-gradient(120deg,#eaf4ff_0%,#f8fbff_55%,#ffffff_100%)] px-5 py-5 shadow-[0_1px_0_rgba(33,70,109,0.04)] lg:flex-row lg:items-end lg:justify-between lg:px-7 lg:py-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#16243a] lg:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
        {syncedTime ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2b5c99]/70">
            Last sync {syncedTime}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
