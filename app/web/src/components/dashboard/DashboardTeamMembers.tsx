import { TeamMembersPanel } from "@/components/dashboard/TeamMembersPanel";

export function DashboardTeamMembers({
  isPartnerOwner,
}: {
  isPartnerOwner: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#10203B]">
          Team Members
        </h1>
      </div>

      <TeamMembersPanel enabled={isPartnerOwner} />
    </div>
  );
}
