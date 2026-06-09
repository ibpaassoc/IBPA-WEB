"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type {
  AdminApplicationRecord,
  ApplicationAdditionalFile,
  MemberApplicationDetail,
  PartnerApplicationDetail,
} from "../types/application-admin.types";
import { ApplicationCombinedStatus } from "./ApplicationCombinedStatus";
import { ApplicationDetailsPanel } from "./ApplicationDetailsPanel";

type ApplicationExpandableRowProps = {
  record: AdminApplicationRecord;
  isOpen: boolean;
  isLoadingDetail: boolean;
  isLoadingFiles: boolean;
  memberDetail: MemberApplicationDetail | null;
  partnerDetail: PartnerApplicationDetail | null;
  additionalFiles: ApplicationAdditionalFile[];
  busyAction: string | null;
  selectedMembershipCategory: string;
  selectedPartnerTier: string;
  onToggle: (record: AdminApplicationRecord) => void;
  onApprove: () => void;
  onDelete: () => void;
  onDeleteAdditionalFile: (fileId: string) => void;
  onMembershipCategoryChange: (value: string) => void;
  onPartnerTierChange: (value: string) => void;
  onReject: () => void;
  onResendPaymentLink: () => void;
  onReview: () => void;
  onSaveMembershipCategory: () => void;
  onUploadAdditionalFile: (
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => void;
};

function ApplicantInitials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.slice(0, 2);
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
      {initials.toUpperCase()}
    </span>
  );
}

export function ApplicationExpandableRow({
  additionalFiles,
  busyAction,
  isLoadingDetail,
  isLoadingFiles,
  isOpen,
  memberDetail,
  onApprove,
  onDelete,
  onDeleteAdditionalFile,
  onMembershipCategoryChange,
  onPartnerTierChange,
  onReject,
  onResendPaymentLink,
  onReview,
  onSaveMembershipCategory,
  onToggle,
  onUploadAdditionalFile,
  partnerDetail,
  record,
  selectedMembershipCategory,
  selectedPartnerTier,
}: ApplicationExpandableRowProps) {
  return (
    <Collapsible.Root open={isOpen} onOpenChange={() => onToggle(record)}>
      <Collapsible.Trigger
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
          isOpen ? "bg-secondary/60" : "hover:bg-secondary/40",
        )}
      >
        <ApplicantInitials name={record.applicantName} />

        {/* Applicant */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{record.applicantName}</p>
          <p className="truncate text-xs text-muted-foreground">{record.applicantEmail}</p>
        </div>

        {/* Type */}
        <span className="hidden w-28 shrink-0 text-xs text-muted-foreground sm:block">
          {record.applicantType}
        </span>

        {/* Status */}
        <span className="hidden shrink-0 sm:block">
          <ApplicationCombinedStatus record={record} />
        </span>

        {/* Date */}
        <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground lg:block">
          {formatAdminDate(record.submittedAt)}
        </span>

        <ChevronRight
          className={cn(
            "ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_200ms_ease]">
        <div className="border-t border-border bg-background/50 p-4">
          {isLoadingDetail ? (
            <div className="flex flex-col gap-3 py-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <ApplicationDetailsPanel
              additionalFiles={additionalFiles}
              busyAction={busyAction}
              isLoading={false}
              isLoadingFiles={isLoadingFiles}
              layout="inline"
              memberApplication={memberDetail}
              onApprove={onApprove}
              onDelete={onDelete}
              onDeleteAdditionalFile={onDeleteAdditionalFile}
              onMembershipCategoryChange={onMembershipCategoryChange}
              onPartnerTierChange={onPartnerTierChange}
              onReject={onReject}
              onResendPaymentLink={onResendPaymentLink}
              onReview={onReview}
              onSaveMembershipCategory={onSaveMembershipCategory}
              onUploadAdditionalFile={onUploadAdditionalFile}
              partnerApplication={partnerDetail}
              record={record}
              selectedMembershipCategory={selectedMembershipCategory}
              selectedPartnerTier={selectedPartnerTier}
            />
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
