import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  Globe,
  Instagram,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  ProfileAvatarCircle,
  ProfileImageGrid,
  ProfilePanel,
} from "@/components/profile/ProfileDisplayShared";
import { formatMemberId } from "@/lib/member-identity";
import { getPublicMembers } from "@/lib/public-members";

type MemberPageProps = {
  params: Promise<{ id: string }>;
};

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
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

export default async function MemberPublicProfilePage({
  params,
}: MemberPageProps) {
  const { id } = await params;
  const members = await getPublicMembers("en");
  const member = members.find((item) => item.id === id);

  if (!member) {
    notFound();
  }

  const instagramUrl = normalizeUrl(member.instagramUrl);
  const websiteUrl = normalizeUrl(member.websiteUrl);
  const memberSpecializations = member.specializations ?? [];
  const memberSince = new Date(member.memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const focusItems: string[] =
    member.highlights.length > 0
      ? member.highlights
      : memberSpecializations.length > 0
        ? memberSpecializations
        : [member.title || "IBPA Member"].filter(Boolean);
  const galleryImages = member.portfolioImages.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-[#D4E0F0] bg-white shadow-[0_22px_60px_rgba(11,31,68,0.10)]">
          <div className="h-36 bg-[radial-gradient(circle_at_20%_15%,rgba(43,92,153,0.42),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(96,165,250,0.34),transparent_36%),linear-gradient(135deg,#E7F0FC_0%,#D6E7FB_45%,#C3DBF8_100%)]" />

          <div className="px-6 pb-6">
            <div className="-mt-16 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <ProfileAvatarCircle
                  imageUrl={member.avatarUrl}
                  alt={member.fullName}
                  initials={getInitials(member.fullName)}
                  className="size-28"
                />

                <div className="pb-1">
                  <h1 className="break-words text-3xl font-semibold tracking-tight text-[#10203B]">
                    {member.fullName}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified IBPA Member
                    </span>
                    <span className="inline-flex rounded-full border border-[#D4E0F0] bg-white px-3 py-1 text-[11px] font-semibold text-[#21466D]">
                      {member.membershipCategory || "Member"}
                    </span>
                    <span className="inline-flex rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {formatMemberId(member.id)}
                    </span>
                  </div>

                  {(member.location || member.title) && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {member.location ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#4C7D9D]" />
                          {member.location}
                        </span>
                      ) : null}
                      {member.title ? (
                        <span>{member.title}</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-white text-[#10203B] shadow-sm transition hover:border-[#2B5C99]/40 hover:bg-[#F5F9FF]"
                    aria-label={`${member.fullName} Instagram`}
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
                    aria-label={`${member.fullName} website`}
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                ) : null}

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1A3157]"
                >
                  Contact IBPA
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <ProfilePanel title="Community identity">
              <div className="rounded-3xl border border-white/80 bg-[#F8FBFF] p-5 shadow-sm">
                <div className="space-y-5">
                  <PublicInfoItem label="Member since" value={memberSince} />
                  <PublicInfoItem
                    label="Experience"
                    value={member.experience || "Not listed yet"}
                  />
                  <PublicInfoItem
                    label="Specialization"
                      value={
                      memberSpecializations.join(", ") ||
                      member.title ||
                      "Not listed yet"
                    }
                  />
                </div>
              </div>
            </ProfilePanel>

            {(instagramUrl || websiteUrl) && (
              <ProfilePanel title="Recognition & links">
                <div className="flex flex-col gap-3">
                  {instagramUrl ? (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-white px-4 py-3 text-sm font-medium text-[#10203B] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
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
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-white px-4 py-3 text-sm font-medium text-[#10203B] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
                    >
                      <Globe className="h-4 w-4 text-[#4C7D9D]" />
                      Website
                    </a>
                  ) : null}
                </div>
              </ProfilePanel>
            )}
          </div>

          <div className="space-y-5">
            <ProfilePanel title="Professional biography">
              <p className="text-sm leading-7 text-slate-600">
                {member.description ||
                  "This member has not added a full public biography yet."}
              </p>
            </ProfilePanel>

            <ProfilePanel title="Professional focus">
              {focusItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {focusItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      <Sparkles className="h-4 w-4 text-[#4C7D9D]" />
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  Public focus areas have not been added yet.
                </p>
              )}
            </ProfilePanel>

            <ProfilePanel title="Work gallery">
              {galleryImages.length > 0 ? (
                <ProfileImageGrid
                  images={galleryImages}
                  altBuilder={(index) =>
                    `${member.fullName} portfolio sample ${index + 1}`
                  }
                />
              ) : (
                <p className="rounded-[24px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-4 py-6 text-sm leading-6 text-slate-500">
                  Portfolio samples have not been added to this public profile yet.
                </p>
              )}
            </ProfilePanel>
          </div>
        </div>
      </div>
    </main>
  );
}

function PublicInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#10203B]">{value}</p>
    </div>
  );
}
