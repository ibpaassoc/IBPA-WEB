"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  membershipConfigs,
  type MembershipCategory,
} from "@/lib/membership";
import {
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardStandalonePageContainerClassName,
  dashboardTextareaClassName,
  SectionCard,
} from "@/shared/components/DashboardShared";

type ChangeRequest = {
  id: string;
  status: string;
  fromCategory: MembershipCategory;
  toCategory: MembershipCategory;
  oldAmount: number;
  newAmount: number;
  balanceDue: number;
  reason: string;
  submittedAt: string;
  paymentLink?: string | null;
};

type MembershipChangeData = {
  currentMembership: {
    id: string;
    category: MembershipCategory;
    amount: number;
    expiresAt?: string | null;
  };
  latestRequest?: ChangeRequest | null;
};

const statusLabels: Record<string, string> = {
  SUBMITTED: "In review",
  UNDER_REVIEW: "Additional review",
  APPROVED: "Approved",
  PAYMENT_SENT: "Ready for payment",
  PAID: "Completed",
  REJECTED: "Not approved",
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function priceOf(category: MembershipCategory) {
  const value = membershipConfigs.find((item) => item.id === category)?.price ?? "$0";
  return Number(value.replace(/[^0-9]/g, "")) * 100;
}

export default function MembershipChangePage() {
  const router = useRouter();
  const [data, setData] = useState<MembershipChangeData | null>(null);
  const [selected, setSelected] = useState<MembershipCategory | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/membership-change", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Unable to load membership options.");
        return payload as MembershipChangeData;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load membership options.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openRequest = data?.latestRequest
    && !["PAID", "REJECTED"].includes(data.latestRequest.status)
    ? data.latestRequest
    : null;
  const selectedAmount = selected ? priceOf(selected) : 0;
  const balanceDue = data && selected ? Math.max(selectedAmount - data.currentMembership.amount, 0) : 0;
  const availablePlans = useMemo(
    () => membershipConfigs.filter((plan) => plan.id !== data?.currentMembership.category),
    [data?.currentMembership.category],
  );

  const handleSubmit = async () => {
    if (!selected) return toast.error("Choose the membership you would like to request.");
    if (reason.trim().length < 10) return toast.error("Please add a short reason for the review team.");

    setSubmitting(true);
    try {
      const response = await fetch("/api/dashboard/membership-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipCategory: selected, reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to submit your request.");

      setData((current) => current ? { ...current, latestRequest: payload.request } : current);
      toast.success("Membership change submitted for priority review.");
      router.refresh();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to submit your request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4C7D9D]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className={dashboardStandalonePageContainerClassName}>
        <SectionCard className="mx-auto max-w-2xl text-center">
          <p className="text-sm leading-6 text-rose-600">{error || "Membership details are unavailable."}</p>
          <Link href="/dashboard" className={`mt-6 ${dashboardPrimaryButtonClassName}`}>
            Back to dashboard
          </Link>
        </SectionCard>
      </main>
    );
  }

  if (openRequest) {
    const payHref = openRequest.paymentLink || undefined;
    return (
      <main className={dashboardStandalonePageContainerClassName}>
        <div className="mx-auto max-w-4xl space-y-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#10203B]">
            <ArrowLeft className="h-4 w-4" /> Back to Billing & Membership
          </Link>
          <SectionCard className="overflow-hidden rounded-[32px] p-0">
            <div className="bg-[linear-gradient(135deg,#10203B_0%,#244A73_60%,#4C7D9D_100%)] px-6 py-10 text-white md:px-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                <Clock3 className="h-6 w-6" />
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B9D9EB]">Membership change</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Your request is moving forward.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                It is marked as a membership change and placed at the top of the admin review queue.
              </p>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:p-10">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Current</p>
                <p className="mt-2 text-xl font-semibold text-[#10203B]">{openRequest.fromCategory}</p>
                <p className="mt-1 text-sm text-slate-500">{formatMoney(openRequest.oldAmount)} annual membership</p>
              </div>
              <ArrowRight className="mx-auto hidden h-5 w-5 text-[#4C7D9D] md:block" />
              <div className="rounded-[24px] border border-[#B9D9EB] bg-[#F0F8FF] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4C7D9D]">Requested</p>
                <p className="mt-2 text-xl font-semibold text-[#10203B]">{openRequest.toCategory}</p>
                <p className="mt-1 text-sm text-slate-500">{statusLabels[openRequest.status] || openRequest.status}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-6 md:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#10203B]">
                    {openRequest.balanceDue > 0 ? `${formatMoney(openRequest.balanceDue)} due after approval` : "No additional balance due"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Your current membership stays active until the change is completed.</p>
                </div>
                {openRequest.status === "PAYMENT_SENT" && payHref ? (
                  <Link href={payHref} className={dashboardPrimaryButtonClassName}>Complete payment</Link>
                ) : null}
              </div>
            </div>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main className={`${dashboardStandalonePageContainerClassName} pb-16`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#10203B]">
          <ArrowLeft className="h-4 w-4" /> Back to Billing & Membership
        </Link>

        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0C1A30_0%,#17365A_55%,#396C91_100%)] px-6 py-9 text-white shadow-[0_26px_70px_rgba(16,32,59,0.2)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D5E9F7]">
                <Sparkles className="h-3.5 w-3.5" /> Membership evolution
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.035em] md:text-6xl">Choose what fits your next chapter.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                Submit a focused change application. The review team will see your existing membership, your requested level, and the exact balance—without interrupting your current access.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Current membership</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold">{data.currentMembership.category}</p>
                <p className="text-lg font-semibold text-[#D5E9F7]">{formatMoney(data.currentMembership.amount)}</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/55">Remains active throughout review and payment.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <SectionCard className="rounded-[30px]">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F1FA] text-[#315F84]">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Step 1</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#10203B]">Select a new membership</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Every change is reviewed. If the new membership costs less, your balance due is $0.</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {availablePlans.map((plan) => {
                const active = selected === plan.id;
                const difference = Math.max(priceOf(plan.id) - data.currentMembership.amount, 0);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(plan.id)}
                    className={`group relative min-h-[180px] rounded-[24px] border p-5 text-left transition ${
                      active
                        ? "border-[#10203B] bg-[#10203B] text-white shadow-[0_18px_38px_rgba(16,32,59,0.18)]"
                        : "border-slate-200 bg-white text-[#10203B] hover:-translate-y-0.5 hover:border-[#8FB7D2] hover:shadow-[0_14px_32px_rgba(16,32,59,0.08)]"
                    }`}
                  >
                    <span className={`absolute right-4 top-4 flex size-7 items-center justify-center rounded-full border ${active ? "border-white/25 bg-white/15" : "border-slate-200 bg-slate-50"}`}>
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${active ? "text-[#B9D9EB]" : "text-[#4C7D9D]"}`}>{plan.applicantType}</p>
                    <h3 className="mt-3 pr-8 text-xl font-semibold">{plan.title}</h3>
                    <p className={`mt-3 line-clamp-2 text-sm leading-6 ${active ? "text-white/65" : "text-slate-500"}`}>{plan.summary}</p>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <span className="text-lg font-semibold">{plan.price}</span>
                      <span className={`text-xs ${active ? "text-white/60" : "text-slate-400"}`}>+{formatMoney(difference)} due</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-7">
              <label htmlFor="change-reason" className="text-sm font-semibold text-[#10203B]">Why is this membership the right fit now?</label>
              <p className="mt-1 text-sm text-slate-500">A short note helps the review team understand what changed in your professional work.</p>
              <textarea
                id="change-reason"
                value={reason}
                maxLength={1200}
                onChange={(event) => setReason(event.target.value)}
                className={`mt-4 ${dashboardTextareaClassName}`}
                placeholder="For example: I have started teaching accredited courses and would like my membership to reflect my educator role..."
              />
              <p className="mt-2 text-right text-xs text-slate-400">{reason.length} / 1,200</p>
            </div>
          </SectionCard>

          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <SectionCard className="rounded-[30px] border-[#CADCEC] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2F8FC_100%)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Change summary</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Current</span>
                  <span className="font-semibold text-[#10203B]">{data.currentMembership.category} · {formatMoney(data.currentMembership.amount)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Requested</span>
                  <span className="font-semibold text-[#10203B]">{selected ? `${selected} · ${formatMoney(selectedAmount)}` : "Select a plan"}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Due after approval</p>
                    <p className="mt-1 text-xs text-slate-400">New price minus current price</p>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-[#10203B]">{formatMoney(balanceDue)}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!selected || reason.trim().length < 10 || submitting}
                onClick={handleSubmit}
                className={`mt-7 w-full ${dashboardPrimaryButtonClassName}`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Submit for priority review
              </button>
              <Link href="/dashboard" className={`mt-3 w-full ${dashboardSecondaryButtonClassName}`}>Cancel</Link>
            </SectionCard>

            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">No interruption to your access</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-800/75">Your current membership changes only after approval and any required balance payment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
