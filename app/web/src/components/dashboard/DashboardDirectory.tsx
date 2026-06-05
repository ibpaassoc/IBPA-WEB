import { MembersDirectory } from "@/components/members/MembersDirectory";
import type { PublicMember } from "@/lib/public-members";
import { useI18n } from "@/lib/i18n";

export function DashboardDirectory({
  directoryMembers,
}: {
  directoryMembers: PublicMember[];
}) {
  const { locale } = useI18n();

  return (
    <div className="space-y-6">
      <MembersDirectory
        locale={locale}
        items={directoryMembers}
        mode="full"
        surface="dashboard"
        showIntro={false}
      />
    </div>
  );
}
