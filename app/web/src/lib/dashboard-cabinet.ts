import type { ProfileRecordData } from "@/lib/profile-record";
import type { DashboardDictionary } from "@/lib/dashboard-i18n";

export type DashboardStatusTone = "pending" | "active" | "verified";

export type EventAudience = "members" | "open";

export type NotificationPreferenceKey =
  | "applicationUpdates"
  | "certificateReminders"
  | "membershipRenewal"
  | "eventInvitations"
  | "supportReplies";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const defaultNotificationPreferences: NotificationPreferences = {
  applicationUpdates: true,
  certificateReminders: true,
  membershipRenewal: true,
  eventInvitations: true,
  supportReplies: true,
};

export function addOneYear(dateString?: string | null) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  date.setFullYear(date.getFullYear() + 1);
  return date;
}

export function formatMembershipCategory(
  category?: string | null,
  labels?: DashboardDictionary["membershipCategories"],
) {
  const normalized = String(category || "").trim().toLowerCase();
  const fallbackLabels =
    labels ||
    ({
      student: "Student Membership",
      specialist: "Specialist Membership",
      professional: "Professional Membership",
      trainer: "Master Membership",
      business: "Business Membership",
      brand: "Partner Membership",
      partner: "Partner Membership",
      review: "Membership Review",
      partnerTeamAccess: "Partner Team Access",
    } satisfies DashboardDictionary["membershipCategories"]);

  switch (normalized) {
    case "student":
      return fallbackLabels.student;
    case "specialist":
      return fallbackLabels.specialist;
    case "professional":
      return fallbackLabels.professional;
    case "trainer":
      return fallbackLabels.trainer;
    case "business":
      return fallbackLabels.business;
    case "brand":
      return fallbackLabels.brand;
    case "partner":
      return fallbackLabels.partner;
    default:
      return fallbackLabels.review;
  }
}

export function getMembershipAmount(category?: string | null) {
  const normalized = String(category || "").trim().toLowerCase();

  switch (normalized) {
    case "student":
    case "specialist":
      return "$49";
    case "professional":
      return "$199";
    case "trainer":
      return "$399";
    case "business":
      return "$599";
    case "brand":
      return "$1,299";
    default:
      return "TBD";
  }
}

export function formatStatusLabel(
  value: unknown,
  fallback: string,
  labels?: DashboardDictionary["statuses"],
) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized) {
    return fallback;
  }

  if (labels?.[normalized]) {
    return labels[normalized];
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDashboardStatus(params: {
  isTeamMemberDashboard: boolean;
  isPartnerOwner: boolean;
  isMembershipActive: boolean;
  normalizedCertificateStatus?: string;
  normalizedMembershipStatus?: string;
}, copy?: DashboardDictionary["statusDescriptions"] & {
  statuses: DashboardDictionary["statuses"];
}) {
  const {
    isMembershipActive,
    isPartnerOwner,
    isTeamMemberDashboard,
    normalizedCertificateStatus = "",
    normalizedMembershipStatus = "",
  } = params;

  if (isTeamMemberDashboard) {
    return {
      label: copy?.statuses.active || "Active",
      tone: "active" as DashboardStatusTone,
      description: copy?.teamMemberActive || "Partner team access is active.",
    };
  }

  if (isPartnerOwner) {
    return {
      label: copy?.statuses.verified || "Verified",
      tone: "verified" as DashboardStatusTone,
      description:
        copy?.partnerVerified || "Partner account is active and verified.",
    };
  }

  if (normalizedCertificateStatus === "issued" || normalizedCertificateStatus === "approved") {
    return {
      label: copy?.statuses.verified || "Verified",
      tone: "verified" as DashboardStatusTone,
      description:
        copy?.membershipVerified || "Membership and certificate are verified.",
    };
  }

  if (isMembershipActive) {
    return {
      label: copy?.statuses.active || "Active",
      tone: "active" as DashboardStatusTone,
      description: copy?.membershipActive || "Membership is active.",
    };
  }

  return {
    label: copy?.statuses.pending || "Pending",
    tone: "pending" as DashboardStatusTone,
    description:
      copy?.membershipPending || "Profile is awaiting review or activation.",
  };
}

function isMeaningful(value?: string | null) {
  return Boolean(String(value || "").trim());
}

export function buildOnboardingChecklist(params: {
  profile: ProfileRecordData;
  hasPhoto: boolean;
  certificatesCount: number;
}, labels?: DashboardDictionary["checklist"]) {
  const { profile, hasPhoto, certificatesCount } = params;
  const copy =
    labels ||
    ({
      uploadPhoto: "Upload photo",
      addCertificates: "Add certificates",
      completeProfile: "Complete profile",
    } satisfies DashboardDictionary["checklist"]);

  const items = [
    {
      key: "photo",
      label: copy.uploadPhoto,
      done: hasPhoto,
    },
    {
      key: "certificates",
      label: copy.addCertificates,
      done: certificatesCount > 0,
    },
    {
      key: "profile",
      label: copy.completeProfile,
      done:
        isMeaningful(profile.bio) &&
        isMeaningful(profile.specialization) &&
        (isMeaningful(profile.country) || isMeaningful(profile.city)),
    },
  ] as const;

  const completed = items.filter((item) => item.done).length;

  return {
    items,
    completed,
    total: items.length,
    percentage: Math.round((completed / items.length) * 100),
  };
}

export function extractPriceFromText(...values: Array<string | null | undefined>) {
  const combined = values.filter(Boolean).join(" ");
  const match = combined.match(/\$\s?\d[\d,]*/);
  return match ? match[0].replace(/\s+/g, "") : null;
}

export function inferEventAudience(...values: Array<string | null | undefined>) {
  const combined = values.filter(Boolean).join(" ").toLowerCase();
  if (combined.includes("open to all") || combined.includes("public event")) {
    return "open" as EventAudience;
  }

  return "members" as EventAudience;
}

export function buildEventDiscountLabel(params: {
  isMembershipActive: boolean;
  audience: EventAudience;
  membershipLabel: string;
}, labels?: Pick<DashboardDictionary["events"], "memberPromo" | "memberPerk">) {
  const { audience, isMembershipActive, membershipLabel } = params;

  if (!isMembershipActive) {
    return null;
  }

  if (audience === "open") {
    return labels?.memberPromo || "Member promo available";
  }

  return labels?.memberPerk(membershipLabel) ||
    `${membershipLabel.replace(" Membership", "")} member perk`;
}
