export type DashboardCertificate = {
  certNumber: string;
  membershipCategory?: string | null;
  createdAt: string;
  expiresAt?: string | null;
};

export type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  category?: "membership" | "certificate" | "content" | "admin" | "system";
  priority?: "high" | "medium" | "low";
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

function inferNotificationCategory(notification: Pick<DashboardNotification, "title" | "description">) {
  const haystack = `${notification.title} ${notification.description}`.toLowerCase();

  if (haystack.includes("certificate") || haystack.includes("renewal") || haystack.includes("expire")) {
    return "certificate" as const;
  }

  if (haystack.includes("membership") || haystack.includes("application") || haystack.includes("review")) {
    return "membership" as const;
  }

  if (haystack.includes("news") || haystack.includes("event") || haystack.includes("update")) {
    return "content" as const;
  }

  return "admin" as const;
}

function inferNotificationPriority(notification: Pick<DashboardNotification, "title" | "description" | "unread">) {
  const haystack = `${notification.title} ${notification.description}`.toLowerCase();

  if (haystack.includes("expiring") || haystack.includes("expire") || haystack.includes("urgent")) {
    return "high" as const;
  }

  if (notification.unread) {
    return "medium" as const;
  }

  return "low" as const;
}

export function normalizeNotifications(notifications: DashboardNotification[]) {
  return notifications.map((item) => ({
    ...item,
    category: item.category || inferNotificationCategory(item),
    priority: item.priority || inferNotificationPriority(item),
  }));
}

export function buildSystemNotifications(params: {
  hasApprovedCert: boolean;
  membershipCategoryLabel: string;
  primaryCertificate?: DashboardCertificate;
  userCreatedAt?: string;
}): DashboardNotification[] {
  const {
    hasApprovedCert,
    membershipCategoryLabel,
    primaryCertificate,
    userCreatedAt,
  } = params;

  const now = new Date();
  const expiresAt = primaryCertificate?.expiresAt ? new Date(primaryCertificate.expiresAt) : null;
  const isExpiryValid = expiresAt && !Number.isNaN(expiresAt.getTime());
  const daysUntilExpiry = isExpiryValid
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const certificateValidUntilDisplay =
    isExpiryValid
      ? expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Pending";

  const notifications: DashboardNotification[] = [
    {
      id: "membership-status",
      title: hasApprovedCert ? "Membership Active" : "Application In Review",
      description: hasApprovedCert
        ? `${membershipCategoryLabel} is active in your dashboard profile.`
        : "Your membership application is still under review by the board.",
      timestamp: primaryCertificate?.createdAt || userCreatedAt || new Date().toISOString(),
      unread: false,
      category: "membership",
      priority: hasApprovedCert ? "low" : "medium",
    },
    {
      id: "certificate-validity",
      title: primaryCertificate ? "Certificate Validity" : "Certificate Pending",
      description: primaryCertificate
        ? `Your certificate remains valid until ${certificateValidUntilDisplay}.`
        : "A certificate number will appear here after approval and activation.",
      timestamp: primaryCertificate?.createdAt || userCreatedAt || new Date().toISOString(),
      unread: false,
      category: "certificate",
      priority: primaryCertificate ? "medium" : "low",
    },
    {
      id: "profile-access",
      title: "Profile Access Ready",
      description: "You can update your public profile details and account information from your dashboard profile.",
      timestamp: userCreatedAt || new Date().toISOString(),
      unread: false,
      category: "system",
      priority: "low",
    },
  ];

  if (hasApprovedCert && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14) {
    notifications.push({
      id: "renewal-reminder",
      title: "Certificate Expiring Soon",
      description: `Your certificate expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} on ${certificateValidUntilDisplay}.`,
      timestamp: primaryCertificate?.expiresAt || primaryCertificate?.createdAt || userCreatedAt || new Date().toISOString(),
      unread: true,
      category: "certificate",
      priority: "high",
    });
  }

  return normalizeNotifications(notifications).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
