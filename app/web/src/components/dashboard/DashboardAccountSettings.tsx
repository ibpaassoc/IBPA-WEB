"use client";

import { UserProfile } from "@clerk/nextjs";

const shellCardClassName =
  "rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.09)]";

export function DashboardAccountSettings() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10203B]">
          Account settings
        </h1>
      </div>

      <section className={shellCardClassName}>
        <div className="overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-[#F8FBFF] p-3">
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full max-w-none border-0 bg-transparent shadow-none",
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}
