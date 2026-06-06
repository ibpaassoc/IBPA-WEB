"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { genUploader } from "uploadthing/client";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import type { DashboardProfileData } from "@/components/dashboard/dashboard-types";
import { ServicesSection } from "@/components/dashboard/profile/ServicesSection";
import { PortfolioUploadField } from "@/components/forms/PortfolioUploadField";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { countryOptions } from "@/constants/countries";
import { useI18n } from "@/lib/i18n";
import { getPublicProfileHref } from "@/lib/member-identity";
import {
  SectionCard,
  SectionHeader,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardStandalonePageContainerClassName,
  dashboardTextareaClassName,
} from "@/shared/components/DashboardShared";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  imageUrl: string | null;
  bio: string;
  achievements: string;
  industryContribution: string;
  education: string;
  instagramUrl: string;
  websiteUrl: string;
  country: string;
  state: string;
  city: string;
  yearsExperience: string;
  specializationInput: string;
  portfolioImages: string[];
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitCommaValues(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildProfileForm(profile: DashboardProfileData): ProfileFormState {
  return {
    firstName: normalizeString(profile.firstName),
    lastName: normalizeString(profile.lastName),
    phone: normalizeString(profile.phone),
    imageUrl: typeof profile.imageUrl === "string" ? profile.imageUrl : null,
    bio: normalizeString(profile.bio),
    achievements: normalizeString(profile.achievements),
    industryContribution: normalizeString(profile.industryContribution),
    education: normalizeString(profile.education),
    instagramUrl: normalizeString(profile.instagramUrl),
    websiteUrl: normalizeString(profile.websiteUrl),
    country: normalizeString(profile.country),
    state: normalizeString(profile.state),
    city: normalizeString(profile.city),
    yearsExperience: normalizeString(profile.experienceYears),
    specializationInput: Array.isArray(profile.specializations)
      ? profile.specializations.join(", ")
      : normalizeString(profile.specialization),
    portfolioImages: Array.isArray(profile.portfolioImages)
      ? profile.portfolioImages.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
  };
}

export default function EditApplicationPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";

  const [profile, setProfile] = useState<DashboardProfileData | null>(null);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessBlockedMessage, setAccessBlockedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/profile", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setAccessBlocked(true);
        setAccessBlockedMessage(t.dashboard.editProfile.profileBlocked);
        return;
      }

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : t.dashboard.editProfile.loadError,
        );
      }

      const nextProfile = (data.profile || {}) as DashboardProfileData;
      if (nextProfile.dashboardAccessType === "partner_team_member") {
        setAccessBlocked(true);
        setAccessBlockedMessage(t.dashboard.editProfile.teamMemberBlocked);
        return;
      }

      setAccessBlocked(false);
      setAccessBlockedMessage(null);
      setProfile(nextProfile);
      setForm(buildProfileForm(nextProfile));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.dashboard.editProfile.loadError,
      );
    } finally {
      setLoading(false);
    }
  }, [
    t.dashboard.editProfile.loadError,
    t.dashboard.editProfile.profileBlocked,
    t.dashboard.editProfile.teamMemberBlocked,
  ]);

  useEffect(() => {
    // Loading the existing profile is the external synchronization this page needs on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  const immutableInfo = useMemo(() => {
    return [
      {
        label: t.dashboard.editProfile.lockedFields.email,
        value: normalizeString(profile?.email) || t.dashboard.profile.notAddedYet,
      },
      {
        label: t.dashboard.editProfile.lockedFields.membership,
        value: profile?.membershipCategory || t.dashboard.statuses.pending,
      },
      {
        label: t.dashboard.editProfile.lockedFields.applicantType,
        value: profile?.applicantType || t.dashboard.statuses.pending,
      },
    ];
  }, [profile, t.dashboard]);

  const publicPreviewHref = profile?.id ? getPublicProfileHref(profile.id) : null;

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file || !form) return;

    setUploadingAvatar(true);
    try {
      const result = await uploadFiles("avatarUploader", { files: [file] });
      const uploaded = result?.[0];
      const imageUrl =
        uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url;

      if (!imageUrl) {
        throw new Error(t.dashboard.editProfile.photoUploadMissingUrl);
      }

      setForm((prev) => (prev ? { ...prev, imageUrl } : prev));
      toast.success(t.dashboard.editProfile.photoUpdated);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t.dashboard.editProfile.photoUploadError,
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !form) return;

    const specializations = splitCommaValues(form.specializationInput);

    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          phone: form.phone || null,
          imageUrl: form.imageUrl,
          bio: form.bio || null,
          achievements: form.achievements || null,
          industryContribution: form.industryContribution || null,
          education: form.education || null,
          instagramUrl: form.instagramUrl || null,
          websiteUrl: form.websiteUrl || null,
          country: form.country || null,
          state: form.state || null,
          city: form.city || null,
          experienceYears: form.yearsExperience || null,
          specializations,
          portfolioImages: form.portfolioImages,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : t.dashboard.editProfile.saveError,
        );
      }

      toast.success(t.dashboard.editProfile.saveSuccess);
      await loadProfile();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.dashboard.editProfile.saveError,
      );
    } finally {
      setSaving(false);
    }
  };

  if (accessBlocked) {
    return (
      <main className={dashboardStandalonePageContainerClassName}>
        <SectionCard className="max-w-4xl">
          <SectionHeader
            eyebrow={t.dashboard.editProfile.pageEyebrow}
            title={t.dashboard.editProfile.accessBlockedTitle}
            description={
              accessBlockedMessage ||
              t.dashboard.editProfile.accessBlockedDescription
            }
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className={dashboardPrimaryButtonClassName}>
              {t.dashboard.editProfile.backToDashboard}
            </Link>
            <Link
              href="https://ibpassociations.org/contact"
              className={dashboardSecondaryButtonClassName}
            >
              {t.dashboard.editProfile.contactSupport}
            </Link>
          </div>
        </SectionCard>
      </main>
    );
  }

  if (loading || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4C7D9D]" />
      </div>
    );
  }

  return (
    <main className={dashboardStandalonePageContainerClassName}>
      <div className="space-y-6">
        <SectionCard>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#10203B]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.dashboard.editProfile.backToDashboard}
          </Link>

          <div className="mt-5">
            <SectionHeader
              eyebrow={t.dashboard.editProfile.pageEyebrow}
              title={t.dashboard.editProfile.pageTitle}
              description={t.dashboard.editProfile.pageDescription}
              action={
                publicPreviewHref ? (
                  <Link
                    href={publicPreviewHref}
                    className={dashboardSecondaryButtonClassName}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview Public Profile
                  </Link>
                ) : null
              }
            />
          </div>
        </SectionCard>

        <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <SectionCard>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
                {t.dashboard.editProfile.profilePhoto}
              </p>

              <div className="mt-5 flex flex-col items-center gap-4 text-center">
                <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#D8E8FB] text-3xl font-semibold text-[#10203B] shadow-[0_18px_35px_rgba(11,31,68,0.18)]">
                  {form.imageUrl ? (
                    <ImageWithFallback
                      src={form.imageUrl}
                      alt={t.dashboard.editProfile.profilePhoto}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    `${(form.firstName[0] || "").toUpperCase()}${(form.lastName[0] || "").toUpperCase()}` ||
                    "IB"
                  )}

                  {uploadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                      <Loader2 className="h-7 w-7 animate-spin text-white" />
                    </div>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-3">
                  <label
                    className={`${dashboardSecondaryButtonClassName} cursor-pointer`}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {uploadingAvatar
                      ? t.dashboard.editProfile.uploading
                      : t.dashboard.editProfile.uploadNewPhoto}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={async (event) => {
                        await handleAvatarUpload(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {form.imageUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => (prev ? { ...prev, imageUrl: null } : prev))
                      }
                      className={dashboardSecondaryButtonClassName}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t.dashboard.editProfile.removePhoto}
                    </button>
                  ) : null}
                </div>

                <p className="text-sm leading-6 text-slate-500">
                  {t.dashboard.editProfile.photoHelper}
                </p>
              </div>
            </SectionCard>

            <SectionCard>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
                {t.dashboard.editProfile.lockedInformation}
              </p>
              <div className="mt-4 space-y-3">
                {immutableInfo.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard>
              <SectionHeader
                eyebrow="Canonical profile"
                title="Public profile essentials"
                description="These values come from the canonical profile record and drive your dashboard profile, public preview, and directory listing."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    First name
                  </span>
                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, firstName: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="First name"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Last name
                  </span>
                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, lastName: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="Last name"
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Professional bio
                  </span>
                  <textarea
                    value={form.bio}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, bio: event.target.value } : prev,
                      )
                    }
                    className={dashboardTextareaClassName}
                    placeholder="Introduce your work, experience, and professional focus."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Contact phone
                  </span>
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, phone: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="Phone number"
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Credentials / education
                  </span>
                  <textarea
                    value={form.education}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, education: event.target.value } : prev,
                      )
                    }
                    className={dashboardTextareaClassName}
                    placeholder="List your education, certifications, and credentials."
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Achievements
                  </span>
                  <textarea
                    value={form.achievements}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, achievements: event.target.value } : prev,
                      )
                    }
                    className={dashboardTextareaClassName}
                    placeholder="Awards, milestones, speaking engagements, media features, or other notable highlights."
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Industry contribution
                  </span>
                  <textarea
                    value={form.industryContribution}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              industryContribution: event.target.value,
                            }
                          : prev,
                      )
                    }
                    className={dashboardTextareaClassName}
                    placeholder="Describe how you contribute to the beauty industry, mentor peers, or support the community."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Years of experience
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    value={form.yearsExperience}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, yearsExperience: event.target.value }
                          : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="e.g. 11"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Specializations
                  </span>
                  <input
                    value={form.specializationInput}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, specializationInput: event.target.value }
                          : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="Brows, lashes, esthetics, salon leadership"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Instagram
                  </span>
                  <input
                    value={form.instagramUrl}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, instagramUrl: event.target.value }
                          : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="https://instagram.com/..."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Website
                  </span>
                  <input
                    value={form.websiteUrl}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, websiteUrl: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="https://..."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Country
                  </span>
                  <select
                    value={form.country}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, country: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                  >
                    <option value="">Select a country</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    State / region
                  </span>
                  <input
                    value={form.state}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, state: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="State, region, or province"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    City
                  </span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, city: event.target.value } : prev,
                      )
                    }
                    className={dashboardInputClassName}
                    placeholder="City"
                  />
                </label>
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader
                eyebrow="Portfolio media"
                title="Public work gallery"
                description="Upload the portfolio images that should appear on your dashboard profile and public member preview."
              />

              <div className="mt-6">
                <PortfolioUploadField
                  isRu={isRu}
                  isUk={isUk}
                  value={form.portfolioImages}
                  onChange={(urls) =>
                    setForm((prev) =>
                      prev ? { ...prev, portfolioImages: urls } : prev,
                    )
                  }
                />
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader
                eyebrow="Services"
                title="Profile services"
                description="Service cards save through the existing profile services flow and appear on your dashboard profile."
              />

              <div className="mt-6">
                <ServicesSection initialServices={profile?.services} />
              </div>
            </SectionCard>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/dashboard" className={dashboardSecondaryButtonClassName}>
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={dashboardPrimaryButtonClassName}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t.dashboard.editProfile.saveChanges}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
