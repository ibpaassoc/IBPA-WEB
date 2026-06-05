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

function ExperienceText({ value }: { value: string }) {
  return (
    <div className="px-1 py-2">
      <div className="mb-3 flex items-center gap-2 text-[#2B5C99]">
        <Sparkles className="h-4 w-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Years of experience
        </p>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-[#10203B]">
        {value}
      </p>
    </div>
  );
}

function textValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : typeof item === "number"
            ? String(item)
            : "",
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  return "";
}

function formatDate(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

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
          {expanded ? "Show less" : "See all"}
        </button>
      ) : null}
    </motion.article>
  );
}

function CertificatePreviewCard({
  certificate,
  membershipExpiresDisplay,
}: {
  certificate?: Certificate;
  membershipExpiresDisplay: string;
}) {
  const expiresAt =
    formatDate(certificate?.expiresAt) || membershipExpiresDisplay || "Pending";
  const isIssued =
    certificate?.status === "paid" || certificate?.status === "approved";

  return (
    <motion.article
      layout
      className="rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]"
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#2B5C99]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              IBPA certificate
            </p>
          </div>

          <p className="mt-3 text-base font-semibold text-[#10203B]">
            Official certificate
          </p>
        </div>

        <StatusPill
          label={isIssued ? "Verified" : "Pending"}
          tone={isIssued ? "verified" : "pending"}
        />
      </div>

      {certificate ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#DCE7F4] bg-white px-3 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                ID
              </p>
              <p className="mt-1 break-all text-xs font-semibold leading-5 text-[#10203B]">
                {certificate.certNumber}
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCE7F4] bg-white px-3 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Valid through
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#10203B]">
                {expiresAt}
              </p>
            </div>
          </div>

          {certificate.certificateUrl ? (
            <a
              href={certificate.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0D1F3D] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#16386D]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open certificate
            </a>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#D4E0F0] bg-white/80 px-3 py-3 text-xs leading-5 text-slate-500">
              Certificate file is not uploaded yet.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-[#D4E0F0] bg-white/80 px-3 py-3 text-sm leading-6 text-slate-500">
          No IBPA certificate issued yet.
        </p>
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
    if (!Array.isArray(raw)) return [] as string[];

    return raw
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
      .slice(0, 6);
  }, [mergedProfileData.applicationPayload]);

  const profileServices = useMemo(
    () =>
      Array.isArray(mergedProfileData.services)
        ? mergedProfileData.services
        : [],
    [mergedProfileData.services],
  );

  const applicationPayload =
    mergedProfileData.applicationPayload &&
    typeof mergedProfileData.applicationPayload === "object" &&
    !Array.isArray(mergedProfileData.applicationPayload)
      ? mergedProfileData.applicationPayload
      : null;

  const biography =
    mergedProfileData.bio || textValue(applicationPayload?.professionalDesc);

  const contribution = textValue(applicationPayload?.contributionDesc);

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

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ExperienceText
            value={mergedProfileData.experienceYears || "Not added yet"}
          />

          <ExpandableTextCard
            label="Biography"
            icon={<Sparkles className="h-4 w-4" />}
            value={biography}
            emptyLabel="No biography added yet."
          />

          <ExpandableTextCard
            label="Achievements"
            icon={<Trophy className="h-4 w-4" />}
            value={achievementsSummary}
            emptyLabel="No achievements added yet."
          />

          <CertificatePreviewCard
            certificate={primaryCertificate}
            membershipExpiresDisplay={membershipExpiresDisplay}
          />

          <ExpandableTextCard
            label="Industry contribution"
            icon={<Globe className="h-4 w-4" />}
            value={contribution}
            emptyLabel="No contribution details added yet."
          />

          <ExpandableTextCard
            label="Education"
            icon={<GraduationCap className="h-4 w-4" />}
            value={mergedProfileData.education || ""}
            emptyLabel="No education details added yet."
          />
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
