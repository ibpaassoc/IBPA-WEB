"use client";

import { useMemo, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  GraduationCap,
  Instagram,
  LinkIcon,
  MapPin,
  Sparkles,
  Trophy,
  Upload,
} from "lucide-react";

import { StatusPill } from "@/components/dashboard/DashboardShared";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { TeamMemberAccessInfo } from "@/components/dashboard/dashboard-types";
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

function ActionIconButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
}) {
  return (
    <button
      {...props}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
    >
      {children}
    </button>
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
    <div className="min-w-0 border-[#D4E0F0] px-4 py-3 first:pl-0 md:border-l md:first:border-l-0">
      <div className="mb-3 text-[#2B5C99]">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#10203B]">
        {value}
      </p>
    </div>
  );
}

function ServiceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[#D4E0F0] bg-white p-4 shadow-sm">
      <div className="mb-4 h-10 rounded-2xl bg-[linear-gradient(135deg,#DCEAFB_0%,#C7DCF7_50%,#EAF2FD_100%)]" />
      <h4 className="text-base font-semibold text-[#10203B]">{title}</h4>
      <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
    </div>
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
  const [copied, setCopied] = useState(false);

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

  const handleCopyProfileLink = async () => {
    if (!publicProfileHref) return;

    await navigator.clipboard.writeText(buildProfileUrl(publicProfileHref));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

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
                <ActionIconButton
                  type="button"
                  onClick={handleCopyProfileLink}
                  aria-label="Copy profile link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </ActionIconButton>
              ) : null}

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

                <p className="text-sm leading-6 text-slate-600">
                  {mergedProfileData.bio ||
                    "Add a short professional biography to describe your expertise, services, and achievements."}
                </p>
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <ServiceCard
                title="Brow Artistry"
                description={
                  specializationDisplay.toLowerCase().includes("brow")
                    ? "Brow mapping, shaping, styling, and beauty-focused brow services."
                    : "Highlight your main professional service here."
                }
              />

              <ServiceCard
                title="Lash Artistry"
                description={
                  specializationDisplay.toLowerCase().includes("lash")
                    ? "Classic extensions, volume lashes, lash lift, and tint services."
                    : "Highlight another specialty or service category here."
                }
              />
            </div>
          </div>
        </div>
      </section>

      <Panel title="Professional biography">
        <div className="grid gap-4 rounded-3xl border border-[#D4E0F0] bg-white p-4 md:grid-cols-4">
          <MetricCard
            icon={<Sparkles className="h-5 w-5" />}
            label="Years of experience"
            value={mergedProfileData.experienceYears || "Not added yet"}
          />

          <MetricCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="Education"
            value={mergedProfileData.education || "Not added yet"}
          />

          <MetricCard
            icon={<Award className="h-5 w-5" />}
            label="Certificates"
            value={
              certificateSummary || "Certificate details appear here once added"
            }
          />

          <MetricCard
            icon={<Trophy className="h-5 w-5" />}
            label="Achievements"
            value={
              achievementsSummary ||
              "Add awards, publications, or notable accomplishments"
            }
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
                <div key={`${image}-${index}`} className="overflow-hidden rounded-[24px] border border-[#D4E0F0] bg-[#F5F9FF]">
                  <ImageWithFallback
                    src={image}
                    alt={`${fullName} gallery image ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <GallerySlot label="Featured Brow Work" />
              <GallerySlot label="Featured Lash Work" />
              <GallerySlot label="Before & After Sample" />
            </div>
          )}

          {publicProfileHref ? (
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <LinkIcon className="h-4 w-4 text-[#2B5C99]" />
              )}
              {copied ? "Profile link copied" : "Copy profile link"}
            </button>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
