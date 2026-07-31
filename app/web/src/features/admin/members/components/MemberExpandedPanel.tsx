"use client";

import { cn } from "@/lib/utils";

import { AdminTeamMemberList } from "../../teams/components/AdminTeamMemberList";
import { isOrganizationMember } from "../server/members-admin.service";
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
  const hasTeam = isOrganizationMember(member);
  const tabs = hasTeam ? [...TABS, { id: "team" as const, label: "Team" }] : TABS;
  const effectiveTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : "profile";
  const activeIndex = Math.max(tabs.findIndex((tab) => tab.id === effectiveTab), 0);

  return (
    <div className="rounded-[30px] border border-[#CFE0F3] bg-white p-4 shadow-[0_18px_50px_rgba(15,46,83,0.07)]">
      <div className="relative mb-5 grid rounded-full border border-[#D7E5F4] bg-[#EEF4FB] p-1">
        <div
          className={cn(
            "absolute bottom-1 top-1 rounded-full bg-white shadow-sm ring-1 ring-[#D7E5F4] transition-transform duration-300 ease-out",
          )}
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
            width: `calc((100% - 8px) / ${tabs.length})`,
          }}
        />

        <div
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => (
            <button
              className={cn(
                "z-10 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                effectiveTab === tab.id ? "text-[#1F5D8F]" : "text-[#667B94] hover:text-[#10203B]",
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

      {effectiveTab === "profile" ? (
        <MemberProfileTab member={member} />
      ) : effectiveTab === "membership" ? (
        <MemberMembershipTab
          busyAction={busyAction}
          member={member}
          onCategoryChange={onCategoryChange}
          onDeleteMembership={onDeleteMembership}
          onSaveCategory={onSaveCategory}
          selectedCategory={selectedCategory}
        />
      ) : effectiveTab === "certificate" ? (
        <MemberCertificateTab
          busyAction={busyAction}
          member={member}
          onIssueCertificate={onIssueCertificate}
          onRemoveCertificate={onRemoveCertificate}
          onResendCertificate={onResendCertificate}
        />
      ) : (
        <AdminTeamMemberList key={member.id} ownerOrderId={member.id} />
      )}
    </div>
  );
}
