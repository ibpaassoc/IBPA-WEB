"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { useOwnedDashboardProfile } from "@/hooks/dashboard/useOwnedDashboardProfile";
import { useI18n } from "@/lib/i18n";
import { getPublicProfilePreviewHref } from "@/lib/member-identity";
import {
  SectionCard,
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
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [],
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </span>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const {
    profile,
    accessBlocked,
    accessBlockedMessage,
    loading,
    loadProfile,
  } = useOwnedDashboardProfile();

  useEffect(() => {
    if (profile) {
      // The form mirrors freshly loaded profile data before local editing begins.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(buildProfileForm(profile));
    }
  }, [profile]);

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
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
              {t.dashboard.editProfile.pageEyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#10203B]">
              {t.dashboard.editProfile.accessBlockedTitle}
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              {accessBlockedMessage ||
                t.dashboard.editProfile.accessBlockedDescription}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className={dashboardPrimaryButtonClassName}>
              {t.dashboard.editProfile.backToDashboard}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#10203B]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.dashboard.editProfile.backToDashboard}
          </Link>

          {profile?.id ? (
            <Link
              href={getPublicProfilePreviewHref(profile.id) ?? "#"}
              className={dashboardSecondaryButtonClassName}
            >
              <ExternalLink className="h-4 w-4" />
              Preview Profile
            </Link>
          ) : null}
        </div>

        <SectionCard className="overflow-hidden rounded-[32px] p-0">
          <div className="h-28 bg-[radial-gradient(circle_at_20%_15%,rgba(43,92,153,0.42),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(96,165,250,0.34),transparent_36%),linear-gradient(135deg,#E7F0FC_0%,#D6E7FB_45%,#C3DBF8_100%)]" />

          <div className="px-5 pb-5 md:px-6 md:pb-6">
            <div className="-mt-14 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-5">
                <section className="rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_14px_35px_rgba(11,31,68,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
                    {t.dashboard.editProfile.profilePhoto}
                  </p>

                  <div className="mt-5 flex flex-col items-center gap-4">
                    <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#D8E8FB] text-3xl font-semibold text-[#10203B] shadow-[0_18px_35px_rgba(11,31,68,0.18)]">
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
                            await handleAvatarUpload(
                              event.target.files?.[0] ?? null,
                            );
                            event.target.value = "";
                          }}
                        />
                      </label>

                      {form.imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) =>
                              prev ? { ...prev, imageUrl: null } : prev,
                            )
                          }
                          className={dashboardSecondaryButtonClassName}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t.dashboard.editProfile.removePhoto}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_14px_35px_rgba(11,31,68,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
                    Recognition & links
                  </p>

                  <div className="mt-5 grid gap-4">
                    <label className="grid gap-2">
                      <FieldLabel>Phone</FieldLabel>
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

                    <label className="grid gap-2">
                      <FieldLabel>Instagram</FieldLabel>
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
                      <FieldLabel>Website</FieldLabel>
                      <input
                        value={form.websiteUrl}
                        onChange={(event) =>
                          setForm((prev) =>
                            prev
                              ? { ...prev, websiteUrl: event.target.value }
                              : prev,
                          )
                        }
                        className={dashboardInputClassName}
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_14px_35px_rgba(11,31,68,0.08)]">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
                    <label className="grid gap-2">
                      <FieldLabel>First name</FieldLabel>
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
                      <FieldLabel>Last name</FieldLabel>
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

                    <label className="grid gap-2">
                      <FieldLabel>Experience</FieldLabel>
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
                        placeholder="0"
                      />
                    </label>

                    <label className="grid gap-2 md:col-span-2">
                      <FieldLabel>Specializations</FieldLabel>
                      <input
                        value={form.specializationInput}
                        onChange={(event) =>
                          setForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  specializationInput: event.target.value,
                                }
                              : prev,
                          )
                        }
                        className={dashboardInputClassName}
                        placeholder="Brows, lashes, esthetics"
                      />
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>City</FieldLabel>
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

                    <label className="grid gap-2">
                      <FieldLabel>State / region</FieldLabel>
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
                      <FieldLabel>Country</FieldLabel>
                      <select
                        value={form.country}
                        onChange={(event) =>
                          setForm((prev) =>
                            prev
                              ? { ...prev, country: event.target.value }
                              : prev,
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
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_14px_35px_rgba(11,31,68,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
                    Professional biography
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 md:col-span-2">
                      <FieldLabel>Biography</FieldLabel>
                      <textarea
                        value={form.bio}
                        onChange={(event) =>
                          setForm((prev) =>
                            prev ? { ...prev, bio: event.target.value } : prev,
                          )
                        }
                        className={dashboardTextareaClassName}
                        placeholder="Introduce your work and professional focus."
                      />
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>Achievements</FieldLabel>
                      <textarea
                        value={form.achievements}
                        onChange={(event) =>
                          setForm((prev) =>
                            prev
                              ? { ...prev, achievements: event.target.value }
                              : prev,
                          )
                        }
                        className={dashboardTextareaClassName}
                        placeholder="Awards, milestones, speaking engagements, or media features."
                      />
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>Industry contribution</FieldLabel>
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
                        placeholder="How you contribute to the beauty industry and community."
                      />
                    </label>

                    <label className="grid gap-2 md:col-span-2">
                      <FieldLabel>Education</FieldLabel>
                      <textarea
                        value={form.education}
                        onChange={(event) =>
                          setForm((prev) =>
                            prev
                              ? { ...prev, education: event.target.value }
                              : prev,
                          )
                        }
                        className={dashboardTextareaClassName}
                        placeholder="Credentials, certifications, and education."
                      />
                    </label>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <SectionCard className="p-5">
            <ServicesSection initialServices={profile?.services} />
          </SectionCard>

          <SectionCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C7D9D]">
              Work gallery
            </p>

            <div className="mt-5">
              <PortfolioUploadField
                isRu={isRu}
                isUk={isUk}
                value={form.portfolioImages}
                onChange={(urls) =>
                  setForm((prev) =>
                    prev ? { ...prev, portfolioImages: urls } : prev,
                  )
                }
                hideRequirementsText
              />
            </div>
          </SectionCard>
        </div>

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
    </main>
  );
}
