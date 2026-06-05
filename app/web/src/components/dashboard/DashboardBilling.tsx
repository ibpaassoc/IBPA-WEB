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
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const membershipType = isPartnerOwner
    ? t.dashboard.billing.account
    : getMembershipAmount(primaryCertificate?.membershipCategory);

  const paymentTitle = isPartnerOwner
    ? t.dashboard.billing.partnerPaymentTitle
    : t.dashboard.billing.membershipPaymentTitle;

  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          title={t.dashboard.billing.title}
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/membership" className={dashboardPrimaryButtonClassName}>
                {t.dashboard.billing.renew}
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={dashboardSecondaryButtonClassName}
              >
                {t.dashboard.billing.support}
              </button>
            </div>
          }
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
              <article className={metricClassName}>
                <p className={labelClassName}>{t.dashboard.billing.plan}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {membershipCategoryLabel}
                </p>
              </article>

              <article className={metricClassName}>
                <p className={labelClassName}>{t.dashboard.billing.expires}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {membershipExpiresDisplay}
                </p>
              </article>

              <article className={metricClassName}>
                <p className={labelClassName}>{t.dashboard.billing.status}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {statusSummary.label}
                </p>
              </article>
            </div>

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                {t.dashboard.billing.paymentHistory}
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
                          {formatStatusLabel(
                            entry.status,
                            t.dashboard.statuses.pending,
                            t.dashboard.statuses,
                          )}
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                    {t.dashboard.billing.noPayments}
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
                {t.dashboard.billing.supportTitle}
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              {t.dashboard.billing.supportDescription}
            </p>

            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className={`mt-5 w-full ${dashboardPrimaryButtonClassName}`}
            >
              {t.dashboard.billing.contactSupport}
            </button>
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
