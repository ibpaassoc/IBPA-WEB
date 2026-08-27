"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2, ReceiptText, ShieldCheck } from "lucide-react";

import {
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardStandalonePageContainerClassName,
} from "@/shared/components/DashboardShared";

type VerifyResult = {
  status?: string;
  membershipCategory?: string;
};

function MembershipChangeSuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<"loading" | "paid" | "error">(token ? "loading" : "error");
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const verify = async () => {
      try {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
          const response = await fetch(`/api/orders/verify/${encodeURIComponent(token)}${query}`, { cache: "no-store" });
          const payload = await response.json().catch(() => ({}));
          if (cancelled) return;

          if (response.ok && payload.status === "paid") {
            setResult(payload);
            setState("paid");
            return;
          }
          if (attempt < 9) {
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
            continue;
          }
          setState("error");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  if (state === "loading") {
    return (
      <main className={`${dashboardStandalonePageContainerClassName} flex min-h-[70vh] items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#4C7D9D]" />
          <p className="mt-4 text-sm font-medium text-slate-500">Confirming your membership change…</p>
        </div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className={`${dashboardStandalonePageContainerClassName} flex min-h-[70vh] items-center justify-center`}>
        <section className="w-full max-w-xl rounded-[30px] border border-amber-200 bg-white p-8 text-center shadow-[0_22px_60px_rgba(16,32,59,0.1)]">
          <ReceiptText className="mx-auto h-9 w-9 text-amber-600" />
          <h1 className="mt-5 text-2xl font-semibold text-[#10203B]">Payment is still being confirmed</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Stripe may need another moment. Your current membership remains active while confirmation finishes.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard/membership/change" className={dashboardPrimaryButtonClassName}>Check request</Link>
            <Link href="/dashboard" className={dashboardSecondaryButtonClassName}>Open dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`${dashboardStandalonePageContainerClassName} flex min-h-[75vh] items-center justify-center py-12`}>
      <section className="w-full max-w-4xl overflow-hidden rounded-[36px] border border-[#C5DCEC] bg-white shadow-[0_28px_90px_rgba(16,32,59,0.16)]">
        <div className="bg-[radial-gradient(circle_at_80%_15%,rgba(185,217,235,0.25),transparent_30%),linear-gradient(135deg,#10203B_0%,#244E74_100%)] px-7 py-12 text-white md:px-12">
          <div className="flex size-16 items-center justify-center rounded-[22px] bg-emerald-400/15 ring-1 ring-emerald-200/30">
            <Check className="h-8 w-8 text-emerald-200" />
          </div>
          <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B9D9EB]">Payment confirmed</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Your membership has changed.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">Your dashboard, certificate, and original expiry date carry forward under your new {result?.membershipCategory || "membership"} status.</p>
        </div>

        <div className="grid gap-5 p-7 md:grid-cols-3 md:p-10">
          {[
            ["01", "Status updated", "The new membership is active in your dashboard."],
            ["02", "Certificate preserved", "Your existing certificate number remains connected."],
            ["03", "Renewal aligned", "Future subscription renewals use the new membership level."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#4C7D9D]">{number}</p>
              <p className="mt-4 text-base font-semibold text-[#10203B]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 px-7 py-6 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Difference-only payment completed securely with Stripe
          </div>
          <Link href="/dashboard" className={dashboardPrimaryButtonClassName}>
            Back to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function MembershipChangeSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F7FB]" />}>
      <MembershipChangeSuccessContent />
    </Suspense>
  );
}
