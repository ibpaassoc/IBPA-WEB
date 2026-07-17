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
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  onReview?: (requestedChanges: string) => Promise<boolean>;
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
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [requestedChanges, setRequestedChanges] = useState("");
  const isBusy = Boolean(busyAction);
  const memberStatus = memberApplication?.status;
  const canReview = record.kind === "member" && (memberStatus === "pending" || memberStatus === "review");
  const isAlreadyInReview = memberStatus === "review";
  const canApprove =
    record.kind === "partner" || memberStatus === "pending" || memberStatus === "review";
  const canResend = record.kind === "member" && memberStatus === "approved";
  const isRejected =
    memberStatus === "rejected" || partnerApplication?.status === "REJECTED";

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
          Primary action
        </p>

        {canApprove ? (
          <Button
            className="h-11 w-full rounded-2xl bg-[#1F5D8F] text-white hover:bg-[#10203B]"
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
          <p className="rounded-2xl border border-dashed border-[#CFE0F3] bg-white px-4 py-3 text-sm text-[#6C7F95]">
            No primary action available.
          </p>
        )}
      </div>

      <div className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
          Secondary actions
        </p>

        <div className="grid gap-2">
          {canReview && onReview ? (
            <>
              <Button
                className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
                disabled={isBusy}
                onClick={() => setIsReviewDialogOpen(true)}
                type="button"
                variant="outline"
              >
                <ShieldAlert data-icon="inline-start" />
                {isAlreadyInReview ? "Send updated edit request" : "Send to additional review"}
              </Button>

              <Dialog
                onOpenChange={(open) => {
                  setIsReviewDialogOpen(open);
                  if (!open && busyAction !== "review") setRequestedChanges("");
                }}
                open={isReviewDialogOpen}
              >
                <DialogContent className="max-w-lg rounded-[24px]">
                  <DialogTitle className="text-lg font-semibold text-[#10203B]">
                    Request application changes
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-[#6C7F95]">
                    Tell the applicant exactly what needs to be updated. They will receive these notes and a secure link to edit their complete application.
                  </DialogDescription>
                  <Textarea
                    className="min-h-36 rounded-2xl border-[#D7E5F4] p-3"
                    maxLength={5000}
                    onChange={(event) => setRequestedChanges(event.target.value)}
                    placeholder="For example: Please upload your current certification and add the dates for your professional training."
                    value={requestedChanges}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      disabled={busyAction === "review"}
                      onClick={() => setIsReviewDialogOpen(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={busyAction === "review" || requestedChanges.trim().length < 3}
                      onClick={() => {
                        void onReview(requestedChanges.trim()).then((succeeded) => {
                          if (!succeeded) return;
                          setRequestedChanges("");
                          setIsReviewDialogOpen(false);
                        });
                      }}
                      type="button"
                    >
                      {busyAction === "review" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                      Send edit request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : null}

          {canResend && onResendPaymentLink ? (
            <Button
              className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
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
              className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
              type="button"
              variant="outline"
            >
              <a href={memberApplication.checkoutUrl} rel="noreferrer" target="_blank">
                <ExternalLink data-icon="inline-start" />
                Open payment link
              </a>
            </Button>
          ) : null}

          {!canReview && !canResend && !memberApplication?.checkoutUrl ? (
            <p className="rounded-2xl border border-dashed border-[#CFE0F3] bg-white px-4 py-2.5 text-xs text-[#8AA2BD]">
              No secondary actions available.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[22px] border border-[#F2C7C7] bg-[#FFF5F5] p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#B42318]">
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
            className="h-10 rounded-2xl text-[#B42318] hover:bg-[#FFE5E5] hover:text-[#8B1A12]"
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
