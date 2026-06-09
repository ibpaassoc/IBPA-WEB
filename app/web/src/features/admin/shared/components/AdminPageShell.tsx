import type { ReactNode } from "react";

import { AdminHeader } from "./AdminHeader";

type AdminPageShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  /** @deprecated – description removed from header. Prop accepted to avoid breaking other pages during migration. */
  description?: string;
  /** @deprecated – sync time removed from header. Prop accepted to avoid breaking other pages during migration. */
  lastSyncedAt?: string | null;
};

export function AdminPageShell({ actions, children, title }: AdminPageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-5 py-8 lg:px-10 lg:py-10">
      <AdminHeader actions={actions} title={title} />
      {children}
    </div>
  );
}
