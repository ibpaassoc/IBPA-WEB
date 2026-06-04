import Link from "next/link";
import { CreditCard, FileText } from "lucide-react";

import {
  dashboardMetricCardClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardSubtlePanelClassName,
  SectionCard,
  SectionHeader,
} from "@/components/dashboard/DashboardShared";
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

export function DashboardBilling({
  isPartnerOwner,
  partnerTeamSummary,
  membershipCategoryLabel,
  primaryCertificate,
  membershipExpiresDisplay,
  statusSummary,
  billingEntries,
  lastSyncedAt,
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

  const seatDetail = isPartnerOwner
    ? `$${partnerSeatPrice} per additional seat`
    : undefined;

  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          title="Billing & Membership"
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/membership" className={dashboardPrimaryButtonClassName}>
                Renew Membership
              </Link>
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={dashboardSecondaryButtonClassName}
              >
                Contact Support
              </button>
            </div>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className={dashboardMetricCardClassName}>
                <p className="text-xs font-medium text-slate-500">Membership type</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {membershipCategoryLabel}
                </p>
              </article>

              <article className={dashboardMetricCardClassName}>
                <p className="text-xs font-medium text-slate-500">Price / Seats</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {priceOrSeats}
                </p>
                {seatDetail ? (
                  <p className="mt-1 text-xs text-slate-400">{seatDetail}</p>
                ) : null}
              </article>

              <article className={dashboardMetricCardClassName}>
                <p className="text-xs font-medium text-slate-500">Expiration</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {membershipExpiresDisplay}
                </p>
              </article>

              <article className={dashboardMetricCardClassName}>
                <p className="text-xs font-medium text-slate-500">Status</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {statusSummary.label}
                </p>
              </article>
            </div>

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                    Payment History
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Past membership payments connected to this account.
                  </p>
                </div>

                {lastSyncedAt ? (
                  <p className="text-xs text-slate-400">
                    Updated{" "}
                    {new Date(lastSyncedAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {billingEntries.length > 0 ? (
                  billingEntries.map((entry) => (
                    <article
                      key={entry.id}
                      className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-[#4C7D9D]">
                          <CreditCard className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.id}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{entry.date}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <div className="sm:text-right">
                          <p className="text-sm font-semibold text-slate-900">
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
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                    Payment history appears here after membership activation and billing sync.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            {isPartnerOwner ? (
              <section className={`${dashboardSubtlePanelClassName} p-5`}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
                  Seat Summary
                </h3>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <span>Included seats</span>
                    <span className="font-medium text-slate-900">
                      {partnerTeamSummary?.includedSeats ?? 5}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Used seats</span>
                    <span className="font-medium text-slate-900">
                      {partnerTeamSummary?.usedSeats ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Remaining seats</span>
                    <span className="font-medium text-slate-900">
                      {partnerTeamSummary?.remainingSeats ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Additional seat price</span>
                    <span className="font-medium text-slate-900">
                      ${partnerSeatPrice}
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Invoices & Support
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Need an invoice copy or billing help? Use the support workflow and the team will follow up from the existing contact channel.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  disabled
                  className={dashboardSecondaryButtonClassName}
                >
                  <FileText className="h-4 w-4" />
                  Download Latest Invoice
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={dashboardPrimaryButtonClassName}
                >
                  Contact Billing Support
                </button>
              </div>
            </section>
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
