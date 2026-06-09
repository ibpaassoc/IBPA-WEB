"use client";

import { cn } from "@/lib/utils";

import type { MemberTab } from "../types/members-admin.types";
import type { AdminMemberRecord } from "../types/members-admin.types";
import { MemberCertificateTab } from "./MemberCertificateTab";
import { MemberMembershipTab } from "./MemberMembershipTab";
import { MemberProfileTab } from "./MemberProfileTab";

const TABS: { id: MemberTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "membership", label: "Membership" },
  { id: "certificate", label: "Certificate" },
];

type Props = {
  member: AdminMemberRecord;
  activeTab: MemberTab;
  selectedCategory: string;
  busyAction: string | null;
  onTabChange: (tab: MemberTab) => void;
  onCategoryChange: (value: string) => void;
  onSaveCategory: () => void;
  onDeleteMembership: () => void;
  onIssueCertificate: (url: string, metadata?: { fileKey?: string | null }) => void;
  onResendCertificate: () => void;
  onRemoveCertificate: () => void;
};

export function MemberExpandedPanel({
  activeTab,
  busyAction,
  member,
  onCategoryChange,
  onDeleteMembership,
  onIssueCertificate,
  onRemoveCertificate,
  onResendCertificate,
  onSaveCategory,
  onTabChange,
  selectedCategory,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border pb-0">
        {TABS.map((tab) => (
          <button
            className={cn(
              "px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-1">
        {activeTab === "profile" ? (
          <MemberProfileTab member={member} />
        ) : activeTab === "membership" ? (
          <MemberMembershipTab
            busyAction={busyAction}
            member={member}
            onCategoryChange={onCategoryChange}
            onDeleteMembership={onDeleteMembership}
            onSaveCategory={onSaveCategory}
            selectedCategory={selectedCategory}
          />
        ) : (
          <MemberCertificateTab
            busyAction={busyAction}
            member={member}
            onIssueCertificate={onIssueCertificate}
            onRemoveCertificate={onRemoveCertificate}
            onResendCertificate={onResendCertificate}
          />
        )}
      </div>
    </div>
  );
}
