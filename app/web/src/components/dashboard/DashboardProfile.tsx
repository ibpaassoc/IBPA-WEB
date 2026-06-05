"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  Edit3,
  ExternalLink,
  Globe,
  GraduationCap,
  Instagram,
  MapPin,
  Sparkles,
  Trophy,
  Upload,
} from "lucide-react";

import { StatusPill } from "@/shared/components/DashboardShared";
import { ServicesSection } from "@/components/dashboard/profile/ServicesSection";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type {
  Certificate,
  TeamMemberAccessInfo,
} from "@/components/dashboard/dashboard-types";
import type { CombinedProfileData } from "@/lib/application-profile";

function buildProfileUrl(href: string) {
  if (href.startsWith("http")) return href;
  if (typeof window === "undefined") return href;
  return `${window.location.origin}${href}`;
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_18px_45px_rgba(11,31,68,0.08)] ${className}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#16386D]">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
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

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]">
      <div className="mb-3 text-[#2B5C99]">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold leading-7 text-[#10203B]">
        {value}
      </p>
    </div>
  );
}

function textValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item.trim() : typeof item === "number" ? String(item) : "",
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function formatDate(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [expanded, setExpanded] = useState(false);
  const normalizedValue = value.trim();
  const displayValue = normalizedValue || emptyLabel;
  const isExpandable = normalizedValue.length > 140;

  return (
    <motion.article
      layout
      className="flex h-full flex-col rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]"
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[#2B5C99]">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
      </div>

      <motion.div layout className="mt-3 flex-1">
        <p
          className={`break-words text-sm leading-6 text-[#10203B] ${
            !expanded && isExpandable ? "line-clamp-4" : ""
          } ${normalizedValue ? "font-medium" : "text-slate-500"}`}
        >
          {displayValue}
        </p>
      </motion.div>

      {isExpandable ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 inline-flex items-center rounded-full border border-[#D4E0F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#21466D] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
        >
          {expanded ? "Show less" : "See all"}
        </button>
      ) : null}
    </motion.article>
  );
}

function CertificatePreviewCard({
  certificate,
  fullName,
  membershipExpiresDisplay,
}: {
  certificate?: Certificate;
  fullName: string;
  membershipExpiresDisplay: string;
}) {
  const issuedAt = formatDate(certificate?.createdAt);
  const expiresAt =
    formatDate(certificate?.expiresAt) || membershipExpiresDisplay || "Pending";
  const isIssued =
    certificate?.status === "paid" || certificate?.status === "approved";

  return (
    <motion.article
      layout
      className="flex h-full flex-col rounded-[28px] border border-[#D4E0F0] bg-[radial-gradient(circle_at_top_left,rgba(111,162,212,0.18),transparent_28%),linear-gradient(180deg,#F7FBFF_0%,#FFFFFF_100%)] p-5 shadow-[0_18px_40px_rgba(11,31,68,0.07)]"
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#2B5C99]">
              <Award className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Official certificate
            </p>
          </div>

          <p className="mt-3 text-base font-semibold text-[#10203B]">
            IBPA Certificate
          </p>
          <p className="mt-1 text-sm text-slate-500">{fullName}</p>
        </div>

        <StatusPill
          label={isIssued ? "Verified" : "Pending"}
          tone={isIssued ? "verified" : "pending"}
        />
      </div>

      {certificate ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#DCE7F4] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Certificate ID
              </p>
              <p className="mt-2 text-sm font-semibold text-[#10203B]">
                {certificate.certNumber}
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCE7F4] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Valid through
              </p>
              <p className="mt-2 text-sm font-semibold text-[#10203B]">
                {expiresAt}
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCE7F4] bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Issued
              </p>
              <p className="mt-2 text-sm font-semibold text-[#10203B]">
                {issuedAt || "Pending review"}
              </p>
            </div>
          </div>

          {certificate.certificateUrl ? (
            <div className="mt-5">
              <a
                href={certificate.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#10203B] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open certificate
              </a>
            </div>
          ) : (
            <div className="mt-5 rounded-[22px] border border-dashed border-[#D4E0F0] bg-white/80 px-4 py-4 text-sm leading-6 text-slate-500">
              Your official certificate record is active. The downloadable file will appear here after it is uploaded.
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 rounded-[22px] border border-dashed border-[#D4E0F0] bg-white/80 px-4 py-4">
          <p className="text-sm font-medium text-[#10203B]">
            No IBPA certificate issued yet
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Once your official certificate is created, its status, issue date, and file link will appear here.
          </p>
        </div>
      )}
    </motion.article>
  );
}

function GallerySlot({ label }: { label: string }) {
  return (
    <div className="min-w-0">
      <div className="flex h-24 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-[#F5F9FF] text-[#2B5C99]">
        <Upload className="h-5 w-5" />
      </div>
      <p className="mt-2 truncate text-xs font-medium text-[#10203B]">
        {label}
      </p>
    </div>
  );
}

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
  primaryCertificate,
  membershipExpiresDisplay,
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

  const industry =
    snapshotItems.find((item) => item.label.toLowerCase() === "industry")
      ?.value || specializationDisplay;

  const galleryImages = useMemo(() => {
    const raw = mergedProfileData.applicationPayload?.portfolioImages;
    if (!Array.isArray(raw)) {
      return [] as string[];
    }

    return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6);
  }, [mergedProfileData.applicationPayload]);

  const profileServices = useMemo(
    () => (Array.isArray(mergedProfileData.services) ? mergedProfileData.services : []),
    [mergedProfileData.services],
  );

  const applicationPayload =
    mergedProfileData.applicationPayload &&
    typeof mergedProfileData.applicationPayload === "object" &&
    !Array.isArray(mergedProfileData.applicationPayload)
      ? mergedProfileData.applicationPayload
      : null;

  const biographySections = useMemo(
    () => [
      {
        key: "biography",
        label: "Biography",
        icon: <Sparkles className="h-4 w-4" />,
        value:
          mergedProfileData.bio || textValue(applicationPayload?.professionalDesc),
        emptyLabel: "No biography added yet.",
      },
      {
        key: "achievements",
        label: "Achievements",
        icon: <Trophy className="h-4 w-4" />,
        value: achievementsSummary,
        emptyLabel: "No achievements added yet.",
      },
      {
        key: "contribution",
        label: "Industry contribution",
        icon: <Globe className="h-4 w-4" />,
        value: textValue(applicationPayload?.contributionDesc),
        emptyLabel: "No contribution details added yet.",
      },
    ],
    [
      achievementsSummary,
      applicationPayload,
      mergedProfileData.bio,
    ],
  );
  const [biographyCard, achievementsCard, contributionCard] = biographySections;

  if (isTeamMemberDashboard) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Role">
          <p className="text-sm font-semibold text-[#10203B]">
            {teamMemberAccess?.role || "Team Member"}
          </p>
        </Panel>

        <Panel title="Partner business">
          <p className="text-sm font-semibold text-[#10203B]">
            {teamMemberAccess?.partnerBusinessName || "Partner account"}
          </p>
        </Panel>

        <Panel title="Access">
          <p className="text-sm font-semibold text-[#10203B]">
            {teamMemberAccess?.status || "Invited"}
          </p>
        </Panel>
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
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[linear-gradient(135deg,#D8E8FB_0%,#C7DCF7_100%)] text-2xl font-semibold text-[#10203B] shadow-[0_18px_35px_rgba(11,31,68,0.18)]">
                {profileHeroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileHeroImage}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="pb-1">
                <h2 className="break-words text-3xl font-semibold tracking-tight text-[#10203B]">
                  {fullName}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-slate-500">@{username}</p>
                  <StatusPill
                    label={statusSummary.label}
                    tone={statusSummary.tone}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/profile/edit"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                aria-label="Edit profile"
              >
                <Edit3 className="h-4 w-4" />
              </Link>

              {publicProfileHref ? (
                <Link
                  href={publicProfileHref}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                  aria-label="Open public profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}

              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                  aria-label="Open Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}

              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                  aria-label="Open website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Panel title="Location and specialization">
              <div className="space-y-3">
                <InfoItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={locationDisplay}
                />

                <InfoItem
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Specialization"
                  value={specializationDisplay}
                />
              </div>
            </Panel>
            <ServicesSection initialServices={profileServices} />
          </div>
        </div>
      </section>

      <Panel title="Professional biography">
        <div className="grid gap-4 rounded-3xl border border-[#D4E0F0] bg-white p-4 xl:grid-cols-3 xl:auto-rows-fr">
          <div className="h-full">
            <MetricCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Years of experience"
              value={mergedProfileData.experienceYears || "Not added yet"}
            />
          </div>

          <div className="h-full">
            <ExpandableTextCard
              label={biographyCard.label}
              icon={biographyCard.icon}
              value={biographyCard.value}
              emptyLabel={biographyCard.emptyLabel}
            />
          </div>

          <div className="h-full">
            <ExpandableTextCard
              label={achievementsCard.label}
              icon={achievementsCard.icon}
              value={achievementsCard.value}
              emptyLabel={achievementsCard.emptyLabel}
            />
          </div>

          <div className="h-full">
            <CertificatePreviewCard
              certificate={primaryCertificate}
              fullName={fullName}
              membershipExpiresDisplay={membershipExpiresDisplay}
            />
          </div>

          <div className="h-full">
            <ExpandableTextCard
              label={contributionCard.label}
              icon={contributionCard.icon}
              value={contributionCard.value}
              emptyLabel={contributionCard.emptyLabel}
            />
          </div>

          <div className="h-full">
            <ExpandableTextCard
              label="Education"
              icon={<GraduationCap className="h-4 w-4" />}
              value={mergedProfileData.education || ""}
              emptyLabel="No education details added yet."
            />
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel
          title="Community identity"
          className="bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(135deg,#F5F9FF_0%,#EAF2FD_100%)]"
        >
          <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm">
            <InfoItem label="Member ID" value={memberIdDisplay} />

            <div className="mt-5">
              <InfoItem label="Membership" value={membershipCategoryLabel} />
            </div>

            <div className="mt-5">
              <InfoItem label="Industry" value={industry} />
            </div>
          </div>
        </Panel>

        <Panel title="Work gallery">
          {galleryImages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {galleryImages.map((image, index) => (
                <a
                  key={`${image}-${index}`}
                  href={buildProfileUrl(image)}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-[24px] border border-[#D4E0F0] bg-[#F5F9FF]"
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${fullName} gallery image ${index + 1}`}
                    className="aspect-square w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <GallerySlot label="Featured Brow Work" />
              <GallerySlot label="Featured Lash Work" />
              <GallerySlot label="Before & After Sample" />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
