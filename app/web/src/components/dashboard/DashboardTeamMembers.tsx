import { SectionCard, SectionHeader } from "@/components/dashboard/DashboardShared";
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
          eyebrow="Team Members"
          title="Partner team management"
          description="Invite specialists, review seat usage, and manage partner team access without changing existing partner logic."
        />

        <div className="mt-6">
          <TeamMembersPanel enabled={isPartnerOwner} />
        </div>
      </SectionCard>
    </div>
  );
}
