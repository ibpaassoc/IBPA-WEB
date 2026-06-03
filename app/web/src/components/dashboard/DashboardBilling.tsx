import Link from "next/link";
import { CreditCard, FileText } from "lucide-react";

import { SectionCard, SectionHeader } from "@/components/dashboard/DashboardShared";
import { formatStatusLabel, getMembershipAmount } from "@/lib/dashboard-cabinet";
import type { Certificate, PartnerTeamSummary } from "@/components/dashboard/dashboard-types";

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
  memberIdDisplay,
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
  memberIdDisplay: string;
  partnerSeatPrice: number;
  setActiveTab: (tab: "support") => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Billing & Membership"
          title={isPartnerOwner ? "Partner membership control" : "Membership billing"}
          description="Plan details, expiration timeline, renewal actions, payment history, and invoice-ready structure."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center gap-2 rounded-full bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
              >
                Renew Membership
              </Link>

              <Link
                href="/membership"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
              >
                Change Plan
              </Link>
            </div>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Membership type
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">
                    {membershipCategoryLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Price
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">
                    {isPartnerOwner
                      ? `${partnerTeamSummary?.includedSeats ?? 5} included seats`
                      : getMembershipAmount(primaryCertificate?.membershipCategory)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Expiration date
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">
                    {membershipExpiresDisplay}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">
                    {statusSummary.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                    Payment history
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Existing membership payment records connected to this account.
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

              <div className="mt-5 space-y-3">
                {billingEntries.length > 0 ? (
                  billingEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-4 rounded-2xl bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F1F8] text-[#4C7D9D]">
                          <CreditCard className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-[#10203B]">
                            {entry.id}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {entry.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#10203B]">
                            {entry.amount}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                            {formatStatusLabel(entry.status, "Pending")}
                          </p>
                        </div>

                        {entry.certificateUrl ? (
                          <a
                            href={entry.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                          >
                            Download file
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-400"
                          >
                            Invoice pending
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                    Payment history appears here after membership activation and billing sync.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#10203B] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Membership record
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/65">Member ID</span>
                  <span className="text-sm font-medium">{memberIdDisplay}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/65">Type</span>
                  <span className="text-sm font-medium">
                    {membershipCategoryLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/65">Expiry</span>
                  <span className="text-sm font-medium">
                    {membershipExpiresDisplay}
                  </span>
                </div>

                {isPartnerOwner ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/65">Additional seat</span>
                    <span className="text-sm font-medium">${partnerSeatPrice}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                Invoices
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Invoice download is structured in the UI, but actual invoice files depend on the current payment sync. If a file is missing, request a copy from support.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400"
                >
                  <FileText className="h-4 w-4" />
                  Download latest invoice
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                >
                  Contact billing support
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
