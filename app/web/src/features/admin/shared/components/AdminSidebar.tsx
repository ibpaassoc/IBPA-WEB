"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

import { AdminSidebarNav } from "./AdminSidebarNav";

export function AdminSidebar() {
  const { user } = useUser();
  const initials = (user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "A")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex lg:w-64">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link className="flex items-center gap-2.5 focus-visible:outline-none" href="/admin">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            I
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">IBPA</span>
            <span className="text-[11px] text-muted-foreground">Admin workspace</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <AdminSidebarNav />
      </div>

      {/* User footer */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user?.fullName || "Admin"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress || "Signed in"}
          </span>
        </div>
      </div>
    </aside>
  );
}
