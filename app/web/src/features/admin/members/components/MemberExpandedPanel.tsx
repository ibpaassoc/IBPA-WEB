"use client";

import { cn } from "@/lib/utils";

import type { AdminMemberRecord, MemberTab } from "../types/members-admin.types";
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
    <div className="rounded-[30px] border border-[#CFE0F3] bg-white p-4 shadow-[0_18px_50px_rgba(15,46,83,0.07)]">
      <div className="relative mb-5 grid rounded-full border border-[#D7E5F4] bg-[#EEF4FB] p-1">
        <div
          className={cn(
            "absolute bottom-1 top-1 w-[calc((100%-8px)/3)] rounded-full bg-white shadow-sm ring-1 ring-[#D7E5F4] transition-transform duration-300 ease-out",
            activeTab === "profile" && "translate-x-0",
            activeTab === "membership" && "translate-x-full",
            activeTab === "certificate" && "translate-x-[200%]",
          )}
        />

        <div className="relative grid grid-cols-3">
          {TABS.map((tab) => (
            <button
              className={cn(
                "z-10 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                activeTab === tab.id ? "text-[#1F5D8F]" : "text-[#667B94] hover:text-[#10203B]",
              )}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
  );
}
