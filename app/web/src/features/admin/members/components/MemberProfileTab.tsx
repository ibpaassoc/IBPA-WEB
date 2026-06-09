"use client";

import { ExternalLink, Globe, Instagram, MapPin } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatNullableText } from "../../shared/utils/admin-formatters";
import { initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord } from "../types/members-admin.types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

type Props = {
  member: AdminMemberRecord;
};

export function MemberProfileTab({ member }: Props) {
  const location = [member.city, member.state, member.country].filter(Boolean).join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      {/* Info */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="text-base font-semibold">
              {initialsFromName(member.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">{member.userName}</h3>
            <p className="truncate text-sm text-muted-foreground">{member.email}</p>
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
          <p className="text-sm leading-6 text-muted-foreground">{member.bio}</p>
        ) : null}

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Specialization" value={formatNullableText(member.specialization)} />
          <InfoRow label="Experience" value={formatNullableText(member.experienceYears ? `${member.experienceYears} years` : null)} />
          <InfoRow label="Education" value={formatNullableText(member.education)} />
          {location ? <InfoRow label="Location" value={location} /> : null}
        </dl>

        {(member.websiteUrl || member.instagramUrl) ? (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {member.websiteUrl ? (
                <a
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
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
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  href={member.instagramUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Instagram className="size-3.5" />
                  Instagram
                </a>
              ) : null}
            </div>
          </>
        ) : null}

        {member.services && member.services.length > 0 ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Services</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {member.services.slice(0, 4).map((service) => (
                  <div
                    className="rounded-lg border border-border bg-muted/20 p-2.5"
                    key={service.id}
                  >
                    <p className="truncate text-xs font-medium text-foreground">{service.title}</p>
                    {service.price ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{service.price}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p className="text-xs font-semibold text-muted-foreground">Profile actions</p>
        <Button asChild size="sm" type="button" variant="outline">
          <Link href={`/admin/profiles?q=${encodeURIComponent(member.email)}`}>
            <ExternalLink data-icon="inline-start" />
            Open in profiles
          </Link>
        </Button>
        {member.portfolioImages && member.portfolioImages.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Portfolio ({member.portfolioImages.length} images)
            </p>
            <div className="grid grid-cols-3 gap-1">
              {member.portfolioImages.slice(0, 6).map((src) => (
                <a href={src} key={src} rel="noreferrer" target="_blank">
                  <img
                    alt="Portfolio"
                    className="aspect-square rounded object-cover"
                    src={src}
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null}
        {member.specializations && member.specializations.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Specializations</p>
            <div className="flex flex-wrap gap-1">
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
