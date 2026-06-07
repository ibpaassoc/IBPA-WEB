import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Globe, Instagram, MapPin, Phone, Sparkles, Trophy } from "lucide-react";

import { ProfileServicesDisplay } from "@/components/dashboard/profile/ProfileServicesDisplay";
import {
  ProfileAvatarCircle,
  ProfileImageGrid,
  ProfilePanel,
} from "@/components/profile/ProfileDisplayShared";
import { I18nProvider } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { getPublicProfilePreview } from "@/lib/public-members";

type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizePhoneHref(value?: string | null) {
  if (!value) return null;
  return `tel:${value}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PublicInfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#10203B]">{value}</p>
    </div>
  );
}

function ContactRow({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noreferrer"}
      className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-white px-4 py-3 text-sm font-medium text-[#10203B] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
    >
      <span className="text-[#4C7D9D]">{icon}</span>
      {label}
    </a>
  );
}

export default async function PublicProfilePreviewPage({
  params,
}: PreviewPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get("ibpa-locale")?.value);
  const profile = await getPublicProfilePreview(id);

  if (!profile) {
    notFound();
  }

  const instagramUrl = normalizeUrl(profile.instagramUrl);
  const websiteUrl = normalizeUrl(profile.websiteUrl);
  const phoneHref = normalizePhoneHref(profile.phone);
  const galleryImages = profile.portfolioImages.slice(0, 6);
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <I18nProvider initialLocale={initialLocale}>
      <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex justify-end">
            <span className="inline-flex items-center rounded-full border border-[#D4E0F0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#21466D]">
              Public Preview
            </span>
          </div>

          <section className="overflow-hidden rounded-[32px] border border-[#D4E0F0] bg-white shadow-[0_22px_60px_rgba(11,31,68,0.10)]">
            <div className="h-36 bg-[radial-gradient(circle_at_20%_15%,rgba(43,92,153,0.42),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(96,165,250,0.34),transparent_36%),linear-gradient(135deg,#E7F0FC_0%,#D6E7FB_45%,#C3DBF8_100%)]" />

            <div className="px-6 pb-6">
              <div className="-mt-16 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <ProfileAvatarCircle
                    imageUrl={profile.avatarUrl}
                    alt={profile.fullName}
                    initials={getInitials(profile.fullName)}
                    className="size-28"
                  />

                  <div className="pb-1">
                    <h1 className="break-words text-3xl font-semibold tracking-tight text-[#10203B]">
                      {profile.fullName}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {location ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-[#4C7D9D]" />
                          {location}
                        </span>
                      ) : null}
                      {profile.specializations.length > 0 ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-1 text-[11px] font-semibold text-[#21466D]">
                          <Sparkles className="h-3.5 w-3.5 text-[#4C7D9D]" />
                          {profile.specializations.join(", ")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {instagramUrl ? (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                      aria-label={`${profile.fullName} Instagram`}
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
                      aria-label={`${profile.fullName} website`}
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <ProfilePanel title="Professional biography">
                  <p className="text-sm leading-7 text-slate-600">
                    {profile.bio || "This member has not added a full biography yet."}
                  </p>
                </ProfilePanel>

                <ProfileServicesDisplay services={profile.services} />
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-5">
              <ProfilePanel title="Profile details">
                <div className="rounded-3xl border border-white/80 bg-[#F8FBFF] p-5 shadow-sm">
                  <div className="space-y-5">
                    <PublicInfoItem
                      label="Experience"
                      value={profile.yearsExperience || "Not listed yet"}
                    />
                    <PublicInfoItem
                      label="Education"
                      value={profile.education || "Not listed yet"}
                    />
                    <PublicInfoItem
                      label="Focus"
                      value={
                        profile.specializations.join(", ") || "Not listed yet"
                      }
                    />
                  </div>
                </div>
              </ProfilePanel>

              {(phoneHref || instagramUrl || websiteUrl) ? (
                <ProfilePanel title="Recognition & links">
                  <div className="flex flex-col gap-3">
                    {phoneHref ? (
                      <ContactRow
                        href={phoneHref}
                        label={profile.phone || "Phone"}
                        icon={<Phone className="h-4 w-4" />}
                      />
                    ) : null}
                    {instagramUrl ? (
                      <ContactRow
                        href={instagramUrl}
                        label="Instagram"
                        icon={<Instagram className="h-4 w-4" />}
                      />
                    ) : null}
                    {websiteUrl ? (
                      <ContactRow
                        href={websiteUrl}
                        label="Website"
                        icon={<Globe className="h-4 w-4" />}
                      />
                    ) : null}
                  </div>
                </ProfilePanel>
              ) : null}
            </div>

            <div className="space-y-5">
              <ProfilePanel title="Career highlights">
                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#2B5C99]" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Achievements
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#10203B]">
                      {profile.achievements || "Achievements have not been added yet."}
                    </p>
                  </article>

                  <article className="rounded-[24px] border border-[#D4E0F0] bg-[#FBFDFF] p-4 shadow-[0_14px_35px_rgba(11,31,68,0.05)]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#2B5C99]" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Industry contribution
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#10203B]">
                      {profile.industryContribution ||
                        "Industry contributions have not been added yet."}
                    </p>
                  </article>
                </div>
              </ProfilePanel>

              <ProfilePanel title="Work gallery">
                {galleryImages.length > 0 ? (
                  <ProfileImageGrid
                    images={galleryImages}
                    altBuilder={(index) =>
                      `${profile.fullName} portfolio sample ${index + 1}`
                    }
                  />
                ) : (
                  <p className="rounded-[24px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-4 py-6 text-sm leading-6 text-slate-500">
                    Portfolio samples have not been added to this preview yet.
                  </p>
                )}
              </ProfilePanel>
            </div>
          </div>
        </div>
      </main>
    </I18nProvider>
  );
}
