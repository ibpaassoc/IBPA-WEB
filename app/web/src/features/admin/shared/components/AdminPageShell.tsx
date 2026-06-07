import type { ReactNode } from "react";

import { AdminHeader } from "./AdminHeader";

type AdminPageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  lastSyncedAt?: string | null;
};

export function AdminPageShell({
  actions,
  children,
  description,
  lastSyncedAt,
  title,
}: AdminPageShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
      <AdminHeader
        actions={actions}
        description={description}
        lastSyncedAt={lastSyncedAt}
        title={title}
      />
      {children}
    </main>
  );
}
