"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord, MemberTab } from "../types/members-admin.types";
import { MemberExpandedPanel } from "./MemberExpandedPanel";

type Props = {
  member: AdminMemberRecord;
  /** Full record (bio, services, portfolio) fetched when the row is expanded. */
  detail?: AdminMemberRecord | null;
  isOpen: boolean;
  isLoadingDetail: boolean;
  activeTab: MemberTab;
  selectedCategory: string;
  busyAction: string | null;
  onToggle: (member: AdminMemberRecord, tab?: MemberTab) => void;
  onTabChange: (tab: MemberTab) => void;
  onCategoryChange: (value: string) => void;
  onSaveCategory: () => void;
  onDeleteMembership: () => void;
  onIssueCertificate: (url: string, metadata?: { fileKey?: string | null }) => void;
  onResendCertificate: () => void;
  onRemoveCertificate: () => void;
};

export function MemberExpandableRow({
  activeTab,
  busyAction,
  detail,
  isLoadingDetail,
  isOpen,
  member,
  onCategoryChange,
  onDeleteMembership,
  onIssueCertificate,
  onRemoveCertificate,
  onResendCertificate,
  onSaveCategory,
  onTabChange,
  onToggle,
  selectedCategory,
}: Props) {
  return (
    <Collapsible.Root
      className={cn(
        "overflow-hidden border-b border-[#D7E5F4] bg-white transition-colors",
        isOpen && "bg-[#F6FAFF]",
      )}
      open={isOpen}
    >
      <div
        className={cn(
          "grid min-h-[68px] grid-cols-[minmax(0,1fr)_150px_110px_150px_44px] items-center gap-4 px-5 transition-colors",
          isOpen ? "bg-[#F4F9FF]" : "hover:bg-[#F8FBFF]",
        )}
      >
        <button
          className="flex min-w-0 items-center gap-4 text-left"
          onClick={() => onToggle(member)}
          type="button"
        >
          <Avatar className="size-10 shrink-0 border border-[#D6E3F2] shadow-sm">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#EEF6FF] text-xs font-semibold text-[#1F5D8F]">
              {initialsFromName(member.userName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#10203B]">
              {member.userName}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#6C7F95]">{member.email}</p>
          </div>
        </button>

        <div className="hidden justify-start md:flex">
          <AdminStatusBadge tone={member.hasCertificate ? "success" : "neutral"}>
            {member.hasCertificate ? "Issued" : "Not issued"}
          </AdminStatusBadge>
        </div>

        <p className="hidden truncate text-xs font-medium text-[#6C7F95] md:block">
          {member.expiryLabel}
        </p>

        <div className="hidden justify-start lg:flex">
          <AdminStatusBadge tone="neutral">
            {member.cardName || member.membershipCategory || "Uncategorized"}
          </AdminStatusBadge>
        </div>

        <button
          className="flex size-9 items-center justify-center rounded-full border border-[#D7E5F4] bg-white text-[#55708D] shadow-sm transition hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
          onClick={() => onToggle(member)}
          type="button"
        >
          <ChevronRight
            className={cn("size-4 transition-transform duration-200", isOpen && "rotate-90")}
          />
        </button>
      </div>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_220ms_ease]">
        <div className="border-t border-[#D7E5F4] bg-[#F6FAFF] p-5">
          {isLoadingDetail ? (
            <div className="rounded-[28px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-4 h-24 w-full" />
              <Skeleton className="mt-3 h-16 w-full" />
            </div>
          ) : (
            <MemberExpandedPanel
              activeTab={activeTab}
              busyAction={busyAction}
              member={detail ?? member}
              onCategoryChange={onCategoryChange}
              onDeleteMembership={onDeleteMembership}
              onIssueCertificate={onIssueCertificate}
              onRemoveCertificate={onRemoveCertificate}
              onResendCertificate={onResendCertificate}
              onSaveCategory={onSaveCategory}
              onTabChange={onTabChange}
              selectedCategory={selectedCategory}
            />
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
