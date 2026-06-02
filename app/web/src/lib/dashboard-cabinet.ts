import type { CombinedProfileData } from "@/lib/application-profile";

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

export function formatMembershipCategory(category?: string | null) {
  const normalized = String(category || "").trim().toLowerCase();

  switch (normalized) {
    case "student":
      return "Student Membership";
    case "specialist":
      return "Specialist Membership";
    case "professional":
      return "Professional Membership";
    case "trainer":
      return "Master Membership";
    case "business":
      return "Business Membership";
    case "brand":
      return "Partner Membership";
    case "partner":
      return "Partner Membership";
    default:
      return "Membership Review";
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

export function formatStatusLabel(value: unknown, fallback: string) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized) {
    return fallback;
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
      label: "Active",
      tone: "active" as DashboardStatusTone,
      description: "Partner team access is active.",
    };
  }

  if (isPartnerOwner) {
    return {
      label: "Verified",
      tone: "verified" as DashboardStatusTone,
      description: "Partner account is active and verified.",
    };
  }

  if (normalizedCertificateStatus === "issued" || normalizedCertificateStatus === "approved") {
    return {
      label: "Verified",
      tone: "verified" as DashboardStatusTone,
      description: "Membership and certificate are verified.",
    };
  }

  if (isMembershipActive) {
    return {
      label: "Active",
      tone: "active" as DashboardStatusTone,
      description: "Membership is active.",
    };
  }

  return {
    label: normalizedMembershipStatus === "review" ? "Pending" : "Pending",
    tone: "pending" as DashboardStatusTone,
    description: "Profile is awaiting review or activation.",
  };
}

function isMeaningful(value?: string | null) {
  return Boolean(String(value || "").trim());
}

export function buildOnboardingChecklist(params: {
  profile: CombinedProfileData;
  hasPhoto: boolean;
  certificatesCount: number;
}) {
  const { profile, hasPhoto, certificatesCount } = params;

  const items = [
    {
      key: "photo",
      label: "Upload photo",
      done: hasPhoto,
    },
    {
      key: "certificates",
      label: "Add certificates",
      done: certificatesCount > 0,
    },
    {
      key: "profile",
      label: "Complete profile",
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
}) {
  const { audience, isMembershipActive, membershipLabel } = params;

  if (!isMembershipActive) {
    return null;
  }

  if (audience === "open") {
    return "Member promo available";
  }

  return `${membershipLabel.replace(" Membership", "")} member perk`;
}
