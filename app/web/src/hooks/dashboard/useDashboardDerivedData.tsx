"use client";

import {
  Award,
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Settings,
  ShieldCheck,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import type { TabType, SupportMode } from "@/components/dashboard/dashboard-types";
import {
  buildEventDiscountLabel,
  buildOnboardingChecklist,
  extractPriceFromText,
  formatMembershipCategory,
  formatStatusLabel,
  getDashboardStatus,
  getMembershipAmount,
  inferEventAudience,
} from "@/lib/dashboard-cabinet";
import {
  getLocation,
  getSnapshotItems,
  getSpecializationDisplay,
  type CombinedProfileData,
} from "@/lib/application-profile";
import { formatMemberId, getPublicProfileHref } from "@/lib/member-identity";

type EventAudienceFilter = "all" | "members" | "open";

type Params = {
  user: any;
  certificates: any[];
  profileData: any;
  dashboardMeta: any;
  dashboardAccessType: string;
  dashboardEvents: any[];
  eventAudienceFilter: EventAudienceFilter;
  hasNewEvents: boolean;
  unreadNotificationsCount: number;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  setSupportMode: React.Dispatch<React.SetStateAction<SupportMode>>;
};

function addOneYear(dateString?: string | null) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  date.setFullYear(date.getFullYear() + 1);
  return date;
}

function normalizeAccountTypeValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeExternalUrl(value?: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function useDashboardDerivedData({
  user,
  certificates,
  profileData,
  dashboardMeta,
  dashboardAccessType,
  dashboardEvents,
  eventAudienceFilter,
  hasNewEvents,
  unreadNotificationsCount,
  setActiveTab,
  setSupportMode,
}: Params) {
  const hasApprovedCert = certificates.some(
    (item) => item.status === "approved" || item.status === "paid",
  );

  const normalizedAccountType = useMemo(() => {
    const candidates = [
      profileData.type,
      profileData.accountType,
      profileData.applicationType,
      profileData.orderType,
      dashboardMeta.accountType,
      dashboardMeta.applicationType,
      dashboardMeta.orderType,
      certificates[0]?.accountType,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeAccountTypeValue(candidate);
      if (normalized) return normalized;
    }

    return "";
  }, [certificates, dashboardMeta, profileData]);

  const isPartnerAccount = normalizedAccountType === "partner";
  const isTeamMemberDashboard = dashboardAccessType === "partner_team_member";

  const isPartnerOwner =
    dashboardAccessType === "partner_owner" ||
    (isPartnerAccount && dashboardAccessType !== "partner_team_member");

  const showCertificatesTab = !isTeamMemberDashboard && !isPartnerOwner;

  const partnerTeamSummary =
    profileData.partnerTeamSummary || dashboardMeta.partnerTeam || null;

  const normalizedMembershipStatus = String(
    profileData.membershipStatus ?? dashboardMeta.membershipStatus ?? "",
  )
    .trim()
    .toLowerCase();

  const normalizedPaymentStatus = String(
    profileData.paymentStatus ?? dashboardMeta.paymentStatus ?? "",
  )
    .trim()
    .toLowerCase();

  const normalizedCertificateStatus = String(
    profileData.certificateStatus ?? dashboardMeta.certificateStatus ?? "",
  )
    .trim()
    .toLowerCase();

  const isMembershipActive =
    hasApprovedCert || normalizedPaymentStatus === "paid";

  const primaryCertificate = certificates[0];

  const mappedFirstName = String(profileData.firstName || "").trim();
  const mappedLastName = String(profileData.lastName || "").trim();
  const mappedFullName = String(profileData.fullName || "").trim();

  const clerkFullName = [user?.firstName || "", user?.lastName || ""]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullName =
    mappedFullName ||
    [mappedFirstName, mappedLastName].filter(Boolean).join(" ") ||
    clerkFullName ||
    "IBPA Member";

  const dashboardContactEmail = String(
    profileData.email ||
      primaryCertificate?.orderEmail ||
      user?.primaryEmailAddress?.emailAddress ||
      "",
  ).trim();

  const username =
    user?.username || dashboardContactEmail.split("@")[0] || "ibpa.member";

  const memberSinceDate = primaryCertificate?.createdAt
    ? new Date(primaryCertificate.createdAt)
    : user?.createdAt
      ? new Date(user.createdAt)
      : null;

  const memberSinceDisplay = memberSinceDate
    ? memberSinceDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Pending";

  const membershipExpiresAt = primaryCertificate?.expiresAt
    ? new Date(primaryCertificate.expiresAt)
    : addOneYear(primaryCertificate?.createdAt);

  const membershipExpiresDisplay = membershipExpiresAt
    ? membershipExpiresAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Pending";

  const membershipCategoryLabel = isTeamMemberDashboard
    ? "Partner Team Access"
    : isPartnerOwner
      ? "Partner Membership"
      : formatMembershipCategory(
          primaryCertificate?.membershipCategory ||
            profileData.membershipCategory,
        );

  const statusSummary = getDashboardStatus({
    isTeamMemberDashboard,
    isPartnerOwner,
    isMembershipActive,
    normalizedCertificateStatus,
    normalizedMembershipStatus,
  });

  const activeApplicationPayload = useMemo<Record<string, unknown>>(() => {
    if (
      primaryCertificate?.applicationPayload &&
      typeof primaryCertificate.applicationPayload === "object" &&
      !Array.isArray(primaryCertificate.applicationPayload)
    ) {
      return primaryCertificate.applicationPayload;
    }

    if (
      profileData.applicationPayload &&
      typeof profileData.applicationPayload === "object" &&
      !Array.isArray(profileData.applicationPayload)
    ) {
      return profileData.applicationPayload as Record<string, unknown>;
    }

    return {};
  }, [primaryCertificate?.applicationPayload, profileData.applicationPayload]);

  const mergedProfileData = useMemo<CombinedProfileData>(
    () => ({
      ...profileData,
      membershipCategory: (primaryCertificate?.membershipCategory ||
        profileData.membershipCategory ||
        null) as CombinedProfileData["membershipCategory"],
      applicantType:
        primaryCertificate?.applicantType || profileData.applicantType,
      specialization:
        (Array.isArray(activeApplicationPayload.specialization) &&
          activeApplicationPayload.specialization.filter(Boolean).join(", ")) ||
        (typeof activeApplicationPayload.specialization === "string" &&
          activeApplicationPayload.specialization) ||
        profileData.specialization ||
        null,
      experienceYears:
        (typeof activeApplicationPayload.yearsExperience === "string" &&
          activeApplicationPayload.yearsExperience) ||
        profileData.experienceYears ||
        null,
      education:
        (typeof activeApplicationPayload.educationDesc === "string" &&
          activeApplicationPayload.educationDesc) ||
        (typeof activeApplicationPayload.studentSchool === "string" &&
          activeApplicationPayload.studentSchool) ||
        profileData.education ||
        null,
      instagramUrl:
        (typeof activeApplicationPayload.instagramLink === "string" &&
          activeApplicationPayload.instagramLink) ||
        profileData.instagramUrl ||
        null,
      country:
        (typeof activeApplicationPayload.country === "string" &&
          activeApplicationPayload.country) ||
        profileData.country ||
        null,
      city:
        (typeof activeApplicationPayload.city === "string" &&
          activeApplicationPayload.city) ||
        profileData.city ||
        null,
      applicationPayload: activeApplicationPayload,
    }),
    [activeApplicationPayload, primaryCertificate, profileData],
  );

  const specializationDisplay = getSpecializationDisplay(mergedProfileData);
  const locationDisplay = getLocation(mergedProfileData);
  const snapshotItems = getSnapshotItems(mergedProfileData);
  const profileHeroImage = mergedProfileData.imageUrl || user?.imageUrl || null;

  const profileChecklist = buildOnboardingChecklist({
    profile: mergedProfileData,
    hasPhoto: Boolean(profileHeroImage),
    certificatesCount: certificates.length,
  });

  const memberIdDisplay = formatMemberId(
    profileData.orderId || primaryCertificate?.certNumber || user?.id,
  );

  const publicProfileHref = getPublicProfileHref(profileData.orderId);

  const instagramUrl = normalizeExternalUrl(mergedProfileData.instagramUrl);

  const websiteUrl = normalizeExternalUrl(
    typeof activeApplicationPayload.websiteLink === "string"
      ? activeApplicationPayload.websiteLink
      : null,
  );

  const achievementsSummary = String(
    profileData.achievements ||
      (typeof activeApplicationPayload.achievementsDesc === "string"
        ? activeApplicationPayload.achievementsDesc
        : "") ||
      "",
  ).trim();

  const certificateSummary = String(
    profileData.certificatesSummary || "",
  ).trim();

  const certificateStatusDisplay = formatStatusLabel(
    normalizedCertificateStatus,
    "Pending",
  );

  const partnerSeatPrice = partnerTeamSummary?.additionalSeatPrice ?? 100;

  const billingEntries = certificates.map((cert) => ({
    id: cert.certNumber,
    date: new Date(cert.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    amount: getMembershipAmount(cert.membershipCategory),
    status: cert.status,
    certificateUrl: cert.certificateUrl,
  }));

  const eventCards = dashboardEvents.map((item) => {
    const audience = inferEventAudience(item.title, item.body, item.ctaLabel);

    return {
      ...item,
      audience,
      dateDisplay: new Date(
        item.eventDate || item.createdAt,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      price:
        extractPriceFromText(item.body, item.ctaLabel) ||
        (audience === "members" ? "Members rate" : "TBD"),
      discountLabel: buildEventDiscountLabel({
        isMembershipActive,
        audience,
        membershipLabel: membershipCategoryLabel,
      }),
    };
  });

  const filteredEventCards = eventCards.filter(
    (item) =>
      eventAudienceFilter === "all" || item.audience === eventAudienceFilter,
  );

  const copyPublicLink = useCallback(() => {
    if (!publicProfileHref || typeof window === "undefined") {
      toast.error("Public profile link is not available yet.");
      return;
    }

    const absoluteUrl = `${window.location.origin}${publicProfileHref}`;

    navigator.clipboard
      .writeText(absoluteUrl)
      .then(() => toast.success("Public profile link copied."))
      .catch(() => toast.error("Could not copy the public profile link."));
  }, [publicProfileHref]);

  const quickActions = [
    {
      label: "Edit Profile",
      description: "Update photo, bio, and professional details.",
      icon: <User className="h-4 w-4" />,
      onClick: () => {
        window.location.href = "/dashboard/profile/edit";
      },
    },
    {
      label: "Upload Certificates",
      description: "Use support to send updated training proof.",
      icon: <Award className="h-4 w-4" />,
      onClick: () => {
        setActiveTab("support");
        setSupportMode("question");
      },
    },
    {
      label: "View Membership",
      description: "Review plan, expiry, and payment activity.",
      icon: <CreditCard className="h-4 w-4" />,
      onClick: () => setActiveTab("billing"),
    },
    {
      label: "Certificate Status",
      description: "Track verification and downloads.",
      icon: <ShieldCheck className="h-4 w-4" />,
      onClick: () =>
        setActiveTab(showCertificatesTab ? "certificates" : "billing"),
    },
    {
      label: "Member Directory",
      description: "Discover peers for networking and collaboration.",
      icon: <Users className="h-4 w-4" />,
      onClick: () => setActiveTab("directory"),
    },
    {
      label: "Events & Discounts",
      description: "Browse member events and current benefits.",
      icon: <CalendarDays className="h-4 w-4" />,
      onClick: () => setActiveTab("events"),
    },
    {
      label: "Support",
      description: "Ask a question, share an idea, or report an issue.",
      icon: <LifeBuoy className="h-4 w-4" />,
      onClick: () => setActiveTab("support"),
    },
  ];

  const overviewCards = [
    {
      label: "Member status",
      value: statusSummary.label,
      helper: statusSummary.description,
    },
    {
      label: "Member since",
      value: memberSinceDisplay,
      helper: "First linked activation date",
    },
    {
      label: "Membership type",
      value: membershipCategoryLabel,
      helper: "Current linked membership record",
    },
    {
      label: "Expiry date",
      value: membershipExpiresDisplay,
      helper: "Latest certificate or renewal date",
    },
  ];

  const navItems = [
    {
      key: "dashboard" as const,
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      key: "profile" as const,
      label: "Profile",
      icon: <User className="h-4 w-4" />,
    },
    ...(showCertificatesTab
      ? [
          {
            key: "certificates" as const,
            label: "My Certificates",
            icon: <Award className="h-4 w-4" />,
          },
        ]
      : []),
    ...(isPartnerOwner
      ? [
          {
            key: "teamMembers" as const,
            label: "Team Members",
            icon: <UserPlus className="h-4 w-4" />,
          },
        ]
      : []),
    {
      key: "billing" as const,
      label: "Billing & Membership",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      key: "events" as const,
      label: "Events & Benefits",
      icon: <CalendarDays className="h-4 w-4" />,
      accent: hasNewEvents ? (
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      ) : null,
    },
    {
      key: "directory" as const,
      label: "Member Directory",
      icon: <Search className="h-4 w-4" />,
    },
    {
      key: "support" as const,
      label: "Support",
      icon: <LifeBuoy className="h-4 w-4" />,
    },
    {
      key: "notifications" as const,
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      accent:
        unreadNotificationsCount > 0 ? (
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        ) : null,
    },
    {
      key: "settings" as const,
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return {
    hasApprovedCert,
    isTeamMemberDashboard,
    isPartnerOwner,
    isMembershipActive,
    showCertificatesTab,
    partnerTeamSummary,
    primaryCertificate,
    fullName,
    username,
    dashboardContactEmail,
    memberSinceDisplay,
    membershipExpiresDisplay,
    membershipCategoryLabel,
    statusSummary,
    mergedProfileData,
    specializationDisplay,
    locationDisplay,
    snapshotItems,
    profileHeroImage,
    profileChecklist,
    memberIdDisplay,
    publicProfileHref,
    instagramUrl,
    websiteUrl,
    achievementsSummary,
    certificateSummary,
    certificateStatusDisplay,
    partnerSeatPrice,
    billingEntries,
    filteredEventCards,
    copyPublicLink,
    quickActions,
    overviewCards,
    navItems,
  };
}
