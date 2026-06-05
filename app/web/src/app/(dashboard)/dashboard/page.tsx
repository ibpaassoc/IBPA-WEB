"use client";

import { SignOutButton, UserButton, useUser, UserProfile } from "@clerk/nextjs";
import { LayoutDashboard, Settings, User, Bell, LogIn, Loader2, Award, FileText, Menu, X, CreditCard, ChevronRight, Download, Newspaper, CalendarDays, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { buildSystemNotifications, normalizeNotifications, type DashboardNotification } from "@/lib/notifications";
import { getLocation, getSpecializationDisplay, getProfileBadges, getSnapshotItems, type CombinedProfileData } from "@/lib/application-profile";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { TeamMembersPanel } from "@/components/dashboard/TeamMembersPanel";

interface Certificate {
  certNumber: string;
  orderEmail: string;
  orderName: string;
  accountType?: string | null;
  phone?: string | null;
  membershipCategory?: string | null;
  applicantType?: string | null;
  status: string;
  certificateUrl?: string | null;
  expiresAt?: string | null;
  applicationPayload?: Record<string, unknown> | null;
  createdAt: string;
}

type DashboardAccessType = "member" | "partner_owner" | "partner_team_member";

type TeamMemberAccessInfo = {
  id?: string;
  teamMemberId: string;
  fullName?: string;
  email?: string;
  role: string;
  licenseNumber: string;
  status: string;
  ownerMemberId: string;
  partnerBusinessName: string;
  partnerBusinessEmail: string;
};

type PartnerInvitedMember = {
  id: string;
  teamMemberId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
};

type PartnerTeamSummary = {
  includedSeats: number;
  includedUsed: number;
  includedRemaining: number;
  usedSeats: number;
  remainingSeats: number;
  totalAllowedSeats: number;
  additionalUsed: number;
  paidAdditionalSeats: number;
  pendingSeatExtensionSeats: number;
  pendingSeatExtensionRequests: number;
  additionalSeatPrice: number;
  canInvite: boolean;
  inviteDisabledReason: string | null;
  invitedMembers: PartnerInvitedMember[];
};

type DashboardProfileData = CombinedProfileData & {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  achievements?: string | null;
  certificatesSummary?: string | null;
  type?: string | null;
  accountType?: string | null;
  applicationType?: string | null;
  orderType?: string | null;
  membershipStatus?: string | null;
  paymentStatus?: string | null;
  certificateStatus?: string | null;
  partnerTeamSummary?: PartnerTeamSummary | null;
  dashboardAccessType?: DashboardAccessType | null;
  teamMember?: TeamMemberAccessInfo;
};

type DashboardMeta = {
  accountType?: string | null;
  applicationType?: string | null;
  orderType?: string | null;
  membershipStatus?: string | null;
  paymentStatus?: string | null;
  certificateStatus?: string | null;
  partnerTeam?: PartnerTeamSummary | null;
};

type ContentTabType = 'news' | 'events';
type TabType = 'profile' | 'billing' | 'certificates' | 'teamMembers' | 'settings' | 'notifications' | ContentTabType;

type DashboardContentItem = {
  id: string;
  type: ContentTabType;
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  createdAt: string;
};

const DASHBOARD_NEWS_SEEN_KEY = "ibpa-dashboard-news-seen";
const DASHBOARD_EVENTS_SEEN_KEY = "ibpa-dashboard-events-seen";
const DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY = "ibpa-dashboard-system-notifications-seen";

function getNotificationSignature(notification: DashboardNotification) {
  return `${notification.id}:${notification.timestamp}`;
}

function getNotificationMeta(notification: DashboardNotification) {
  const category = notification.category || "admin";
  const priority = notification.priority || "medium";

  const categoryLabelMap: Record<string, string> = {
    membership: "Membership",
    certificate: "Certificate",
    content: "Content",
    admin: "Admin",
    system: "System",
  };

  const priorityLabelMap: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const categoryClassMap: Record<string, string> = {
    membership: "border border-sky-200 bg-sky-50 text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    certificate: "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    content: "border border-violet-200 bg-violet-50 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    admin: "border border-amber-200 bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    system: "border border-slate-200 bg-slate-100 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  };

  const priorityClassMap: Record<string, string> = {
    high: "border border-rose-200 bg-rose-50 text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    medium: "border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    low: "border border-zinc-200 bg-zinc-100 text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  };

  return {
    categoryLabel: categoryLabelMap[category],
    priorityLabel: priorityLabelMap[priority],
    categoryClassName: categoryClassMap[category],
    priorityClassName: priorityClassMap[priority],
  };
}

function formatMembershipCategory(category?: string | null) {
  const normalized = String(category || "").trim().toLowerCase();

  switch (normalized) {
    case "student":
    case "specialist":
      return "Specialist Membership";
    case "professional":
      return "Professional Membership";
    case "trainer":
      return "Trainer Membership";
    case "business":
      return "Business Membership";
    case "brand":
      return "Brand Membership";
    case "partner":
      return "Partner Membership";
    default:
      return "Membership Review";
  }
}

function addOneYear(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

function getMembershipAmount(category?: string | null) {
  const normalized = String(category || "").trim().toLowerCase();

  switch (normalized) {
    case "student":
    case "specialist":
      return "$49.00";
    case "professional":
      return "$199.00";
    case "trainer":
      return "$399.00";
    case "business":
      return "$599.00";
    case "brand":
      return "$1,299.00";
    case "partner":
      return "Pending";
    default:
      return "Pending";
  }
}

function normalizeAccountTypeValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function formatStatusLabel(value: unknown, fallback: string) {
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

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [profileData, setProfileData] = useState<DashboardProfileData>({});
  const [dashboardMeta, setDashboardMeta] = useState<DashboardMeta>({});
  const [dashboardAccessType, setDashboardAccessType] = useState<DashboardAccessType>("member");
  const [teamMemberAccess, setTeamMemberAccess] = useState<TeamMemberAccessInfo | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessErrorMessage, setAccessErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [customNotifications, setCustomNotifications] = useState<DashboardNotification[]>([]);
  const [dashboardNews, setDashboardNews] = useState<DashboardContentItem[]>([]);
  const [dashboardEvents, setDashboardEvents] = useState<DashboardContentItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSeenNewsAt, setLastSeenNewsAt] = useState<string | null>(null);
  const [lastSeenEventsAt, setLastSeenEventsAt] = useState<string | null>(null);
  const [seenSystemNotifications, setSeenSystemNotifications] = useState<string[]>([]);

  const markNotificationsAsRead = useCallback(async (ids?: string[]) => {
    const normalizedIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    if (normalizedIds.length === 0) {
      return;
    }

    try {
      const res = await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: normalizedIds }),
      });

      if (!res.ok) {
        return;
      }

      setCustomNotifications((prev) =>
        prev.map((item) => (normalizedIds.includes(item.id) ? { ...item, unread: false } : item)),
      );
    } catch {
      // Preserve the current UI state if the read-sync request fails.
    }
  }, []);

  const refreshDashboardData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!isSignedIn) {
        setCertificates([]);
        setProfileData({});
        setCustomNotifications([]);
        setDashboardNews([]);
        setDashboardEvents([]);
        setAccessBlocked(false);
        setAccessErrorMessage(null);
        setDashboardMeta({});
        setDashboardAccessType("member");
        setTeamMemberAccess(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const [certRes, profRes, notificationsRes, newsRes, eventsRes] = await Promise.all([
          fetch("/api/dashboard/me", { cache: "no-store" }),
          fetch("/api/dashboard/profile", { cache: "no-store" }),
          fetch("/api/dashboard/notifications", { cache: "no-store" }),
          fetch("/api/content?type=news&target=dashboard", { cache: "no-store" }),
          fetch("/api/content?type=events&target=dashboard", { cache: "no-store" }),
        ]);

        if (certRes.status === 401 || profRes.status === 401) {
          console.warn("[Dashboard] API returned 401");
          setCertificates([]);
          setProfileData({});
          setDashboardMeta({});
          setDashboardAccessType("member");
          setTeamMemberAccess(null);
          setCustomNotifications([]);
          setDashboardNews([]);
          setDashboardEvents([]);
          return;
        }

        if (certRes.status === 403 || profRes.status === 403) {
          setAccessBlocked(true);
          setAccessErrorMessage(
            "This dashboard is available only after your IBPA membership payment has been completed and activated.",
          );
          setCertificates([]);
          setProfileData({});
          setDashboardMeta({});
          setDashboardAccessType("member");
          setTeamMemberAccess(null);
          setCustomNotifications([]);
          setDashboardNews([]);
          setDashboardEvents([]);
          return;
        }

        const [certData, profileJson, notificationsJson, newsJson, eventsJson] = await Promise.all([
          certRes.ok ? certRes.json() : Promise.resolve(null),
          profRes.ok ? profRes.json() : Promise.resolve(null),
          notificationsRes.ok ? notificationsRes.json() : Promise.resolve(null),
          newsRes.ok ? newsRes.json() : Promise.resolve(null),
          eventsRes.ok ? eventsRes.json() : Promise.resolve(null),
        ]);

        if (certRes.ok && certData) {
          setAccessBlocked(false);
          setAccessErrorMessage(null);
          setCertificates(Array.isArray(certData.certificates) ? certData.certificates : []);
          setDashboardMeta({
            accountType: typeof certData?.accountType === "string" ? certData.accountType : null,
            applicationType: typeof certData?.applicationType === "string" ? certData.applicationType : null,
            orderType: typeof certData?.orderType === "string" ? certData.orderType : null,
            membershipStatus: typeof certData?.membershipStatus === "string" ? certData.membershipStatus : null,
            paymentStatus: typeof certData?.paymentStatus === "string" ? certData.paymentStatus : null,
            certificateStatus: typeof certData?.certificateStatus === "string" ? certData.certificateStatus : null,
            partnerTeam:
              certData?.partnerTeam && typeof certData.partnerTeam === "object"
                ? (certData.partnerTeam as PartnerTeamSummary)
                : null,
          });
          const accessFromMe = certData?.dashboardAccess?.type;
          if (accessFromMe === "member" || accessFromMe === "partner_owner" || accessFromMe === "partner_team_member") {
            setDashboardAccessType(accessFromMe);
          }

          if (accessFromMe === "partner_team_member" && certData?.dashboardAccess) {
            setTeamMemberAccess({
              teamMemberId: certData.dashboardAccess.teamMemberId || "Pending",
              role: certData.dashboardAccess.role || "Team Member",
              licenseNumber: certData.dashboardAccess.licenseNumber || "Not provided",
              status: certData.dashboardAccess.teamMemberStatus || "invited",
              ownerMemberId: certData.dashboardAccess.ownerMemberId || "IBPA-BO-001",
              partnerBusinessName: certData.dashboardAccess.partnerName || "Partner Account",
              partnerBusinessEmail: certData.dashboardAccess.partnerEmail || "Not provided",
            });
          } else {
            setTeamMemberAccess(null);
          }
        }

        if (profRes.ok && profileJson) {
          const nextProfile = (profileJson.profile || {}) as DashboardProfileData;
          setProfileData(nextProfile);
          setDashboardMeta((prev) => ({
            accountType:
              typeof nextProfile.accountType === "string"
                ? nextProfile.accountType
                : prev.accountType ?? null,
            applicationType:
              typeof nextProfile.applicationType === "string"
                ? nextProfile.applicationType
                : prev.applicationType ?? null,
            orderType:
              typeof nextProfile.orderType === "string"
                ? nextProfile.orderType
                : prev.orderType ?? null,
            membershipStatus:
              typeof nextProfile.membershipStatus === "string"
                ? nextProfile.membershipStatus
                : prev.membershipStatus ?? null,
            paymentStatus:
              typeof nextProfile.paymentStatus === "string"
                ? nextProfile.paymentStatus
                : prev.paymentStatus ?? null,
            certificateStatus:
              typeof nextProfile.certificateStatus === "string"
                ? nextProfile.certificateStatus
                : prev.certificateStatus ?? null,
            partnerTeam: nextProfile.partnerTeamSummary ?? prev.partnerTeam ?? null,
          }));

          const accessFromProfile = nextProfile.dashboardAccessType;
          if (accessFromProfile === "member" || accessFromProfile === "partner_owner" || accessFromProfile === "partner_team_member") {
            setDashboardAccessType(accessFromProfile);
          }

          if (nextProfile.teamMember) {
            setTeamMemberAccess(nextProfile.teamMember);
          } else if (accessFromProfile !== "partner_team_member") {
            setTeamMemberAccess(null);
          }
        }

        if (notificationsRes.ok && notificationsJson) {
          setCustomNotifications(normalizeNotifications(Array.isArray(notificationsJson.notifications) ? notificationsJson.notifications : []));
        }

        if (newsRes.ok && newsJson) {
          setDashboardNews(Array.isArray(newsJson.items) ? newsJson.items : []);
        }

        if (eventsRes.ok && eventsJson) {
          setDashboardEvents(Array.isArray(eventsJson.items) ? eventsJson.items : []);
        }

        setLastSyncedAt(new Date().toISOString());

        if (!silent) {
          if (!certRes.ok) toast.error("Failed to load certificate data.");
          if (!profRes.ok) toast.error("Failed to load profile data.");
          if (!notificationsRes.ok) toast.error("Failed to load notifications.");
          if (!newsRes.ok) toast.error("Failed to load news.");
          if (!eventsRes.ok) toast.error("Failed to load events.");
        }
      } catch (err) {
        console.error("[Dashboard] Network error:", err);
        if (!silent) {
          toast.error("Connection error. Please check your internet and try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn],
  );

  useEffect(() => {
    if (userLoaded) {
      void refreshDashboardData();
    }
  }, [userLoaded, refreshDashboardData]);

  useEffect(() => {
    if (!userLoaded || !isSignedIn || typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshDashboardData({ silent: true });
    }, 30000);

    const handleFocus = () => {
      void refreshDashboardData({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshDashboardData({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSignedIn, refreshDashboardData, userLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncExpandedState = (event?: MediaQueryListEvent) => {
      setIsProfileExpanded(event ? event.matches : mediaQuery.matches);
    };

    syncExpandedState();
    mediaQuery.addEventListener("change", syncExpandedState);

    return () => mediaQuery.removeEventListener("change", syncExpandedState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;

    if (isNotificationsOpen) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = previousOverflow || "";
    }

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setLastSeenNewsAt(window.localStorage.getItem(DASHBOARD_NEWS_SEEN_KEY));
    setLastSeenEventsAt(window.localStorage.getItem(DASHBOARD_EVENTS_SEEN_KEY));
    try {
      const stored = window.localStorage.getItem(DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY);
      setSeenSystemNotifications(stored ? JSON.parse(stored) : []);
    } catch {
      setSeenSystemNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (activeTab === "news") {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(DASHBOARD_NEWS_SEEN_KEY, timestamp);
      setLastSeenNewsAt(timestamp);
    }

    if (activeTab === "events") {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(DASHBOARD_EVENTS_SEEN_KEY, timestamp);
      setLastSeenEventsAt(timestamp);
    }
  }, [activeTab]);

  const hasApprovedCert = certificates.some(c => c.status === "approved" || c.status === "paid");
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
      if (normalized) {
        return normalized;
      }
    }

    return "";
  }, [
    certificates,
    dashboardMeta.accountType,
    dashboardMeta.applicationType,
    dashboardMeta.orderType,
    profileData.accountType,
    profileData.applicationType,
    profileData.orderType,
    profileData.type,
  ]);
  const isPartnerAccount = normalizedAccountType === "partner";
  const isTeamMemberDashboard = dashboardAccessType === "partner_team_member";
  const isPartnerOwner =
    dashboardAccessType === "partner_owner" || (isPartnerAccount && dashboardAccessType !== "partner_team_member");
  const showCertificatesTab = !isTeamMemberDashboard && !isPartnerOwner;
  const partnerTeamSummary = profileData.partnerTeamSummary || dashboardMeta.partnerTeam || null;
  const normalizedMembershipStatus = String(
    profileData.membershipStatus ?? dashboardMeta.membershipStatus ?? "",
  ).trim().toLowerCase();
  const normalizedPaymentStatus = String(profileData.paymentStatus ?? dashboardMeta.paymentStatus ?? "")
    .trim()
    .toLowerCase();
  const normalizedCertificateStatus = String(
    profileData.certificateStatus ?? dashboardMeta.certificateStatus ?? "",
  ).trim().toLowerCase();
  const isMembershipActive = hasApprovedCert || normalizedPaymentStatus === "paid";
  const membershipStatus =
    isTeamMemberDashboard
      ? "Team Member"
      : isPartnerOwner
        ? "Partner Account"
        : isMembershipActive
          ? "IBPA Member"
          : normalizedMembershipStatus === "review"
          ? "Pending Review"
            : "Guest";
  const primaryCertificate = certificates[0];
  const mappedFirstName = String(profileData.firstName || "").trim();
  const mappedLastName = String(profileData.lastName || "").trim();
  const mappedFullName = String(profileData.fullName || "").trim();
  const clerkFullName = [user?.firstName || "", user?.lastName || ""].filter(Boolean).join(" ").trim();
  const firstName = mappedFirstName || user?.firstName || "Member";
  const lastName = mappedLastName || user?.lastName || "";
  const fullName = mappedFullName || [mappedFirstName, mappedLastName].filter(Boolean).join(" ") || clerkFullName || "Member";
  const dashboardContactEmail =
    String(profileData.email || primaryCertificate?.orderEmail || user?.primaryEmailAddress?.emailAddress || "").trim();
  const username = user?.username || dashboardContactEmail.split("@")[0] || "ibpa.member";
  const memberSinceDate = primaryCertificate?.createdAt ? new Date(primaryCertificate.createdAt) : user?.createdAt ? new Date(user.createdAt) : null;
  const memberSinceDisplay = memberSinceDate
    ? memberSinceDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Pending";
  const certificateValidUntil = addOneYear(primaryCertificate?.createdAt);
  const certificateValidUntilDate = primaryCertificate?.expiresAt ? new Date(primaryCertificate.expiresAt) : certificateValidUntil;
  const certificateValidUntilDisplay = certificateValidUntilDate
    ? certificateValidUntilDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Pending";
  const certificateStatusDisplay = formatStatusLabel(normalizedCertificateStatus, "Pending");
  const primaryCertificateNumber = isPartnerOwner
    ? "Partner Team Access"
    : primaryCertificate?.certNumber || "Pending Review";
  const membershipCategoryLabel = isTeamMemberDashboard
    ? "Partner Team Access"
    : isPartnerOwner
      ? "Partner Membership"
      : formatMembershipCategory(primaryCertificate?.membershipCategory || profileData.membershipCategory);

  useEffect(() => {
    if (isTeamMemberDashboard && (activeTab === "billing" || activeTab === "certificates" || activeTab === "teamMembers")) {
      setActiveTab("profile");
      return;
    }

    if (isPartnerOwner && activeTab === "certificates") {
      setActiveTab("billing");
    }
  }, [activeTab, isPartnerOwner, isTeamMemberDashboard]);
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
      membershipCategory: (primaryCertificate?.membershipCategory || profileData.membershipCategory || null) as CombinedProfileData["membershipCategory"],
      applicantType: primaryCertificate?.applicantType || profileData.applicantType,
      specialization:
        (Array.isArray(activeApplicationPayload.specialization) && activeApplicationPayload.specialization.filter(Boolean).join(", ")) ||
        (typeof activeApplicationPayload.specialization === "string" && activeApplicationPayload.specialization) ||
        profileData.specialization ||
        null,
      experienceYears:
        (typeof activeApplicationPayload.yearsExperience === "string" && activeApplicationPayload.yearsExperience) ||
        profileData.experienceYears ||
        null,
      education:
        (typeof activeApplicationPayload.educationDesc === "string" && activeApplicationPayload.educationDesc) ||
        (typeof activeApplicationPayload.studentSchool === "string" && activeApplicationPayload.studentSchool) ||
        profileData.education ||
        null,
      instagramUrl:
        (typeof activeApplicationPayload.instagramLink === "string" && activeApplicationPayload.instagramLink) ||
        profileData.instagramUrl ||
        null,
      country:
        (typeof activeApplicationPayload.country === "string" && activeApplicationPayload.country) ||
        profileData.country ||
        null,
      city:
        (typeof activeApplicationPayload.city === "string" && activeApplicationPayload.city) ||
        profileData.city ||
        null,
      applicationPayload: activeApplicationPayload,
    }),
    [activeApplicationPayload, primaryCertificate, profileData],
  );
  const specializationDisplay = getSpecializationDisplay(mergedProfileData);
  const locationDisplay = getLocation(mergedProfileData);
  const snapshotItems = getSnapshotItems(mergedProfileData);
  const profileStatusForBadges = primaryCertificate?.status || (isMembershipActive ? "paid" : normalizedMembershipStatus || "pending");
  const profileTags = getProfileBadges(mergedProfileData, profileStatusForBadges, membershipCategoryLabel);
  const profileHeroImage =
    mergedProfileData.imageUrl ||
    user?.imageUrl ||
    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=2080&auto=format&fit=crop";
  
  const quickStats = [
    { label: "Member Since", value: memberSinceDisplay },
    { label: "Specialization", value: specializationDisplay },
    { label: "Location", value: locationDisplay },
  ];
  
  const profileToggleLabel = useMemo(
    () => (isProfileExpanded ? "Hide Details" : "Show Details"),
    [isProfileExpanded]
  );
  
  const systemNotifications = useMemo(
    () =>
      buildSystemNotifications({
        hasApprovedCert,
        membershipCategoryLabel,
        primaryCertificate,
      userCreatedAt: user?.createdAt?.toISOString(),
    }),
    [hasApprovedCert, membershipCategoryLabel, primaryCertificate, user?.createdAt]
  );
  const allNotifications = useMemo(() => {
    const normalizedSystemNotifications = systemNotifications.map((item) => ({
      ...item,
      unread: item.unread && !seenSystemNotifications.includes(getNotificationSignature(item)),
    }));

    return normalizeNotifications([...customNotifications, ...normalizedSystemNotifications]).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [customNotifications, seenSystemNotifications, systemNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const unreadCustomIds = customNotifications.filter((item) => item.unread).map((item) => item.id);
    if (unreadCustomIds.length > 0) {
      void markNotificationsAsRead(unreadCustomIds);
    }

    if (typeof window !== "undefined") {
      const signatures = systemNotifications.map(getNotificationSignature);
      const nextSeen = Array.from(new Set([...seenSystemNotifications, ...signatures]));
      if (nextSeen.length !== seenSystemNotifications.length) {
        window.localStorage.setItem(DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY, JSON.stringify(nextSeen));
        setSeenSystemNotifications(nextSeen);
      }
    }
  }, [customNotifications, isNotificationsOpen, markNotificationsAsRead, seenSystemNotifications, systemNotifications]);
  const unreadNotificationsCount = allNotifications.filter((item) => item.unread).length;
  const visibleNotifications = allNotifications.slice(0, 3);
  const latestNewsAt = dashboardNews[0]?.createdAt || null;
  const latestEventsAt = dashboardEvents[0]?.createdAt || null;
  const hasNewNews = Boolean(latestNewsAt && (!lastSeenNewsAt || new Date(latestNewsAt).getTime() > new Date(lastSeenNewsAt).getTime()));
  const hasNewEvents = Boolean(latestEventsAt && (!lastSeenEventsAt || new Date(latestEventsAt).getTime() > new Date(lastSeenEventsAt).getTime()));
  const includedPartnerSeats = partnerTeamSummary?.includedSeats ?? 5;
  const usedPartnerSeats = partnerTeamSummary?.usedSeats ?? 0;
  const remainingPartnerSeats = partnerTeamSummary?.remainingSeats ?? includedPartnerSeats;
  const pendingPartnerSeatRequests = partnerTeamSummary?.pendingSeatExtensionRequests ?? 0;
  const partnerSeatPrice = partnerTeamSummary?.additionalSeatPrice ?? 100;
  const invitedPartnerMembers = partnerTeamSummary?.invitedMembers || [];
  const membershipAmount = isPartnerOwner
    ? `${includedPartnerSeats} included seats`
    : getMembershipAmount(primaryCertificate?.membershipCategory);
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

  const renderContentList = (items: DashboardContentItem[], type: ContentTabType) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">{type === "news" ? "News" : "Events"}</p>
        <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">
          {type === "news" ? "Member News Feed" : "Member Events Feed"}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
          {type === "news"
            ? "Association updates and editorial announcements published for dashboard members."
            : "Professional events and registrations published for dashboard members."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          No {type} items published to dashboard yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
              {item.coverImage && (
                <div className="overflow-hidden rounded-[40px]" style={{ aspectRatio: item.coverAspect ?? 16 / 9 }}>
                  <ImageWithFallback src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#72A0C1]">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {item.isPinned && (
                  <div className="mt-3">
                    <span className="rounded-full bg-[#72A0C1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Pinned
                    </span>
                  </div>
                )}
                <h4 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-3xl">{item.title}</h4>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-500 md:text-base">{item.body}</p>
                {item.ctaUrl && (
                  <div className="mt-6">
                    <a
                      href={item.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#72A0C1]"
                    >
                      {item.ctaLabel || "Open Link"}
                    </a>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderContent = () => {
    if (activeTab === 'news') return renderContentList(dashboardNews, 'news');
    if (activeTab === 'events') return renderContentList(dashboardEvents, 'events');
    if (activeTab === "teamMembers") return <TeamMembersPanel enabled={isPartnerOwner} />;

    if (activeTab === 'billing') {
      if (isPartnerOwner) {
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 md:space-y-8">
            <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[#B9D9EB]/5 rounded-l-[200px] z-0 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-[#72A0C1] text-[10px] tracking-[0.4em] font-bold uppercase mb-2 opacity-70">Partner Access</p>
                  <h2 className="text-3xl md:text-5xl uppercase font-anton mb-2">Team <span className="text-[#72A0C1]">&</span> Membership.</h2>
                  <p className="text-slate-400 text-xs font-light">Manage your partner account seats, invited members, and educational team access.</p>
                </div>
                <Link href="/contact" className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#72A0C1] transition-all shadow-xl shadow-black/10 text-center">
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-6 right-8">
                    <div className="w-12 h-12 bg-[#72A0C1]/10 rounded-full flex items-center justify-center text-[#72A0C1]">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Active Plan</h3>
                  <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
                    <p className="text-4xl md:text-5xl font-anton text-slate-900 uppercase">Partner</p>
                    <p className="text-[#72A0C1] text-xs font-bold mb-2">/ Team Access</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-slate-50">
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Included Seats</p>
                      <p className="text-sm font-bold text-slate-700">{includedPartnerSeats}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Used Seats</p>
                      <p className="text-sm font-bold text-slate-700">{usedPartnerSeats}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Remaining Seats</p>
                      <p className="text-sm font-bold text-slate-700">{remainingPartnerSeats}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Members</h3>
                    {lastSyncedAt && <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Updated {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>}
                  </div>

                  {invitedPartnerMembers.length > 0 ? (
                    <div className="space-y-4">
                      {invitedPartnerMembers.map((member) => (
                        <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-900">{member.fullName}</p>
                            <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                            <p className="mt-1 text-xs text-slate-500">{member.role}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{member.teamMemberId}</span>
                            <span className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
                              member.status === "active"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-amber-200 bg-amber-50 text-amber-700"
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-400">
                      You have not invited any team members yet.
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab("teamMembers")}
                      className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1]"
                    >
                      Manage Team Members
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#72A0C1]/20 rounded-full blur-2xl" />
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Partner Record</h3>
                  <div className="space-y-3 mb-8">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Category</p>
                      <p className="mt-1 text-xs font-bold">Partner Membership</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Payment Status</p>
                      <p className="mt-1 text-xs font-bold">{formatStatusLabel(normalizedPaymentStatus, "Pending")}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Certificate Status</p>
                      <p className="mt-1 text-xs font-bold">{certificateStatusDisplay}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Pending Seat Requests</p>
                      <p className="mt-1 text-xs font-bold">{pendingPartnerSeatRequests}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("teamMembers")}
                    className="w-full py-3 bg-white/10 border border-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-white/15"
                  >
                    Extend Seats ({partnerSeatPrice} USD, payment required)
                  </button>
                </div>

                <div className="bg-[#B9D9EB]/10 p-8 rounded-[32px] border border-[#B9D9EB]/20">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Partner Support</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 font-light">
                    Questions about partner seats or billing? Our support team is here to help.
                  </p>
                  <Link href="/contact" className="flex items-center gap-2 text-[10px] font-bold text-[#72A0C1] uppercase tracking-widest group">
                    Contact Team <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 md:space-y-8">
          {/* Header Section */}
          <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-[#B9D9EB]/5 rounded-l-[200px] z-0 pointer-events-none" />
             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-[#72A0C1] text-[10px] tracking-[0.4em] font-bold uppercase mb-2 opacity-70">Membership</p>
                  <h2 className="text-3xl md:text-5xl uppercase font-anton mb-2">Billing <span className="text-[#72A0C1]">&</span> Subscription.</h2>
                  <p className="text-slate-400 text-xs font-light">Manage your membership status, certificate timeline, and account records.</p>
                </div>
                <Link href="/contact" className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#72A0C1] transition-all shadow-xl shadow-black/10 text-center">
                   Contact Support
                </Link>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Main Billing Info */}
             <div className="lg:col-span-2 space-y-6">
                {/* Active Plan Widget */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative group overflow-hidden">
                   <div className="absolute top-6 right-8">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                         <Award className="w-6 h-6" />
                      </div>
                   </div>
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Active Plan</h3>
                   <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
                      <p className="text-4xl md:text-5xl font-anton text-slate-900 uppercase">{membershipStatus}</p>
                      <p className="text-[#72A0C1] text-xs font-bold mb-2">/ Annual</p>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-slate-50">
                      <div>
                         <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Next Payment</p>
                         <p className="text-sm font-bold text-slate-700">{certificateValidUntilDisplay}</p>
                      </div>
                      <div>
                         <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Amount</p>
                         <p className="text-sm font-bold text-slate-700">{membershipAmount}</p>
                      </div>
                      <div className="hidden md:block">
                         <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-1">Status</p>
                         <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isMembershipActive ? "bg-green-500 animate-pulse" : "bg-amber-400"}`} />
                            <p className="text-sm font-bold text-slate-700 uppercase">{isMembershipActive ? "Active" : "Pending"}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Invoices List */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membership Activity</h3>
                      {lastSyncedAt && <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Updated {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>}
                   </div>
                   <div className="space-y-4">
                      {billingEntries.length > 0 ? billingEntries.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-[#72A0C1]/20 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#72A0C1] transition-colors">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-slate-900">{inv.id}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">{inv.date}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-700">{inv.amount}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{inv.status}</p>
                              </div>
                              {inv.certificateUrl ? (
                                <a href={inv.certificateUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-[#72A0C1] transition-colors">
                                   <Download className="w-4 h-4" />
                                </a>
                              ) : null}
                           </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-400">
                          Membership activity will appear here after approval and activation.
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Sidebar Billing Info */}
             <div className="space-y-6">
                {/* Payment Method */}
                <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#72A0C1]/20 rounded-full blur-2xl" />
                   <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Membership Record</h3>
                   <div className="space-y-3 mb-8">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Category</p>
                        <p className="mt-1 text-xs font-bold">{membershipCategoryLabel}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Certificate</p>
                        <p className="mt-1 text-xs font-bold">{primaryCertificateNumber}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Validity</p>
                        <p className="mt-1 text-xs font-bold">{certificateValidUntilDisplay}</p>
                      </div>
                   </div>
                   <button disabled className="w-full py-3 bg-white/10 border border-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all opacity-70 cursor-not-allowed">
                      Managed by Admin
                   </button>
                </div>

                {/* Support Widget */}
                <div className="bg-[#B9D9EB]/10 p-8 rounded-[32px] border border-[#B9D9EB]/20">
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Billing Support</h3>
                   <p className="text-xs text-slate-500 leading-relaxed mb-6 font-light">
                      Questions about your subscription? Our support team is here to help.
                   </p>
                   <Link href="/contact" className="flex items-center gap-2 text-[10px] font-bold text-[#72A0C1] uppercase tracking-widest group">
                      Contact Team <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
             </div>
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'certificates') {
      if (isPartnerOwner) {
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Partner Access</p>
              <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">Team Members Dashboard</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
                Partner owners manage team seats instead of individual certificate records in this area.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("teamMembers")}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1]"
              >
                Open Team Members
              </button>
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm min-h-[400px]">
          <div className="flex items-center gap-4 mb-8 md:mb-10">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#72A0C1]/5 rounded-2xl flex items-center justify-center text-[#72A0C1]">
              <Award className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-2xl md:text-3xl uppercase tracking-tighter font-anton">My Certificates</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#72A0C1]" /></div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[32px]">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No certificates found</p>
              <p className="text-gray-400 text-[10px] mt-2">Submit an application on the landing page.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div key={cert.certNumber} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-gray-100 bg-[#F8FAFC] hover:border-[#B9D9EB]/50 hover:shadow-md transition-all gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-[#B9D9EB]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base md:text-lg uppercase tracking-widest">{cert.certNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">Issued: {new Date(cert.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 md:px-4 md:py-2 bg-[#D4E8B5]/50 text-[#6B9624] text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {cert.status}
                    </div>
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
                      >
                        <Download className="h-4 w-4" />
                        Open PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    if (activeTab === 'profile') {
      if (isTeamMemberDashboard) {
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.08)] md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#72A0C1]">Team Access</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2240] md:text-4xl">Partner Learning Access</h3>
              <p className="mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
                Access is assigned to your individual email through your partner business.
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-medium text-slate-500">Role</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{teamMemberAccess?.role || "Team Member"}</p>
              </article>
              <article className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-medium text-slate-500">Partner Business</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{teamMemberAccess?.partnerBusinessName || "Partner Account"}</p>
                <p className="mt-1 text-sm text-slate-500">{teamMemberAccess?.partnerBusinessEmail || "Not provided"}</p>
              </article>
              <article className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-medium text-slate-500">Access Status</p>
                <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{teamMemberAccess?.status || "invited"}</p>
                <p className="mt-1 text-xs text-slate-500">Individual login required</p>
              </article>
            </section>
          </motion.div>
        );
      }

      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-6xl mx-auto px-0 pb-20 md:px-4">
          <div className="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#0A0A0A] shadow-[0_20px_100px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 z-0">
              <motion.img
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                src={profileHeroImage}
                className="h-full w-full object-cover object-center opacity-70 grayscale"
                alt="Profile Hero"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-[#050505]/55 to-white/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_48%)]" />
            </div>

            <div className="relative z-10 flex min-h-[680px] flex-col px-4 pb-4 pt-4 md:min-h-[780px] md:px-8 md:pb-8 md:pt-8">
              <div className="mb-6 flex items-start justify-between gap-3 md:mb-8">
                <div className="max-w-[60%] rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl md:max-w-none md:px-4 md:py-2.5 md:text-[10px] md:tracking-[0.28em]">
                  {primaryCertificateNumber}
                </div>

                <div className="flex min-w-0 flex-col items-end gap-2 md:gap-3">
                  <Link
                    href="/dashboard/profile/edit"
                    className="rounded-full bg-black px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-white shadow-xl transition-all hover:bg-white hover:text-black md:px-5 md:py-3 md:text-[10px] md:tracking-[0.3em]"
                  >
                    Update Application Info
                  </Link>
                </div>
              </div>

              <div className="mt-auto">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-[28px] md:rounded-[36px] md:p-8"
                >
                  <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-white/15 blur-3xl" />
                  <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-[#72A0C1]/30 blur-3xl" />

                  <div className="relative z-10">
                    <div className="mb-4 flex justify-center md:justify-start">
                      <button
                        type="button"
                        onClick={() => setIsProfileExpanded((prev) => !prev)}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl transition-colors hover:bg-white/15 md:px-5 md:text-[10px] md:tracking-[0.22em]"
                      >
                        <span className="block h-1.5 w-8 rounded-full bg-white/45" />
                        <span>{profileToggleLabel}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isProfileExpanded ? "rotate-90" : ""}`} />
                      </button>
                    </div>

                    <div className="mb-4 flex items-start justify-between gap-3 md:mb-5 md:gap-4">
                      <div className="min-w-0">
                        <p className="mb-3 inline-flex rounded-full border border-[#72A0C1]/30 bg-[#72A0C1]/15 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[#B9D9EB] md:text-[9px] md:tracking-[0.3em]">
                          {membershipCategoryLabel}
                        </p>
                        <h2 className="max-w-[520px] text-3xl leading-none text-white md:text-6xl">
                          <span className="font-anton uppercase tracking-tight">{fullName || firstName}</span>
                        </h2>
                        <p className="mt-2 truncate text-xs font-medium text-white/45 md:mt-3 md:text-sm">@{username}</p>
                      </div>

                    </div>

                    <AnimatePresence initial={false}>
                      {isProfileExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pt-1">
                            <p className="max-w-2xl text-xs leading-relaxed text-white/72 md:text-base">
                              Your dashboard reflects the professional information submitted in your IBPA application,
                              including your role, location, membership status, and certificate activity.
                            </p>

                            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 md:mt-6 md:gap-4 md:pt-6">
                              {quickStats.map((item) => (
                                <div key={item.label}>
                                  <p className="text-sm font-bold uppercase leading-tight text-white md:text-2xl md:normal-case">{item.value}</p>
                                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 md:text-[10px] md:tracking-[0.25em]">
                                    {item.label}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
                              {profileTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/60 backdrop-blur-xl md:px-3 md:py-2 md:text-[10px] md:tracking-[0.22em]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {(mergedProfileData.bio || mergedProfileData.instagramUrl || mergedProfileData.experienceYears || specializationDisplay || locationDisplay) && (
                              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {mergedProfileData.bio && (
                                  <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 mb-1">Bio</p>
                                    <p className="text-xs text-white/80">{mergedProfileData.bio}</p>
                                  </div>
                                )}
                                <div>
                                  {mergedProfileData.instagramUrl && (
                                    <div className="mb-3">
                                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 mb-1">Instagram</p>
                                      <a href={String(mergedProfileData.instagramUrl).startsWith('http') ? String(mergedProfileData.instagramUrl) : `https://${mergedProfileData.instagramUrl}`} target="_blank" rel="noreferrer" className="text-xs text-[#72A0C1] hover:underline">
                                        {String(mergedProfileData.instagramUrl).replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}
                                      </a>
                                    </div>
                                  )}
                                  {(mergedProfileData.experienceYears || specializationDisplay || locationDisplay) && (
                                    <div>
                                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 mb-1">Professional Info</p>
                                      <p className="text-xs text-white/80">{specializationDisplay}</p>
                                      <p className="mt-1 text-xs text-white/60">{locationDisplay}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
                              <button
                                type="button"
                                onClick={() => setActiveTab(isPartnerOwner ? "teamMembers" : "billing")}
                                className="flex-1 rounded-[20px] bg-linear-to-r from-[#8DD4F7] via-[#F2C94C] to-[#F6B6FF] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_20px_45px_rgba(141,212,247,0.25)] transition-transform hover:scale-[1.01] md:rounded-[22px] md:px-6 md:py-4 md:text-sm md:tracking-[0.24em]"
                              >
                                {isPartnerOwner ? "Manage Team" : "View Membership"}
                              </button>
                              {showCertificatesTab ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("certificates")}
                                  className="rounded-[20px] border border-white/12 bg-white/10 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-xl transition-colors hover:bg-white/15 md:rounded-[22px] md:px-6 md:py-4 md:text-sm md:tracking-[0.24em]"
                                >
                                  Certificate Status
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("billing")}
                                  className="rounded-[20px] border border-white/12 bg-white/10 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-xl transition-colors hover:bg-white/15 md:rounded-[22px] md:px-6 md:py-4 md:text-sm md:tracking-[0.24em]"
                                >
                                  Billing Status
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'settings') {
      if (!isSignedIn) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
            <LogIn className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Authentication Required</p>
            <p className="text-slate-400 text-xs mt-2">Please sign in to view your settings.</p>
          </motion.div>
        );
      }
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-center">
          <UserProfile routing="hash" />
        </motion.div>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Notifications</p>
            <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">
              Notification Settings
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
              Manage which dashboard alerts should notify you about membership status, certificates, and renewal events.
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="space-y-4">
              {[
                {
                  key: "applicationUpdates",
                  title: "Application Updates",
                  description: "Get notified when your review status or application decision changes.",
                },
                {
                  key: "certificateReminders",
                  title: "Certificate Reminders",
                  description: "Receive alerts when a certificate is issued or is close to expiration.",
                },
                {
                  key: "membershipRenewal",
                  title: "Membership Renewal",
                  description: "Stay informed about renewal windows, successful renewals, and expirations.",
                },
                {
                  key: "productAnnouncements",
                  title: "Platform Updates",
                  description: "Optional notices about dashboard improvements and new member tools.",
                },
              ].map((item) => {
                return (
                  <div
                    key={item.key}
                    className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="max-w-2xl">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
                    </div>
                    <div className="inline-flex min-w-[132px] items-center justify-center rounded-full bg-[#72A0C1] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                      Automatic
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      );
    }
  };

  if (!userLoaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#72A0C1]" />
      </div>
    );
  }

  if (isSignedIn && loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#72A0C1]" />
      </div>
    );
  }

  const NavContent = () => (
    <nav className="space-y-2">
      <button
        onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'profile' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
      >
        <User className="w-5 h-5" />
        Profile
      </button>
      
      {showCertificatesTab ? (
        <button 
          onClick={() => { setActiveTab('certificates'); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'certificates' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
        >
          <Award className="w-5 h-5" />
          My Certificates
        </button>
      ) : null}

      {isPartnerOwner ? (
        <button
          onClick={() => { setActiveTab('teamMembers'); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'teamMembers' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
        >
          <UserPlus className="w-5 h-5" />
          Team Members
        </button>
      ) : null}

      {!isTeamMemberDashboard ? (
        <Link
          href="/dashboard/community"
          onClick={() => setIsMobileMenuOpen(false)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400 transition-all hover:bg-white hover:text-slate-600"
        >
          <Users className="w-5 h-5" />
          Community
        </Link>
      ) : null}

      <button
        onClick={() => { setActiveTab('news' as TabType); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'news' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
      >
        <Newspaper className="w-5 h-5" />
        News
        {hasNewNews && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-current animate-pulse" />}
      </button>

      <button
        onClick={() => { setActiveTab('events' as TabType); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'events' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
      >
        <CalendarDays className="w-5 h-5" />
        Events
        {hasNewEvents && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-current animate-pulse" />}
      </button>

      <div className="pt-8 mt-8 border-t border-gray-200/50">
         {!isTeamMemberDashboard ? (
           <button 
             onClick={() => { setActiveTab('billing'); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'billing' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
           >
             <CreditCard className="w-5 h-5" />
             Billing & Membership
           </button>
         ) : null}
         <button 
           onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
           className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'settings' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
         >
           <Settings className="w-5 h-5" />
           Settings
         </button>
         <button
           onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}
           className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'notifications' ? 'bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
         >
           <Bell className="w-5 h-5" />
           Notifications
           {unreadNotificationsCount > 0 && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-current animate-pulse" />}
         </button>
      </div>
    </nav>
  );

  if (isSignedIn && accessBlocked) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Dashboard Access</p>
            <h1 className="mt-4 text-3xl uppercase font-anton text-slate-900 md:text-5xl">
              Membership Activation Required
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
              {accessErrorMessage ||
                "This dashboard opens only for paid IBPA members. Sign in with the same email used for your application and payment once your membership is completed."}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Already Paid?</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Use the same email address from your approved application and payment. If your payment just completed,
                  wait a moment and try again.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Need Help?</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  If your payment was completed but access is still blocked, contact the IBPA team so we can verify the
                  payment and unlock your member dashboard.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] hover:text-black"
              >
                Contact Support
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
     <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
       <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30">
         <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 md:gap-3 text-slate-900 font-anton text-xl md:text-2xl uppercase">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-lg md:rounded-xl flex items-center justify-center text-white scale-90 xs:flex">
               <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
             </div>
             <span className="md:hidden">Dashboard</span>
             <span className="hidden md:inline">IBPA Dashboard</span>
           </div>
          <div className="flex items-center gap-3 md:gap-6">
            {isSignedIn && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#72A0C1] animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsNotificationsOpen(false)}
                        aria-label="Close notifications"
                        className="fixed inset-0 z-40 bg-transparent"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-14 z-50 w-xs overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
                      >
                        <div className="border-b border-slate-100 px-5 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#72A0C1]">System Alerts</p>
                               <h4 className="mt-2 text-lg uppercase font-anton text-slate-900">Notifications</h4>
                            </div>
                            {unreadNotificationsCount > 0 && (
                              <span className="rounded-full bg-[#F0F8FF] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#72A0C1]">
                                {unreadNotificationsCount} new
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="max-h-[360px] overflow-y-auto px-3 py-3">
                          <div className="space-y-2">
                            {visibleNotifications.map((item) => (
                              <div key={item.id} className="rounded-[20px] border border-slate-100 bg-[#F8FAFC] px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900">
                                      {item.title}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${getNotificationMeta(item).categoryClassName}`}>
                                        {getNotificationMeta(item).categoryLabel}
                                      </span>
                                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${getNotificationMeta(item).priorityClassName}`}>
                                        {getNotificationMeta(item).priorityLabel}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                      {item.description}
                                    </p>
                                  </div>
                                  {item.unread && (
                                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#72A0C1] animate-pulse" />
                                  )}
                                </div>
                                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                                  {new Date(item.timestamp).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 px-4 py-4">
                          <Link
                            href="/dashboard/notifications"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="block w-full rounded-full border border-slate-200 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
                          >
                            View All Notifications
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {!userLoaded ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : isSignedIn ? (
              <div className="flex items-center gap-3">
                <SignOutButton>
                  <button className="hidden md:inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]">
                    Sign Out
                  </button>
                </SignOutButton>
                <UserButton />
              </div>
            ) : (
              <Link href="/sign-in" className="flex items-center gap-2 bg-black text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#72A0C1] transition-colors">
                <LogIn className="w-3 h-3 md:w-4 md:h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl z-50 md:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3 text-slate-900 font-anton text-xl uppercase">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  IBPA Menu
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <NavContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block">
            <NavContent />
          </aside>

          {/* Main Content Area */}
          <section className="md:col-span-3">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </section>
        </div>
      </main>

    </div>
  );
}
