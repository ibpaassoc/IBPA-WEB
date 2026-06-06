"use client";

import { motion } from "motion/react";
import { ExternalLink, Globe, GraduationCap, Instagram, MapPin, Phone, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type {
  Certificate,
  TeamMemberAccessInfo,
} from "@/components/dashboard/dashboard-types";
import { ProfileServicesDisplay } from "@/components/dashboard/profile/ProfileServicesDisplay";
import {
  ProfileAvatarCircle,
  ProfileImageGrid,
  ProfilePanel,
} from "@/components/profile/ProfileDisplayShared";
import { useI18n } from "@/lib/i18n";
import type { ProfileRecordData } from "@/lib/profile-record";

function buildProfileUrl(href: string) {
  if (href.startsWith("http")) return href;
  if (typeof window === "undefined") return href;
  return `${window.location.origin}${href}`;
}

function formatExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        {icon ? <span className="text-[#2B5C99]">{icon}</span> : null}
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="break-words text-sm font-semibold leading-6 text-[#10203B]">
        {value}
      </p>
    </div>
  );
}

function ExpandableTextCard({
  label,
  icon,
  value,
  emptyLabel,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  emptyLabel: string;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const normalizedValue = value.trim();
  const displayValue = normalizedValue || emptyLabel;
  const isExpandable = normalizedValue.length > 160;

  return (
    <motion.article
      layout
      className="min-h-[190px] rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]"
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[#2B5C99]">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
      </div>

      <motion.div layout className="mt-3">
        <p
          className={`break-words text-sm leading-6 text-[#10203B] ${
            !expanded && isExpandable ? "line-clamp-5" : ""
          } ${normalizedValue ? "font-medium" : "text-slate-500"}`}
        >
          {displayValue}
        </p>
      </motion.div>

      {isExpandable ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 inline-flex items-center rounded-full border border-[#D4E0F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#21466D] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
        >
          {expanded ? t.dashboard.profile.showLess : t.dashboard.profile.seeAll}
        </button>
      ) : null}
    </motion.article>
  );
}

function ContactLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-white px-4 py-3 text-sm font-medium text-[#10203B] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
    >
      <span className="text-[#4C7D9D]">{icon}</span>
      {label}
    </a>
  );
}

export function DashboardProfile({
  isTeamMemberDashboard,
  teamMemberAccess,
  profileHeroImage,
  fullName,
  username,
  locationDisplay,
  specializationDisplay,
  instagramUrl,
  websiteUrl,
  publicProfileHref,
  mergedProfileData,
  achievementsSummary,
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
  mergedProfileData: ProfileRecordData;
  primaryCertificate?: Certificate;
  membershipExpiresDisplay: string;
  achievementsSummary: string;
  memberIdDisplay: string;
  membershipCategoryLabel: string;
  snapshotItems: {
    label: string;
    value: string;
  }[];
}) {
  void username;

  const { t } = useI18n();
  const dashboard = t.dashboard;

  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [fullName],
  );

  const galleryImages = useMemo(() => {
    const raw = Array.isArray(mergedProfileData.portfolioImages)
      ? mergedProfileData.portfolioImages
      : [];

    return raw
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
      .slice(0, 6);
  }, [mergedProfileData.portfolioImages]);

  const specializations = useMemo(
    () =>
      Array.isArray(mergedProfileData.specializations)
        ? mergedProfileData.specializations.filter(Boolean)
        : [],
    [mergedProfileData.specializations],
  );

  const biography = mergedProfileData.bio || "";
  const contribution = mergedProfileData.industryContribution || "";
  const education = mergedProfileData.education || "";
  const normalizedInstagramUrl = formatExternalUrl(
    instagramUrl || mergedProfileData.instagramUrl,
  );
  const normalizedWebsiteUrl = formatExternalUrl(
    websiteUrl || mergedProfileData.websiteUrl,
  );
  const phoneValue = mergedProfileData.phone?.trim() || "";
  const phoneHref = phoneValue ? `tel:${phoneValue}` : null;
  const locationParts = [
    mergedProfileData.city,
    mergedProfileData.state,
    mergedProfileData.country,
  ].filter((item): item is string => Boolean(item && item.trim()));

  if (isTeamMemberDashboard) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <ProfilePanel title={dashboard.profile.role}>
          <p className="text-sm font-semibold text-[#10203B]">
            {teamMemberAccess?.role || dashboard.profile.teamMember}
          </p>
        </ProfilePanel>

        <ProfilePanel title={dashboard.profile.partnerBusiness}>
          <p className="text-sm font-semibold text-[#10203B]">
            {teamMemberAccess?.partnerBusinessName ||
              dashboard.profile.partnerAccount}
          </p>
        </ProfilePanel>

        <ProfilePanel title={dashboard.profile.access}>
          <p className="text-sm font-semibold text-[#10203B]">
            {teamMemberAccess?.status || dashboard.profile.invited}
          </p>
        </ProfilePanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[32px] border border-[#D4E0F0] bg-white shadow-[0_22px_60px_rgba(11,31,68,0.10)]">
        <div className="h-36 bg-[radial-gradient(circle_at_20%_15%,rgba(43,92,153,0.42),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(96,165,250,0.34),transparent_36%),linear-gradient(135deg,#E7F0FC_0%,#D6E7FB_45%,#C3DBF8_100%)]" />

        <div className="px-6 pb-6">
          <div className="-mt-16 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <ProfileAvatarCircle
                imageUrl={profileHeroImage}
                alt={fullName}
                initials={initials}
                className="size-28"
              />

              <div className="pb-1">
                <h2 className="break-words text-3xl font-semibold tracking-tight text-[#10203B]">
                  {fullName}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {locationDisplay ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-[#4C7D9D]" />
                      {locationDisplay}
                    </span>
                  ) : null}

                  {specializationDisplay ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-1 text-[11px] font-semibold text-[#21466D]">
                      <Sparkles className="h-3.5 w-3.5 text-[#4C7D9D]" />
                      {specializationDisplay}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/profile/edit"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white px-4 text-sm font-medium text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
              >
                {dashboard.profile.editProfile}
              </Link>

              {publicProfileHref ? (
                <Link
                  href={publicProfileHref}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                  aria-label={dashboard.profile.openPublicProfile}
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}

              {normalizedInstagramUrl ? (
                <a
                  href={normalizedInstagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                  aria-label={dashboard.profile.openInstagram}
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}

              {normalizedWebsiteUrl ? (
                <a
                  href={normalizedWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                  aria-label={dashboard.profile.openWebsite}
                >
                  <Globe className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <ProfilePanel title={dashboard.profile.professionalBiography}>
              <p
                className={`text-sm leading-7 ${
                  biography ? "text-[#10203B]" : "text-slate-500"
                }`}
              >
                {biography || dashboard.profile.noBiography}
              </p>
            </ProfilePanel>

            <ProfileServicesDisplay services={mergedProfileData.services} />
          </div>
        </div>
      </section>

      <ProfilePanel title={dashboard.profile.professionalBiography}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <motion.article
            layout
            className="rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]"
          >
            <InfoItem
              label={dashboard.profile.yearsOfExperience}
              value={
                mergedProfileData.experienceYears ||
                dashboard.profile.notAddedYet
              }
              icon={<Sparkles className="h-4 w-4" />}
            />
          </motion.article>

          <ExpandableTextCard
            label={dashboard.profile.achievements}
            icon={<Trophy className="h-4 w-4" />}
            value={achievementsSummary}
            emptyLabel={dashboard.profile.noAchievements}
          />

          <ExpandableTextCard
            label={dashboard.profile.industryContribution}
            icon={<Globe className="h-4 w-4" />}
            value={contribution}
            emptyLabel={dashboard.profile.noContribution}
          />

          <ExpandableTextCard
            label={dashboard.profile.education}
            icon={<GraduationCap className="h-4 w-4" />}
            value={education}
            emptyLabel={dashboard.profile.noEducation}
          />
        </div>
      </ProfilePanel>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <ProfilePanel title={dashboard.profile.communityIdentity}>
            <div className="rounded-3xl border border-white/80 bg-[#F8FBFF] p-5 shadow-sm">
              <div className="space-y-5">
                <InfoItem
                  label={dashboard.overview.location}
                  value={locationParts.join(", ") || dashboard.profile.notAddedYet}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <InfoItem
                  label={dashboard.overview.specialty}
                  value={specializations.join(", ") || dashboard.profile.notAddedYet}
                  icon={<Sparkles className="h-4 w-4" />}
                />
                <InfoItem
                  label="Phone"
                  value={phoneValue || dashboard.profile.notAddedYet}
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>
            </div>
          </ProfilePanel>

          {(phoneHref || normalizedInstagramUrl || normalizedWebsiteUrl) ? (
            <ProfilePanel title="Recognition & links">
              <div className="flex flex-col gap-3">
                {phoneHref ? (
                  <ContactLink
                    href={phoneHref}
                    label={phoneValue}
                    icon={<Phone className="h-4 w-4" />}
                  />
                ) : null}
                {normalizedInstagramUrl ? (
                  <ContactLink
                    href={normalizedInstagramUrl}
                    label="Instagram"
                    icon={<Instagram className="h-4 w-4" />}
                  />
                ) : null}
                {normalizedWebsiteUrl ? (
                  <ContactLink
                    href={normalizedWebsiteUrl}
                    label="Website"
                    icon={<Globe className="h-4 w-4" />}
                  />
                ) : null}
              </div>
            </ProfilePanel>
          ) : null}
        </div>

        <ProfilePanel title={dashboard.profile.workGallery}>
          {galleryImages.length > 0 ? (
            <ProfileImageGrid
              images={galleryImages.map((image) => buildProfileUrl(image))}
              altBuilder={(index) =>
                dashboard.profile.galleryImageAlt(fullName, index + 1)
              }
            />
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-4 py-6 text-sm leading-6 text-slate-500">
              {dashboard.profile.galleryFallbackOne}
            </div>
          )}
        </ProfilePanel>
      </div>
    </div>
  );
}
