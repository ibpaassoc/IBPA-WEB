"use client";

import { ExternalLink, Globe, Instagram } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { thumbnailUrl } from "@/lib/optimized-image";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatNullableText, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord } from "../types/members-admin.types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-[#10203B]">{value}</dd>
    </div>
  );
}

type Props = {
  member: AdminMemberRecord;
};

export function MemberProfileTab({ member }: Props) {
  const location = [member.city, member.state, member.country].filter(Boolean).join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 border border-[#D7E5F4]">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#EEF6FF] text-base font-semibold text-[#1F5D8F]">
              {initialsFromName(member.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[#10203B]">{member.userName}</h3>
            <p className="truncate text-sm text-[#6C7F95]">{member.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <AdminStatusBadge tone="info">
                {member.cardName || member.membershipCategory || "Member"}
              </AdminStatusBadge>
              <AdminStatusBadge tone={member.isLinked ? "success" : "neutral"}>
                {member.isLinked ? "Dashboard linked" : "Not linked"}
              </AdminStatusBadge>
            </div>
          </div>
        </div>

        {member.bio ? (
          <p className="text-sm leading-6 text-[#55708D]">{member.bio}</p>
        ) : null}

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Specialization" value={formatNullableText(member.specialization)} />
          <InfoRow
            label="Experience"
            value={formatNullableText(member.experienceYears ? `${member.experienceYears} years` : null)}
          />
          <InfoRow label="Education" value={formatNullableText(member.education)} />
          {location ? <InfoRow label="Location" value={location} /> : null}
        </dl>

        {member.websiteUrl || member.instagramUrl ? (
          <div className="flex flex-wrap gap-2">
            {member.websiteUrl ? (
              <a
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E5F4] bg-white px-3 py-1.5 text-xs font-medium text-[#1F5D8F] hover:bg-[#EEF6FF]"
                href={member.websiteUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Globe className="size-3.5" />
                Website
              </a>
            ) : null}
            {member.instagramUrl ? (
              <a
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E5F4] bg-white px-3 py-1.5 text-xs font-medium text-[#1F5D8F] hover:bg-[#EEF6FF]"
                href={member.instagramUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Instagram className="size-3.5" />
                Instagram
              </a>
            ) : null}
          </div>
        ) : null}

        {member.services && member.services.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">Services</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {member.services.slice(0, 4).map((service) => (
                <div
                  className="rounded-2xl border border-[#DCE7F5] bg-[#F8FBFF] p-3"
                  key={service.id}
                >
                  <p className="truncate text-sm font-medium text-[#10203B]">{service.title}</p>
                  {service.price ? (
                    <p className="mt-0.5 text-xs text-[#6C7F95]">{service.price}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
          Profile actions
        </p>
        <Button
          asChild
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          type="button"
          variant="outline"
        >
          <Link href={`/admin/profiles?q=${encodeURIComponent(member.email)}`}>
            <ExternalLink data-icon="inline-start" />
            Open in profiles
          </Link>
        </Button>

        {member.portfolioImages && member.portfolioImages.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-[#D7E5F4] bg-white p-3">
            <p className="text-xs font-medium text-[#6C7F95]">
              Portfolio ({member.portfolioImages.length} images)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {member.portfolioImages.slice(0, 6).map((src, index) => (
                <a
                  className="relative aspect-square overflow-hidden rounded-lg border border-[#D7E5F4] bg-[#EEF6FF]"
                  href={src}
                  key={src}
                  rel="noreferrer"
                  target="_blank"
                >
                  <img
                    alt="Portfolio"
                    className="h-full w-full object-cover"
                    decoding="async"
                    loading={index < 3 ? "eager" : "lazy"}
                    src={thumbnailUrl(src, 256)}
                  />
                </a>
              ))}
            </div>
            {member.portfolioImages.length > 6 ? (
              <p className="text-[11px] tabular-nums text-[#8AA2BD]">
                +{member.portfolioImages.length - 6} more
              </p>
            ) : null}
          </div>
        ) : null}

        {member.specializations && member.specializations.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-[#6C7F95]">Specializations</p>
            <div className="flex flex-wrap gap-1.5">
              {member.specializations.map((s) => (
                <AdminStatusBadge key={s} tone="neutral">{s}</AdminStatusBadge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
