import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Instagram,
  ShieldCheck,
} from "lucide-react";

import {
  SectionCard,
  SectionHeader,
  StatusPill,
} from "@/components/dashboard/DashboardShared";
import type { TeamMemberAccessInfo } from "@/components/dashboard/dashboard-types";
import type { CombinedProfileData } from "@/lib/application-profile";

export function DashboardProfile({
  isTeamMemberDashboard,
  teamMemberAccess,
  profileHeroImage,
  fullName,
  statusSummary,
  username,
  locationDisplay,
  specializationDisplay,
  instagramUrl,
  websiteUrl,
  publicProfileHref,
  mergedProfileData,
  certificateSummary,
  achievementsSummary,
  memberIdDisplay,
  membershipCategoryLabel,
  snapshotItems,
}: {
  isTeamMemberDashboard: boolean;
  teamMemberAccess: TeamMemberAccessInfo | null;
  profileHeroImage: string | null;
  fullName: string;
  statusSummary: {
    label: string;
    tone: "pending" | "active" | "verified";
  };
  username: string;
  locationDisplay: string;
  specializationDisplay: string;
  instagramUrl: string | null;
  websiteUrl: string | null;
  publicProfileHref: string | null;
  mergedProfileData: CombinedProfileData;
  certificateSummary: string;
  achievementsSummary: string;
  memberIdDisplay: string;
  membershipCategoryLabel: string;
  snapshotItems: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Profile"
          title="Professional profile"
          description="A clean public-facing identity card aligned with your application data, member verification, and current specialization."
          action={
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex items-center gap-2 rounded-full bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
            >
              Edit profile
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        {isTeamMemberDashboard ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-2 text-xl font-semibold text-[#10203B]">
                {teamMemberAccess?.role || "Team Member"}
              </p>
            </div>

            <div className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-sm text-slate-500">Partner business</p>
              <p className="mt-2 text-xl font-semibold text-[#10203B]">
                {teamMemberAccess?.partnerBusinessName || "Partner account"}
              </p>
            </div>

            <div className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-sm text-slate-500">Access</p>
              <p className="mt-2 text-xl font-semibold capitalize text-[#10203B]">
                {teamMemberAccess?.status || "Invited"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#dbe9f4] text-2xl font-semibold text-[#10203B]">
                  {profileHeroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileHeroImage}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill
                      label={statusSummary.label}
                      tone={statusSummary.tone}
                    />

                    <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F8F3] px-3 py-1 text-[11px] font-medium text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Verified IBPA Member
                    </span>
                  </div>

                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[#10203B]">
                    {fullName}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">@{username}</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Location
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">
                        {locationDisplay}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Specialization
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">
                        {specializationDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {instagramUrl ? (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        <Instagram className="h-4 w-4 text-[#4C7D9D]" />
                        Instagram
                      </a>
                    ) : null}

                    {websiteUrl ? (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        <Globe className="h-4 w-4 text-[#4C7D9D]" />
                        Website
                      </a>
                    ) : null}

                    {publicProfileHref ? (
                      <Link
                        href={publicProfileHref}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        <ExternalLink className="h-4 w-4 text-[#4C7D9D]" />
                        Public profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {mergedProfileData.bio ? (
                <div className="mt-6 rounded-3xl bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Bio
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {mergedProfileData.bio}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                  Professional info
                </p>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: "Years of experience",
                      value: mergedProfileData.experienceYears || "Not added yet",
                    },
                    {
                      label: "Education",
                      value: mergedProfileData.education || "Not added yet",
                    },
                    {
                      label: "Certificates",
                      value:
                        certificateSummary ||
                        "Certificate details appear here once added",
                    },
                    {
                      label: "Achievements",
                      value:
                        achievementsSummary ||
                        "Add awards, publications, or notable accomplishments",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-white px-4 py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#10203B]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                  Identity
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Member ID
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">
                      {memberIdDisplay}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Membership
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">
                      {membershipCategoryLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
          Snapshot
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshotItems.map((item) => (
            <div key={item.label} className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-[#10203B]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
