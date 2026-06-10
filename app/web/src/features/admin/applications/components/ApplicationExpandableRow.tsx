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
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#D7E5F4] bg-[#EEF6FF] text-xs font-semibold text-[#1F5D8F]">
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
          "flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors",
          isOpen ? "bg-[#F4F9FF]" : "hover:bg-[#F8FBFF]",
        )}
      >
        <ApplicantInitials name={record.applicantName} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#10203B]">{record.applicantName}</p>
          <p className="truncate text-xs text-[#6C7F95]">{record.applicantEmail}</p>
        </div>

        <span className="hidden w-28 shrink-0 text-xs text-[#6C7F95] sm:block">
          {record.applicantType}
        </span>

        <span className="hidden shrink-0 sm:block">
          <ApplicationCombinedStatus record={record} />
        </span>

        <span className="hidden w-24 shrink-0 text-right text-xs text-[#6C7F95] lg:block">
          {formatAdminDate(record.submittedAt)}
        </span>

        <span className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#D7E5F4] bg-white text-[#55708D]">
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-200",
              isOpen && "rotate-90 text-[#1F5D8F]",
            )}
          />
        </span>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_200ms_ease]">
        <div className="border-t border-[#D7E5F4] bg-[#F6FAFF] p-5">
          {isLoadingDetail ? (
            <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-5">
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
