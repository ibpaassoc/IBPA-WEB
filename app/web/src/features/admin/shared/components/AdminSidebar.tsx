"use client";

import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from "next/link";

import { AdminSidebarNav } from "./AdminSidebarNav";

export function AdminSidebar() {
  const { user } = useUser();

  return (
    <aside className="hidden shrink-0 border-r border-border bg-card lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Link className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground" href="/admin">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          IBPA Admin
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <AdminSidebarNav />
      </div>

      <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {(user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "A").slice(0, 1).toUpperCase()}
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
