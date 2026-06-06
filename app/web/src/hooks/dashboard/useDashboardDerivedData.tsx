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
import { getLocaleNumberFormat, useI18n } from "@/lib/i18n";

type EventRegistrationFilter = "all" | "registered" | "not_registered";

type Params = {
  user: any;
  certificates: any[];
  billingHistory: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt?: string | null;
  }>;
  profileData: any;
  dashboardMeta: any;
  dashboardAccessType: string;
  dashboardEvents: any[];
  eventRegistrationFilter: EventRegistrationFilter;
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
  billingHistory,
  profileData,
  dashboardMeta,
  dashboardAccessType,
  dashboardEvents,
  eventRegistrationFilter,
  hasNewEvents,
  unreadNotificationsCount,
  setActiveTab,
  setSupportMode,
}: Params) {
  const { locale, t } = useI18n();
  const dashboard = t.dashboard;
  const localeCode = getLocaleNumberFormat(locale);

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

  const showCertificatesTab = !isTeamMemberDashboard;

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
    ? memberSinceDate.toLocaleDateString(localeCode, {
        month: "short",
        year: "numeric",
      })
    : dashboard.statuses.pending;

  const membershipExpiresAt = primaryCertificate?.expiresAt
    ? new Date(primaryCertificate.expiresAt)
    : addOneYear(primaryCertificate?.createdAt);

  const membershipExpiresDisplay = membershipExpiresAt
    ? membershipExpiresAt.toLocaleDateString(localeCode, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : dashboard.statuses.pending;

  const membershipCategoryLabel = isTeamMemberDashboard
    ? dashboard.membershipCategories.partnerTeamAccess
    : isPartnerOwner
      ? dashboard.membershipCategories.partner
      : formatMembershipCategory(
          primaryCertificate?.membershipCategory ||
            profileData.membershipCategory,
          dashboard.membershipCategories,
        );

  const statusSummary = getDashboardStatus({
    isTeamMemberDashboard,
    isPartnerOwner,
    isMembershipActive,
    normalizedCertificateStatus,
    normalizedMembershipStatus,
  }, {
    ...dashboard.statusDescriptions,
    statuses: dashboard.statuses,
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
        profileData.experienceYears ||
        (typeof activeApplicationPayload.yearsExperience === "string" &&
          activeApplicationPayload.yearsExperience) ||
        null,
      education:
        profileData.education ||
        (typeof activeApplicationPayload.educationDesc === "string" &&
          activeApplicationPayload.educationDesc) ||
        (typeof activeApplicationPayload.studentSchool === "string" &&
          activeApplicationPayload.studentSchool) ||
        null,
      instagramUrl:
        profileData.instagramUrl ||
        (typeof activeApplicationPayload.instagramLink === "string" &&
          activeApplicationPayload.instagramLink) ||
        null,
      websiteUrl:
        profileData.websiteUrl ||
        (typeof activeApplicationPayload.websiteLink === "string" &&
          activeApplicationPayload.websiteLink) ||
        null,
      country:
        profileData.country ||
        (typeof activeApplicationPayload.country === "string" &&
          activeApplicationPayload.country) ||
        null,
      state:
        profileData.state ||
        (typeof activeApplicationPayload.state === "string" &&
          activeApplicationPayload.state) ||
        null,
      city:
        profileData.city ||
        (typeof activeApplicationPayload.city === "string" &&
          activeApplicationPayload.city) ||
        null,
      specializations:
        Array.isArray(profileData.specializations) && profileData.specializations.length > 0
          ? profileData.specializations
          : Array.isArray(activeApplicationPayload.specialization)
            ? activeApplicationPayload.specialization.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : null,
      portfolioImages:
        Array.isArray(profileData.portfolioImages) && profileData.portfolioImages.length > 0
          ? profileData.portfolioImages
          : Array.isArray(activeApplicationPayload.portfolioImages)
            ? activeApplicationPayload.portfolioImages.filter(
                (item): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              )
            : null,
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
  }, dashboard.checklist);

  const memberIdDisplay = formatMemberId(
    profileData.orderId || primaryCertificate?.certNumber || user?.id,
  );

  const publicProfileHref = getPublicProfileHref(profileData.id);

  const instagramUrl = normalizeExternalUrl(mergedProfileData.instagramUrl);

  const websiteUrl = normalizeExternalUrl(
    mergedProfileData.websiteUrl ||
      (typeof activeApplicationPayload.websiteLink === "string"
        ? activeApplicationPayload.websiteLink
        : null),
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
    dashboard.statuses.pending,
    dashboard.statuses,
  );

  const partnerSeatPrice = partnerTeamSummary?.additionalSeatPrice ?? 100;

  const billingEntries = billingHistory.map((entry) => ({
    id: entry.id,
    date: new Date(entry.paidAt || entry.createdAt).toLocaleDateString(localeCode, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    amount:
      entry.amount > 0
        ? new Intl.NumberFormat(localeCode, {
            style: "currency",
            currency: "USD",
          }).format(entry.amount / 100)
        : getMembershipAmount(primaryCertificate?.membershipCategory),
    status: entry.status,
  }));

  const eventCards = dashboardEvents.map((item) => {
    const audience = inferEventAudience(item.title, item.body, item.ctaLabel);

    return {
      ...item,
      audience,
      dateDisplay: new Date(
        item.eventDate || item.createdAt,
      ).toLocaleDateString(localeCode, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      price:
        extractPriceFromText(item.body, item.ctaLabel) ||
        (audience === "members" ? dashboard.events.membersRate : "TBD"),
      discountLabel: buildEventDiscountLabel({
        isMembershipActive,
        audience,
        membershipLabel: membershipCategoryLabel,
      }, dashboard.events),
    };
  });

  const filteredEventCards = eventCards.filter((item) => {
    const isRegistered =
      item.isRegistered === true ||
      String(item.registrationStatus || "").toUpperCase() === "REGISTERED";

    if (eventRegistrationFilter === "registered") {
      return isRegistered;
    }

    if (eventRegistrationFilter === "not_registered") {
      return !isRegistered;
    }

    return true;
  });

  const copyPublicLink = useCallback(() => {
    if (!publicProfileHref || typeof window === "undefined") {
      toast.error(dashboard.profile.copyPublicProfileUnavailable);
      return;
    }

    const absoluteUrl = `${window.location.origin}${publicProfileHref}`;

    navigator.clipboard
      .writeText(absoluteUrl)
      .then(() => toast.success(dashboard.profile.copyPublicProfileSuccess))
      .catch(() => toast.error(dashboard.profile.copyPublicProfileError));
  }, [
    dashboard.profile.copyPublicProfileError,
    dashboard.profile.copyPublicProfileSuccess,
    dashboard.profile.copyPublicProfileUnavailable,
    publicProfileHref,
  ]);

  const quickActions = [
    {
      label: dashboard.quickActions.editProfile.label,
      description: dashboard.quickActions.editProfile.description,
      icon: <User className="h-4 w-4" />,
      onClick: () => {
        window.location.href = "/dashboard/profile/edit";
      },
    },
    {
      label: dashboard.quickActions.certificateStatus.label,
      description: dashboard.quickActions.certificateStatus.description,
      icon: <ShieldCheck className="h-4 w-4" />,
      onClick: () =>
        setActiveTab(showCertificatesTab ? "certificates" : "billing"),
    },
    {
      label: dashboard.quickActions.viewMembership.label,
      description: dashboard.quickActions.viewMembership.description,
      icon: <CreditCard className="h-4 w-4" />,
      onClick: () => setActiveTab("billing"),
    },
    {
      label: dashboard.quickActions.memberDirectory.label,
      description: dashboard.quickActions.memberDirectory.description,
      icon: <Users className="h-4 w-4" />,
      onClick: () => setActiveTab("directory"),
    },
    {
      label: dashboard.quickActions.eventsAndDiscounts.label,
      description: dashboard.quickActions.eventsAndDiscounts.description,
      icon: <CalendarDays className="h-4 w-4" />,
      onClick: () => setActiveTab("events"),
    },
    {
      label: dashboard.quickActions.support.label,
      description: dashboard.quickActions.support.description,
      icon: <LifeBuoy className="h-4 w-4" />,
      onClick: () => setActiveTab("support"),
    },
  ];

  const overviewCards = [
    {
      label: dashboard.summaryCards.memberStatus,
      value: statusSummary.label,
      helper: statusSummary.description,
    },
    {
      label: dashboard.summaryCards.memberSince,
      value: memberSinceDisplay,
      helper: dashboard.summaryCards.activationDateHelper,
    },
    {
      label: dashboard.summaryCards.membershipType,
      value: membershipCategoryLabel,
      helper: dashboard.summaryCards.linkedMembershipHelper,
    },
    {
      label: dashboard.summaryCards.expiryDate,
      value: membershipExpiresDisplay,
      helper: dashboard.summaryCards.latestCertificateHelper,
    },
  ];

  const navItems = [
    {
      key: "dashboard" as const,
      label: dashboard.header.title,
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      key: "profile" as const,
      label: dashboard.overview.profile,
      icon: <User className="h-4 w-4" />,
    },
    ...(showCertificatesTab
      ? [
          {
            key: "certificates" as const,
            label: dashboard.certificates.eyebrow,
            icon: <Award className="h-4 w-4" />,
          },
        ]
      : []),
    ...(isPartnerOwner
      ? [
          {
            key: "teamMembers" as const,
            label: dashboard.teamMembers.title,
            icon: <UserPlus className="h-4 w-4" />,
          },
        ]
      : []),
    {
      key: "billing" as const,
      label: dashboard.billing.title,
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      key: "events" as const,
      label: dashboard.events.eyebrow,
      icon: <CalendarDays className="h-4 w-4" />,
      accent: hasNewEvents ? (
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      ) : null,
    },
    {
      key: "directory" as const,
      label: dashboard.directory.title,
      icon: <Search className="h-4 w-4" />,
    },
    {
      key: "support" as const,
      label: dashboard.support.eyebrow,
      icon: <LifeBuoy className="h-4 w-4" />,
    },
    {
      key: "accountSettings" as const,
      label: dashboard.account.title,
      icon: <Settings className="h-4 w-4" />,
    },
    {
      key: "notifications" as const,
      label: dashboard.notifications.navLabel,
      icon: <Bell className="h-4 w-4" />,
      accent:
        unreadNotificationsCount > 0 ? (
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        ) : null,
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
