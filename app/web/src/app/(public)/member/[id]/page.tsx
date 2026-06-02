import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Globe, Instagram, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { formatMemberId } from "@/lib/member-identity";
import { getPublicMembers } from "@/lib/public-members";

type MemberPageProps = {
  params: Promise<{ id: string }>;
};

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export default async function MemberPublicProfilePage({ params }: MemberPageProps) {
  const { id } = await params;
  const members = await getPublicMembers("en");
  const member = members.find((item) => item.id === id);

  if (!member) {
    notFound();
  }

  const instagramUrl = normalizeUrl(member.instagramUrl);
  const websiteUrl = normalizeUrl(member.websiteUrl);
  const memberSince = new Date(member.memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[30px] border border-white/80 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">IBPA public verification</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#10203B] md:text-5xl">{member.fullName}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F8F3] px-4 py-2 text-sm font-medium text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Verified IBPA Member
                </span>
                <span className="inline-flex rounded-full bg-[#EAF4FF] px-4 py-2 text-sm font-medium text-[#4C7D9D]">
                  {member.membershipCategory || "Member"}
                </span>
                <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                  {formatMemberId(member.id)}
                </span>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
            >
              Contact IBPA
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[32px] bg-[#dbe9f4]">
                {member.avatarUrl ? (
                  <ImageWithFallback src={member.avatarUrl} alt={member.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-[#10203B]">
                    {member.fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <p className="mt-5 text-xl font-semibold text-[#10203B]">{member.title || "IBPA Member"}</p>
              {member.location ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-[#4C7D9D]" />
                  {member.location}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Member since</p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">{memberSince}</p>
              </div>
              <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Experience</p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">{member.experience || "Not listed"}</p>
              </div>
              <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Specialization</p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">{member.specializations?.join(", ") || member.title || "Not listed"}</p>
              </div>
            </div>

            {(instagramUrl || websiteUrl) && (
              <div className="mt-6 flex flex-col gap-3">
                {instagramUrl ? (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#72A0C1]/40 hover:text-[#10203B]">
                    <Instagram className="h-4 w-4 text-[#4C7D9D]" />
                    Instagram
                  </a>
                ) : null}
                {websiteUrl ? (
                  <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#72A0C1]/40 hover:text-[#10203B]">
                    <Globe className="h-4 w-4 text-[#4C7D9D]" />
                    Website
                  </a>
                ) : null}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">Profile overview</p>
              <p className="mt-4 text-base leading-8 text-slate-600">{member.description || "This member has not added a full professional bio yet."}</p>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">Professional focus</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(member.highlights.length > 0 ? member.highlights : member.specializations || []).map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full bg-[#F5F8FC] px-4 py-2 text-sm font-medium text-slate-700">
                    <Sparkles className="h-4 w-4 text-[#4C7D9D]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {member.portfolioImages.length > 0 ? (
              <div className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">Portfolio samples</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {member.portfolioImages.slice(0, 6).map((image, index) => (
                    <div key={`${member.id}-${index}`} className="overflow-hidden rounded-[24px] bg-[#F5F8FC]">
                      <ImageWithFallback src={image} alt={`${member.fullName} portfolio sample ${index + 1}`} className="aspect-square w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
