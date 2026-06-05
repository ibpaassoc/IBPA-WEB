import Link from "next/link";
import { CreditCard, LifeBuoy } from "lucide-react";

import {
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardSubtlePanelClassName,
  SectionCard,
  SectionHeader,
} from "@/shared/components/DashboardShared";
import type { Certificate } from "@/components/dashboard/dashboard-types";
import { formatStatusLabel, getMembershipAmount } from "@/lib/dashboard-cabinet";

type BillingEntry = {
  id: string;
  date: string;
  amount: string;
  status: string;
  certificateUrl?: string | null;
};

const metricClassName =
  "rounded-[22px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]";

const labelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";

export function DashboardBilling({
  isPartnerOwner,
  membershipCategoryLabel,
  primaryCertificate,
  membershipExpiresDisplay,
  statusSummary,
  billingEntries,
  setActiveTab,
}: {
  isPartnerOwner: boolean;
  membershipCategoryLabel: string;
  primaryCertificate?: Certificate;
  membershipExpiresDisplay: string;
  statusSummary: {
    label: string;
  };
  billingEntries: BillingEntry[];
  lastSyncedAt: string | null;
  partnerSeatPrice: number;
  setActiveTab: (tab: "support") => void;
}) {
  const membershipType = isPartnerOwner
    ? "Account"
    : getMembershipAmount(primaryCertificate?.membershipCategory);

  const paymentTitle = isPartnerOwner
    ? "Partner Membership Payment"
    : "Membership Payment";

  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          title="Billing & Membership"
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/membership" className={dashboardPrimaryButtonClassName}>
                Renew
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={dashboardSecondaryButtonClassName}
              >
                Support
              </button>
            </div>
          }
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
              <article className={metricClassName}>
                <p className={labelClassName}>Plan</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {membershipCategoryLabel}
                </p>
              </article>

              <article className={metricClassName}>
                <p className={labelClassName}>Expires</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {membershipExpiresDisplay}
                </p>
              </article>

              <article className={metricClassName}>
                <p className={labelClassName}>Status</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {statusSummary.label}
                </p>
              </article>
            </div>

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Payment History
              </h3>

              <div className="mt-4 space-y-3">
                {billingEntries.length > 0 ? (
                  billingEntries.map((entry) => (
                    <article
                      key={entry.id}
                      className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#4C7D9D]">
                          <CreditCard className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {paymentTitle}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {entry.date}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm font-semibold text-slate-950">
                          {entry.amount}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatStatusLabel(entry.status, "Pending")}
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                    No payments yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className={`${dashboardSubtlePanelClassName} h-fit p-5`}>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-[#4C7D9D]">
                <LifeBuoy className="h-4 w-4" />
              </div>

              <h3 className="text-base font-semibold text-slate-950">
                Billing Support
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Need help with payment, renewal, or membership access?
            </p>

            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className={`mt-5 w-full ${dashboardPrimaryButtonClassName}`}
            >
              Contact Support
            </button>
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
