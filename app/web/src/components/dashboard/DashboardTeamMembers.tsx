import { SectionCard, SectionHeader } from "@/shared/components/DashboardShared";
import { TeamMembersPanel } from "@/components/dashboard/TeamMembersPanel";

export function DashboardTeamMembers({
  isPartnerOwner,
}: {
  isPartnerOwner: boolean;
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          title="Team Members"
        />

        <div className="mt-6">
          <TeamMembersPanel enabled={isPartnerOwner} />
        </div>
      </SectionCard>
    </div>
  );
}
