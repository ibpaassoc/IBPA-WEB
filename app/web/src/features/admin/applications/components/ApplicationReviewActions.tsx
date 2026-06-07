"use client";

import { CheckCircle2, ExternalLink, Loader2, RefreshCw, ShieldAlert, Trash2, XCircle } from "lucide-react";

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
    record.kind === "partner" ||
    memberStatus === "pending" ||
    memberStatus === "review";
  const canResend = record.kind === "member" && memberStatus === "approved";
  const isRejected =
    memberStatus === "rejected" || partnerApplication?.status === "REJECTED";

  return (
    <div className="flex flex-col gap-2">
      {canReview && onReview ? (
        <Button
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

      {canApprove ? (
        <Button disabled={isBusy} onClick={onApprove} type="button">
          {busyAction === "approve" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <CheckCircle2 data-icon="inline-start" />
          )}
          Approve application
        </Button>
      ) : null}

      {!isRejected ? (
        <Button
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

      {canResend && onResendPaymentLink ? (
        <Button
          disabled={isBusy}
          onClick={onResendPaymentLink}
          type="button"
          variant="secondary"
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
        <Button asChild type="button" variant="outline">
          <a href={memberApplication.checkoutUrl} rel="noreferrer" target="_blank">
            <ExternalLink data-icon="inline-start" />
            Open payment link
          </a>
        </Button>
      ) : null}

      <Button
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
  );
}
