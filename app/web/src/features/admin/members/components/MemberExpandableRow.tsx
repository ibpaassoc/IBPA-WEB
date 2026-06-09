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
    <Collapsible.Root onOpenChange={() => onToggle(member)} open={isOpen}>
      <Collapsible.Trigger
        className={cn(
          "flex w-full cursor-pointer items-center gap-4 px-5 py-3.5 text-left transition-colors",
          isOpen ? "bg-secondary/50" : "hover:bg-secondary/30",
        )}
      >
        {/* Avatar */}
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={member.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initialsFromName(member.userName)}
          </AvatarFallback>
        </Avatar>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{member.userName}</p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>

        {/* Certificate status — medium screens */}
        <span className="hidden shrink-0 xl:block">
          <AdminStatusBadge tone={member.certStatusTone}>
            {member.certStatusLabel}
          </AdminStatusBadge>
        </span>

        {/* Expiry — large screens */}
        <span className="hidden shrink-0 lg:block">
          <AdminStatusBadge tone={member.expiryTone}>
            {member.expiryLabel}
          </AdminStatusBadge>
        </span>

        {/* Membership badge */}
        <span className="hidden shrink-0 sm:block">
          <AdminStatusBadge tone="neutral">
            {member.membershipCategory || "Uncategorized"}
          </AdminStatusBadge>
        </span>

        <ChevronRight
          className={cn(
            "ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_200ms_ease]">
        <div className="border-t border-border bg-background/50 p-4 pt-5">
          {isLoadingDetail ? (
            <div className="flex flex-col gap-3 py-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <MemberExpandedPanel
              activeTab={activeTab}
              busyAction={busyAction}
              member={member}
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
