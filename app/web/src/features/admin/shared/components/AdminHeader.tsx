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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
        {syncedTime ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Last sync {syncedTime}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
