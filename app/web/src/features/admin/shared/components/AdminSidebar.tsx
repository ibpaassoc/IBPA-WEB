"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

import { AdminSidebarNav } from "./AdminSidebarNav";
import { AdminGlobalSearch } from "../../search/components/AdminGlobalSearch";

export function AdminSidebar() {
  const { user } = useUser();

  const name = user?.fullName || "Admin workspace";
  const email = user?.primaryEmailAddress?.emailAddress || "Management cabinet";

  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-[104px]">
        <section className="rounded-[28px] border border-[#D4E0F0] bg-white p-4 shadow-[0_24px_70px_rgba(15,35,70,0.10)]">
          <Link
            href="/admin"
            className="mb-4 block rounded-[24px] bg-[linear-gradient(135deg,#10203B_0%,#284872_100%)] p-4 text-white shadow-[0_18px_40px_rgba(16,32,59,0.22)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              IBPA
            </p>
            <p className="mt-2 truncate text-lg font-semibold">{name}</p>
            <p className="mt-1 truncate text-sm text-white/75">{email}</p>
          </Link>

          <div className="mb-4">
            <AdminGlobalSearch />
          </div>

          <AdminSidebarNav />
        </section>
      </div>
    </aside>
  );
}
