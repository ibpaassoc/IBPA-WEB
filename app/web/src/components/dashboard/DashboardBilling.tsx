import Link from "next/link";
import { CreditCard, FileText, LifeBuoy, Users } from "lucide-react";

import {
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardSubtlePanelClassName,
  SectionCard,
  SectionHeader,
} from "@/shared/components/DashboardShared";
import type {
  Certificate,
  PartnerTeamSummary,
} from "@/components/dashboard/dashboard-types";
import { formatStatusLabel, getMembershipAmount } from "@/lib/dashboard-cabinet";

type BillingEntry = {
  id: string;
  date: string;
  amount: string;
  status: string;
  certificateUrl?: string | null;
};

const compactMetricClassName =
  "rounded-[22px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]";

const labelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";

export function DashboardBilling({
  isPartnerOwner,
  partnerTeamSummary,
  membershipCategoryLabel,
  primaryCertificate,
  membershipExpiresDisplay,
  statusSummary,
  billingEntries,
  partnerSeatPrice,
  setActiveTab,
}: {
  isPartnerOwner: boolean;
  partnerTeamSummary: PartnerTeamSummary | null;
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
  const priceOrSeats = isPartnerOwner
    ? `${partnerTeamSummary?.includedSeats ?? 5} seats included`
    : getMembershipAmount(primaryCertificate?.membershipCategory);

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

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className={compactMetricClassName}>
                <p className={labelClassName}>Plan</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {membershipCategoryLabel}
                </p>
              </article>

              <article className={compactMetricClassName}>
                <p className={labelClassName}>{isPartnerOwner ? "Seats" : "Price"}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {priceOrSeats}
                </p>
              </article>

              <article className={compactMetricClassName}>
                <p className={labelClassName}>Expires</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {membershipExpiresDisplay}
                </p>
              </article>

              <article className={compactMetricClassName}>
                <p className={labelClassName}>Status</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {statusSummary.label}
                </p>
              </article>
            </div>

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                    Payment History
                  </h3>
                </div>
              </div>

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
                          <p className="truncate text-sm font-semibold text-slate-950" title={entry.id}>
                            {entry.id}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{entry.date}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <div className="sm:text-right">
                          <p className="text-sm font-semibold text-slate-950">
                            {entry.amount}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatStatusLabel(entry.status, "Pending")}
                          </p>
                        </div>

                        {entry.certificateUrl ? (
                          <a
                            href={entry.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={dashboardSecondaryButtonClassName}
                          >
                            <FileText className="h-4 w-4" />
                            Invoice
                          </a>
                        ) : (
                          <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                            Invoice pending
                          </span>
                        )}
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

          <aside className="space-y-5">
            {isPartnerOwner ? (
              <section className={`${dashboardSubtlePanelClassName} p-5`}>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[#0B1F3A] text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-950">Seats</h3>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <span>Included</span>
                    <span className="font-semibold text-slate-950">
                      {partnerTeamSummary?.includedSeats ?? 5}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Used</span>
                    <span className="font-semibold text-slate-950">
                      {partnerTeamSummary?.usedSeats ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Remaining</span>
                    <span className="font-semibold text-slate-950">
                      {partnerTeamSummary?.remainingSeats ?? 0}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-4">
                    <span>Extra seat</span>
                    <span className="font-semibold text-slate-950">
                      ${partnerSeatPrice}
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-[#4C7D9D]">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-950">Billing Help</h3>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  disabled
                  className={dashboardSecondaryButtonClassName}
                >
                  <FileText className="h-4 w-4" />
                  Download Invoice
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={dashboardPrimaryButtonClassName}
                >
                  Contact Support
                </button>
              </div>
            </section>
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
