"use client";

import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  AdminApplicationRecord,
  MemberApplicationDetail,
  PartnerApplicationDetail,
} from "../types/application-admin.types";

type ApplicationReviewActionsProps = {
  record: AdminApplicationRecord;
  memberApplication?: MemberApplicationDetail | null;
  partnerApplication?: PartnerApplicationDetail | null;
  busyAction: string | null;
  onApprove: () => void;
  onReject: () => void;
  onReview?: () => void;
  onResendPaymentLink?: () => void;
  onDelete: () => void;
};

export function ApplicationReviewActions({
  busyAction,
  memberApplication,
  onApprove,
  onDelete,
  onReject,
  onResendPaymentLink,
  onReview,
  partnerApplication,
  record,
}: ApplicationReviewActionsProps) {
  const isBusy = Boolean(busyAction);
  const memberStatus = memberApplication?.status;
  const canReview = record.kind === "member" && memberStatus === "pending";
  const canApprove =
    record.kind === "partner" || memberStatus === "pending" || memberStatus === "review";
  const canResend = record.kind === "member" && memberStatus === "approved";
  const isRejected =
    memberStatus === "rejected" || partnerApplication?.status === "REJECTED";

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[#D9E4F2] bg-white/75 p-3 shadow-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8AA2BD]">
          Primary action
        </p>

        {canApprove ? (
          <Button
            className="h-11 w-full rounded-2xl bg-[#0B1F44] text-white hover:bg-[#123C7A]"
            disabled={isBusy}
            onClick={onApprove}
            type="button"
          >
            {busyAction === "approve" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <CheckCircle2 data-icon="inline-start" />
            )}
            Approve application
          </Button>
        ) : (
          <div className="rounded-2xl bg-[#F7FAFE] px-4 py-3 text-sm text-[#6B7C93]">
            No primary action available.
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-[#D9E4F2] bg-white/75 p-3 shadow-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8AA2BD]">
          Secondary actions
        </p>

        <div className="grid gap-2">
          {canReview && onReview ? (
            <Button
              className="h-10 rounded-2xl border-[#D9E4F2] bg-[#F7FAFE] text-[#21466D] hover:bg-white"
              disabled={isBusy}
              onClick={onReview}
              type="button"
              variant="outline"
            >
              {busyAction === "review" ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <ShieldAlert data-icon="inline-start" />
              )}
              Send to additional review
            </Button>
          ) : null}

          {canResend && onResendPaymentLink ? (
            <Button
              className="h-10 rounded-2xl border-[#D9E4F2] bg-[#F7FAFE] text-[#21466D] hover:bg-white"
              disabled={isBusy}
              onClick={onResendPaymentLink}
              type="button"
              variant="outline"
            >
              {busyAction === "resend" ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              Resend payment link
            </Button>
          ) : null}

          {memberApplication?.checkoutUrl ? (
            <Button
              asChild
              className="h-10 rounded-2xl border-[#D9E4F2] bg-[#F7FAFE] text-[#21466D] hover:bg-white"
              type="button"
              variant="outline"
            >
              <a href={memberApplication.checkoutUrl} rel="noreferrer" target="_blank">
                <ExternalLink data-icon="inline-start" />
                Open payment link
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[24px] border border-red-100 bg-red-50/60 p-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-red-500">
          Danger zone
        </p>

        <div className="grid gap-2">
          {!isRejected ? (
            <Button
              className="h-10 rounded-2xl"
              disabled={isBusy}
              onClick={onReject}
              type="button"
              variant="destructive"
            >
              {busyAction === "reject" ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <XCircle data-icon="inline-start" />
              )}
              Reject application
            </Button>
          ) : null}

          <Button
            className="h-10 rounded-2xl text-red-600 hover:bg-red-100 hover:text-red-700"
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
            Delete record
          </Button>
        </div>
      </div>
    </div>
  );
}
