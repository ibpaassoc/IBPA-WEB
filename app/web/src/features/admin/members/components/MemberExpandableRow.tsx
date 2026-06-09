"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { Award, ChevronRight, ShieldCheck, User } from "lucide-react";

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

const TAB_BUTTONS: { tab: MemberTab; icon: React.ElementType; label: string }[] = [
  { icon: User, label: "Profile", tab: "profile" },
  { icon: ShieldCheck, label: "Membership", tab: "membership" },
  { icon: Award, label: "Certificate", tab: "certificate" },
];

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
    // Controlled externally — no Collapsible.Trigger needed
    <Collapsible.Root open={isOpen}>
      {/* Row — plain div so tab buttons aren't nested inside a button */}
      <div
        className={cn(
          "flex w-full items-center gap-4 px-5 py-3.5 transition-colors",
          isOpen ? "bg-secondary/50" : "hover:bg-secondary/30",
        )}
      >
        {/* Clickable left area: avatar + name/email */}
        <button
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
          onClick={() => onToggle(member)}
          type="button"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initialsFromName(member.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{member.userName}</p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
        </button>

        {/* Membership badge */}
        <span className="hidden shrink-0 sm:block">
          <AdminStatusBadge tone="neutral">
            {member.membershipCategory || "Uncategorized"}
          </AdminStatusBadge>
        </span>

        {/* Tab quick-jump buttons — standalone, outside any trigger */}
        <div className="hidden shrink-0 items-center gap-1 lg:flex">
          {TAB_BUTTONS.map(({ icon: Icon, label, tab }) => (
            <button
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                isOpen && activeTab === tab
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground",
              )}
              key={tab}
              onClick={() => onToggle(member, tab)}
              type="button"
            >
              <Icon className="size-3 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Chevron toggle */}
        <button
          className="ml-1 cursor-pointer rounded p-0.5"
          onClick={() => onToggle(member)}
          type="button"
        >
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90",
            )}
          />
        </button>
      </div>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_200ms_ease]">
        <div className="border-t border-border bg-background/50 p-6">
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
