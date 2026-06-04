import { SectionCard, SectionHeader } from "@/components/dashboard/DashboardShared";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import type { PublicMember } from "@/lib/public-members";

export function DashboardDirectory({
  directoryMembers,
}: {
  directoryMembers: PublicMember[];
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader title="Member Directory" />

        <div className="mt-6">
          <MembersDirectory
            locale="en"
            items={directoryMembers}
            mode="full"
            surface="dashboard"
            showIntro={false}
          />
        </div>
      </SectionCard>
    </div>
  );
}
