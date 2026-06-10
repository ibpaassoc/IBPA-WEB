"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  Construction,
  Mail,
  Sparkles,
} from "lucide-react";

import { SectionCard } from "./DashboardShared";

type UnderDevelopmentPageProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  expectedLabel?: string;
  backHref?: string;
  backLabel?: string;
  notifyLabel?: string;
  children?: ReactNode;
  items?: string[];
};

const defaultItems = [
  "We are polishing the layout, mobile responsiveness, and dashboard data flow.",
  "This page will be connected only after the experience is stable and clear.",
  "You can continue using the available dashboard sections while this area is being prepared.",
];

export function UnderDevelopmentPage({
  title = "This page is under development",
  description = "We are preparing this dashboard section and will make it available once the experience is ready.",
  eyebrow = "Coming soon",
  expectedLabel = "Dashboard update in progress",
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
  notifyLabel = "You will see updates here when this section is ready.",
  children,
  items = defaultItems,
}: UnderDevelopmentPageProps) {
  return (
    <div className="space-y-6">
      <SectionCard className="relative overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_48%,#eef7ff_100%)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#CFE8F7]/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#DDEBFF]/70 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6E7F2] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D] shadow-sm">
              <Construction className="h-4 w-4" />
              {eyebrow}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-[#10203B] md:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              {description}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={backHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(16,32,59,0.18)] transition hover:-translate-y-0.5 hover:bg-[#19345F]"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>

              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D9E8F2] bg-white/70 px-5 py-3 text-sm font-medium text-slate-600">
                <Bell className="h-4 w-4 text-[#4C7D9D]" />
                {expectedLabel}
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF7FD] text-[#4C7D9D]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#10203B]">
                  Work in progress
                </p>
                <p className="text-xs text-slate-500">IBPA member dashboard</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl bg-[#F6FAFD] p-4 text-sm leading-6 text-slate-600"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4C7D9D]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
      {children ? <div>{children}</div> : null}
    </div>
  );
}
