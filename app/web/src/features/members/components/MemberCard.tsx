import Link from "next/link";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MembersLocale, PublicMember } from "../types";
import {
  getMemberLocation,
  getMemberProfileHref,
  getMemberSpecialization,
  getMembershipBadgeLabel,
} from "../utils";
import { MemberAvatar } from "./MemberAvatar";

type MemberCardProps = {
  member: PublicMember;
  locale: MembersLocale;
  className?: string;
  priority?: boolean;
};

/**
 * Reusable, lightweight member card. Rendered on both the homepage preview and
 * the `/members` directory. The whole card is a link to the member's public
 * preview profile (`/profile-preview/[id]`). Server component — hover/focus
 * effects are pure CSS, so no client JS is shipped.
 */
export function MemberCard({ member, locale, className, priority }: MemberCardProps) {
  const href = getMemberProfileHref(member);
  const specialization = getMemberSpecialization(member);
  const location = getMemberLocation(member);
  const badge = getMembershipBadgeLabel(member.membershipCategory, locale);

  const card = (
    <article
      className={cn(
        "relative flex h-full flex-col items-center rounded-[28px] border border-[#D4E0F0] bg-white/80 px-5 py-7 text-center shadow-[0_18px_45px_rgba(11,31,68,0.08)] backdrop-blur-sm transition duration-300",
        "group-hover:-translate-y-1 group-hover:border-[#72A0C1]/45 group-hover:shadow-[0_28px_65px_rgba(11,31,68,0.16)]",
        className,
      )}
    >
      <MemberAvatar
        name={member.fullName}
        avatarUrl={member.avatarUrl}
        priority={priority}
        className="size-20 border-4 border-white text-lg shadow-[0_10px_26px_rgba(11,31,68,0.14)] ring-1 ring-[#D4E0F0]"
      />

      <h3 className="mt-4 line-clamp-1 text-base font-semibold tracking-[-0.01em] text-[#10203B]">
        {member.fullName}
      </h3>

      {specialization ? (
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#4C7D9D]">
          {specialization}
        </p>
      ) : null}

      {location ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#72A0C1]" />
          <span className="line-clamp-1">{location}</span>
        </p>
      ) : null}

      {badge ? (
        <span className="mt-4 inline-flex items-center rounded-full border border-[#72A0C1]/25 bg-[#F8FBFF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#21466D]">
          {badge}
        </span>
      ) : null}
    </article>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      aria-label={member.fullName}
      className="group block h-full rounded-[28px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72A0C1]/60 focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
