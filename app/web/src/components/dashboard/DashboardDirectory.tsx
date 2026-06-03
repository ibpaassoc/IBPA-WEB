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
      <SectionCard className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 md:px-7">
          <SectionHeader
            eyebrow="Member Directory"
            title="Networking and collaborations"
            description="Search active members, filter by level, country, and specialization, and open public-ready profile previews."
          />
        </div>

        <MembersDirectory
          locale="en"
          items={directoryMembers}
          mode="full"
          surface="dashboard"
        />
      </SectionCard>
    </div>
  );
}
