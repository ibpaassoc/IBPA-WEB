"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { DashboardProfile } from "@/components/dashboard/DashboardProfile";
import { SectionCard, dashboardStandalonePageContainerClassName } from "@/shared/components/DashboardShared";
import { useOwnedDashboardProfile } from "@/hooks/dashboard/useOwnedDashboardProfile";
import {
  getProfileLocation,
  getProfileSpecializationDisplay,
} from "@/lib/profile-record";

function getFullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "IBPA Member";
}

export default function PreviewProfilePage() {
  const {
    profile,
    accessBlocked,
    accessBlockedMessage,
    loading,
  } = useOwnedDashboardProfile();

  if (accessBlocked) {
    return (
      <main className={dashboardStandalonePageContainerClassName}>
        <SectionCard className="max-w-4xl">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
              Profile preview
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#10203B]">
              Preview is unavailable
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              {accessBlockedMessage ||
                "Your profile preview is available after dashboard access is active."}
            </p>
          </div>
        </SectionCard>
      </main>
    );
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4C7D9D]" />
      </div>
    );
  }

  return (
    <main className={dashboardStandalonePageContainerClassName}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/profile/edit"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#10203B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Edit Profile
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#10203B]"
          >
            Back to Dashboard
          </Link>
        </div>

        <DashboardProfile
          isTeamMemberDashboard={false}
          teamMemberAccess={null}
          profileHeroImage={profile.imageUrl || null}
          fullName={getFullName(profile.firstName, profile.lastName)}
          statusSummary={{ label: "", tone: "active" }}
          username=""
          locationDisplay={getProfileLocation(profile)}
          specializationDisplay={getProfileSpecializationDisplay(profile)}
          instagramUrl={profile.instagramUrl || null}
          websiteUrl={profile.websiteUrl || null}
          publicProfileHref={null}
          mergedProfileData={profile}
          achievementsSummary={profile.achievements || ""}
          membershipExpiresDisplay=""
          memberIdDisplay=""
          membershipCategoryLabel=""
          snapshotItems={[]}
        />
      </div>
    </main>
  );
}
