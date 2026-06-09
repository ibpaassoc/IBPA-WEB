import type { ReactNode } from "react";

import { AdminHeader } from "./AdminHeader";

type AdminPageShellProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  lastSyncedAt?: string | null;
};

export function AdminPageShell({
  actions,
  children,
  eyebrow,
  subtitle,
  title,
  description,
}: AdminPageShellProps) {
  return (
    <div className="w-full space-y-6">
      <AdminHeader
        actions={actions}
        eyebrow={eyebrow}
        subtitle={subtitle ?? description}
        title={title}
      />

      {children}
    </div>
  );
}
