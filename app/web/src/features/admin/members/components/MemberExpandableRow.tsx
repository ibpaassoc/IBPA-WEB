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

const TAB_ACTIONS: { tab: MemberTab; icon: React.ElementType; label: string }[] = [
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
    <Collapsible.Root onOpenChange={() => onToggle(member)} open={isOpen}>
      <Collapsible.Trigger
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors",
            isOpen ? "bg-secondary/60" : "hover:bg-secondary/40",
          )}
          onClick={() => onToggle(member)}
          role="button"
          tabIndex={0}
        >
          {/* Avatar */}
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="text-xs font-semibold">
              {initialsFromName(member.userName)}
            </AvatarFallback>
          </Avatar>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{member.userName}</p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>

          {/* Membership badge */}
          <span className="hidden shrink-0 sm:block">
            <AdminStatusBadge tone="neutral">
              {member.membershipCategory || "Uncategorized"}
            </AdminStatusBadge>
          </span>

          {/* Quick tab buttons */}
          <div className="hidden shrink-0 items-center gap-1 lg:flex" onClick={(e) => e.stopPropagation()}>
            {TAB_ACTIONS.map(({ icon: Icon, label, tab }) => (
              <button
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  activeTab === tab && isOpen
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground",
                )}
                key={tab}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(member, tab);
                }}
                type="button"
              >
                <Icon className="size-3" />
                {label}
              </button>
            ))}
          </div>

          <ChevronRight
            className={cn(
              "ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90",
            )}
          />
        </div>
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
