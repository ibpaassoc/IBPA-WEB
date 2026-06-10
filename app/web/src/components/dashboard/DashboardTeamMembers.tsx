import { TeamMembersPanel } from "@/components/dashboard/TeamMembersPanel";
import { useI18n } from "@/lib/i18n";

export function DashboardTeamMembers({
  isPartnerOwner,
}: {
  isPartnerOwner: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#10203B]">
          {t.dashboard.teamMembers.title}
        </h1>
      </div>

      <TeamMembersPanel enabled={isPartnerOwner} />
    </div>
  );
}
