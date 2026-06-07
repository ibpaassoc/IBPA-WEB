import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminProfileRecord } from "../types/profile-admin.types";

type ProfileSummaryCardProps = {
  profile: AdminProfileRecord;
};

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback>{initialsFromName(profile.userName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">{profile.userName}</h3>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <AdminStatusBadge tone="info">{profile.cardName || "Member"}</AdminStatusBadge>
        <AdminStatusBadge tone={profile.statusTone}>{profile.completionLabel}</AdminStatusBadge>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Profile completion</span>
          <span>{profile.completionScore}%</span>
        </div>
        <Progress value={profile.completionScore} />
      </div>
    </div>
  );
}
