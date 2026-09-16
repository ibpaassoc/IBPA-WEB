"use client";

import { Loader2, Pencil, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminPromoCode } from "../types/promo-code-admin.types";

type PromoCodeCardProps = {
  promoCode: AdminPromoCode;
  busyAction: string | null;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8AA2BD]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[#10203B] tabular-nums">{value}</p>
    </div>
  );
}

/**
 * A linked coupon can fail in three different ways, each with a different fix.
 * Saying "missing" for all of them is wrong when the environment variable is
 * set and it is Stripe that is refusing the coupon.
 */
const discountCopy: Record<
  AdminPromoCode["discountStatus"],
  { badge: string | null; note: string | null }
> = {
  linked: { badge: null, note: null },
  rejected: {
    badge: "Coupon refused",
    note: "Stripe will not accept the linked coupon, so approving an application will not discount it.",
  },
  unlinked: {
    badge: "No coupon",
    note: "Link a Stripe coupon before applicants can use this code.",
  },
  unset: {
    badge: "Coupon not set",
    note: "The chosen environment variable has no value on this server, so approving an application will not discount it.",
  },
};

export function PromoCodeCard({
  busyAction,
  onDelete,
  onEdit,
  onToggle,
  promoCode,
}: PromoCodeCardProps) {
  const isBusy = Boolean(busyAction);
  const isLive = promoCode.enabled && promoCode.discountConfigured;
  const discount = discountCopy[promoCode.discountStatus] ?? discountCopy.unlinked;

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-[#F8FBFF]">
      <div className="grid md:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
        {/* Redemption stub: the word an applicant types, set as the code it is. */}
        <div className="border-b border-dashed border-[#C4D8EE] px-6 py-6 md:max-w-72 md:border-b-0 md:border-r">
          <p
            className={`break-words text-[17px] font-bold uppercase leading-snug tracking-[0.1em] ${
              isLive ? "text-[#10203B]" : "text-[#8AA2BD]"
            }`}
          >
            {promoCode.code}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone={isLive ? "success" : "neutral"}>
              {promoCode.enabled ? "Accepting" : "Turned off"}
            </AdminStatusBadge>

            {promoCode.enabled && discount.badge ? (
              <AdminStatusBadge tone="danger">
                <TriangleAlert className="size-3" />
                {discount.badge}
              </AdminStatusBadge>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-[-0.01em] text-[#10203B]">
                {promoCode.label}
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#6C7F95]">
                {promoCode.description || "No note shown to applicants."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8AA2BD]">
                Accept code
              </span>
              <button
                aria-label={`${promoCode.enabled ? "Stop accepting" : "Accept"} ${promoCode.code}`}
                aria-checked={promoCode.enabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  promoCode.enabled
                    ? "border-[#21466D] bg-[#21466D]"
                    : "border-[#C8D6E6] bg-[#E7EEF6]"
                }`}
                disabled={isBusy}
                onClick={() => onToggle(!promoCode.enabled)}
                role="switch"
                type="button"
              >
                <span
                  aria-hidden
                  className={`inline-block size-4.5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${
                    promoCode.enabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#E4EEF8] pt-4 sm:grid-cols-4">
            <Fact
              label="Stripe coupon"
              value={
                promoCode.discountEnvKey ? (
                  <span className={promoCode.discountConfigured ? "" : "text-[#B42318]"}>
                    {promoCode.discountEnvKey}
                  </span>
                ) : (
                  <span className="text-[#B42318]">Not linked</span>
                )
              }
            />
            <Fact label="Applications" value={promoCode.applicationCount.toLocaleString("en-US")} />
            <Fact label="Paid" value={promoCode.paidCount.toLocaleString("en-US")} />
            <Fact label="Updated" value={formatAdminDate(promoCode.updatedAt)} />
          </div>

          {discount.note ? (
            <div className="rounded-[18px] border border-[#F2C7C7] bg-[#FFF5F5] px-4 py-3">
              <p className="text-xs font-semibold leading-5 text-[#B42318]">{discount.note}</p>
              {/* Only a "rejected" message came from Stripe; the others are ours. */}
              {promoCode.discountStatus === "rejected" && promoCode.discountMessage ? (
                <p className="mt-1 break-words text-xs leading-5 text-[#8B4A44]">
                  Stripe says: {promoCode.discountMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-9 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
              disabled={isBusy}
              onClick={onEdit}
              type="button"
              variant="outline"
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>

            <Button
              className="h-9 rounded-2xl text-[#B42318] hover:bg-[#FFE5E5] hover:text-[#8B1A12]"
              disabled={isBusy}
              onClick={onDelete}
              type="button"
              variant="ghost"
            >
              {busyAction === "delete" ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              Delete
            </Button>

            {busyAction === "toggle" ? (
              <span className="flex items-center gap-2 text-xs text-[#6C7F95]">
                <Loader2 className="size-3.5 animate-spin" />
                Saving
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
