import type { ReactNode } from "react";

import { AdminHeader } from "./AdminHeader";

type AdminPageShellProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** @deprecated kept for migration; unused in the new design. */
  description?: string;
  /** @deprecated kept for migration; unused in the new design. */
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
    <div className="relative z-[1] mx-auto flex w-full max-w-screen-2xl flex-col gap-10 px-6 py-10 lg:px-14 lg:py-16">
      <AdminHeader
        actions={actions}
        eyebrow={eyebrow}
        subtitle={subtitle ?? description}
        title={title}
      />
      <div className="flex flex-col gap-10">{children}</div>
    </div>
  );
}
