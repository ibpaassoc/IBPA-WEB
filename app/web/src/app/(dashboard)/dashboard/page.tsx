"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */

import { SignOutButton, UserButton, UserProfile, useUser } from "@clerk/nextjs";
import {
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Instagram,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { TeamMembersPanel } from "@/components/dashboard/TeamMembersPanel";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import {
  buildOnboardingChecklist,
  buildEventDiscountLabel,
  defaultNotificationPreferences,
  extractPriceFromText,
  formatMembershipCategory,
  formatStatusLabel,
  getDashboardStatus,
  getMembershipAmount,
  inferEventAudience,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from "@/lib/dashboard-cabinet";
import { getLocation, getSpecializationDisplay, getSnapshotItems, type CombinedProfileData } from "@/lib/application-profile";
import { formatMemberId, getPublicProfileHref } from "@/lib/member-identity";
import { buildSystemNotifications, normalizeNotifications, type DashboardNotification } from "@/lib/notifications";
import type { PublicMember } from "@/lib/public-members";

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
  orderId?: string | null;
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

type TabType =
  | "dashboard"
  | "profile"
  | "certificates"
  | "billing"
  | "events"
  | "directory"
  | "support"
  | "settings"
  | "notifications"
  | "teamMembers";

type DashboardContentItem = {
  id: string;
  type: "news" | "events";
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  createdAt: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
  eventAddress?: string | null;
};

type SupportMode = "question" | "idea" | "problem";

const DASHBOARD_NEWS_SEEN_KEY = "ibpa-dashboard-news-seen";
const DASHBOARD_EVENTS_SEEN_KEY = "ibpa-dashboard-events-seen";
const DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY = "ibpa-dashboard-system-notifications-seen";
const DASHBOARD_NOTIFICATION_PREFS_KEY = "ibpa-dashboard-notification-preferences";

function addOneYear(dateString?: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

function getNotificationSignature(notification: DashboardNotification) {
  return `${notification.id}:${notification.timestamp}`;
}

function getNotificationMeta(notification: DashboardNotification) {
  const category = notification.category || "admin";
  const priority = notification.priority || "medium";

  const categoryLabelMap: Record<string, string> = {
    membership: "Membership",
    certificate: "Certificate",
    content: "Opportunity",
    admin: "Admin",
    system: "System",
  };

  const priorityLabelMap: Record<string, string> = {
    high: "High priority",
    medium: "Update",
    low: "Info",
  };

  const categoryClassMap: Record<string, string> = {
    membership: "border border-sky-200 bg-sky-50 text-sky-700",
    certificate: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    content: "border border-violet-200 bg-violet-50 text-violet-700",
    admin: "border border-amber-200 bg-amber-50 text-amber-700",
    system: "border border-slate-200 bg-slate-100 text-slate-600",
  };

  const priorityClassMap: Record<string, string> = {
    high: "border border-rose-200 bg-rose-50 text-rose-700",
    medium: "border border-cyan-200 bg-cyan-50 text-cyan-700",
    low: "border border-zinc-200 bg-zinc-100 text-zinc-600",
  };

  return {
    categoryLabel: categoryLabelMap[category],
    priorityLabel: priorityLabelMap[priority],
    categoryClassName: categoryClassMap[category],
    priorityClassName: priorityClassMap[priority],
  };
}

function normalizeAccountTypeValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeExternalUrl(value?: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function StatusPill({ label, tone }: { label: string; tone: "pending" | "active" | "verified" }) {
  const classes =
    tone === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "active"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-7 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10203B] md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function NavButton({
  active,
  label,
  icon,
  onClick,
  accent,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  accent?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
        active
          ? "bg-[#10203B] text-white shadow-[0_16px_36px_rgba(16,32,59,0.18)]"
          : "text-slate-600 hover:bg-[#F3F7FB] hover:text-[#10203B]"
      }`}
    >
      <span className={active ? "text-white" : "text-[#4C7D9D]"}>{icon}</span>
      <span className="truncate">{label}</span>
      {accent ? <span className="ml-auto">{accent}</span> : null}
    </button>
  );
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [profileData, setProfileData] = useState<DashboardProfileData>({});
  const [dashboardMeta, setDashboardMeta] = useState<DashboardMeta>({});
  const [dashboardAccessType, setDashboardAccessType] = useState<DashboardAccessType>("member");
  const [teamMemberAccess, setTeamMemberAccess] = useState<TeamMemberAccessInfo | null>(null);
  const [directoryMembers, setDirectoryMembers] = useState<PublicMember[]>([]);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessErrorMessage, setAccessErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [customNotifications, setCustomNotifications] = useState<DashboardNotification[]>([]);
  const [dashboardNews, setDashboardNews] = useState<DashboardContentItem[]>([]);
  const [dashboardEvents, setDashboardEvents] = useState<DashboardContentItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSeenNewsAt, setLastSeenNewsAt] = useState<string | null>(null);
  const [lastSeenEventsAt, setLastSeenEventsAt] = useState<string | null>(null);
  const [seenSystemNotifications, setSeenSystemNotifications] = useState<string[]>([]);
  const [eventAudienceFilter, setEventAudienceFilter] = useState<"all" | "members" | "open">("all");
  const [supportMode, setSupportMode] = useState<SupportMode>("question");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);

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

      if (!res.ok) return;

      setCustomNotifications((prev) =>
        prev.map((item) => (normalizedIds.includes(item.id) ? { ...item, unread: false } : item)),
      );
    } catch {
      // keep current UI state
    }
  }, []);

  const refreshDashboardData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!isSignedIn) {
        setCertificates([]);
        setProfileData({});
        setDirectoryMembers([]);
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
        const [certRes, profRes, notificationsRes, newsRes, eventsRes, communityRes] = await Promise.all([
          fetch("/api/dashboard/me", { cache: "no-store" }),
          fetch("/api/dashboard/profile", { cache: "no-store" }),
          fetch("/api/dashboard/notifications", { cache: "no-store" }),
          fetch("/api/content?type=news&target=dashboard", { cache: "no-store" }),
          fetch("/api/content?type=events&target=dashboard", { cache: "no-store" }),
          fetch("/api/dashboard/community/members", { cache: "no-store" }),
        ]);

        if (certRes.status === 401 || profRes.status === 401) {
          setCertificates([]);
          setProfileData({});
          setDirectoryMembers([]);
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
          setAccessErrorMessage("This dashboard becomes available after your IBPA membership payment is completed and activated.");
          setCertificates([]);
          setProfileData({});
          setDirectoryMembers([]);
          setDashboardMeta({});
          setDashboardAccessType("member");
          setTeamMemberAccess(null);
          setCustomNotifications([]);
          setDashboardNews([]);
          setDashboardEvents([]);
          return;
        }

        const [certData, profileJson, notificationsJson, newsJson, eventsJson, communityJson] = await Promise.all([
          certRes.ok ? certRes.json() : Promise.resolve(null),
          profRes.ok ? profRes.json() : Promise.resolve(null),
          notificationsRes.ok ? notificationsRes.json() : Promise.resolve(null),
          newsRes.ok ? newsRes.json() : Promise.resolve(null),
          eventsRes.ok ? eventsRes.json() : Promise.resolve(null),
          communityRes.ok ? communityRes.json() : Promise.resolve(null),
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
              ownerMemberId: certData.dashboardAccess.ownerMemberId || "IBPA #000123",
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
            accountType: typeof nextProfile.accountType === "string" ? nextProfile.accountType : prev.accountType ?? null,
            applicationType:
              typeof nextProfile.applicationType === "string" ? nextProfile.applicationType : prev.applicationType ?? null,
            orderType: typeof nextProfile.orderType === "string" ? nextProfile.orderType : prev.orderType ?? null,
            membershipStatus:
              typeof nextProfile.membershipStatus === "string" ? nextProfile.membershipStatus : prev.membershipStatus ?? null,
            paymentStatus:
              typeof nextProfile.paymentStatus === "string" ? nextProfile.paymentStatus : prev.paymentStatus ?? null,
            certificateStatus:
              typeof nextProfile.certificateStatus === "string" ? nextProfile.certificateStatus : prev.certificateStatus ?? null,
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

        if (communityRes.ok && communityJson) {
          setDirectoryMembers(Array.isArray(communityJson.items) ? communityJson.items : []);
        }

        setLastSyncedAt(new Date().toISOString());

        if (!silent) {
          if (!certRes.ok) toast.error("Failed to load membership data.");
          if (!profRes.ok) toast.error("Failed to load profile data.");
          if (!notificationsRes.ok) toast.error("Failed to load notifications.");
          if (!newsRes.ok) toast.error("Failed to load member news.");
          if (!eventsRes.ok) toast.error("Failed to load events.");
        }
      } catch (error) {
        console.error("[Dashboard] Network error:", error);
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
  }, [refreshDashboardData, userLoaded]);

  useEffect(() => {
    if (!userLoaded || !isSignedIn || typeof window === "undefined") return;

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
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileMenuOpen || isNotificationsOpen ? "hidden" : previousOverflow || "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen, isNotificationsOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setLastSeenNewsAt(window.localStorage.getItem(DASHBOARD_NEWS_SEEN_KEY));
    setLastSeenEventsAt(window.localStorage.getItem(DASHBOARD_EVENTS_SEEN_KEY));

    try {
      const storedSeen = window.localStorage.getItem(DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY);
      setSeenSystemNotifications(storedSeen ? JSON.parse(storedSeen) : []);
    } catch {
      setSeenSystemNotifications([]);
    }

    try {
      const storedPrefs = window.localStorage.getItem(DASHBOARD_NOTIFICATION_PREFS_KEY);
      setNotificationPreferences(storedPrefs ? { ...defaultNotificationPreferences, ...JSON.parse(storedPrefs) } : defaultNotificationPreferences);
    } catch {
      setNotificationPreferences(defaultNotificationPreferences);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_NOTIFICATION_PREFS_KEY, JSON.stringify(notificationPreferences));
  }, [notificationPreferences]);

  const hasApprovedCert = certificates.some((item) => item.status === "approved" || item.status === "paid");
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
  const normalizedMembershipStatus = String(profileData.membershipStatus ?? dashboardMeta.membershipStatus ?? "").trim().toLowerCase();
  const normalizedPaymentStatus = String(profileData.paymentStatus ?? dashboardMeta.paymentStatus ?? "").trim().toLowerCase();
  const normalizedCertificateStatus = String(profileData.certificateStatus ?? dashboardMeta.certificateStatus ?? "").trim().toLowerCase();
  const isMembershipActive = hasApprovedCert || normalizedPaymentStatus === "paid";
  const primaryCertificate = certificates[0];

  const mappedFirstName = String(profileData.firstName || "").trim();
  const mappedLastName = String(profileData.lastName || "").trim();
  const mappedFullName = String(profileData.fullName || "").trim();
  const clerkFullName = [user?.firstName || "", user?.lastName || ""].filter(Boolean).join(" ").trim();
  const fullName = mappedFullName || [mappedFirstName, mappedLastName].filter(Boolean).join(" ") || clerkFullName || "IBPA Member";
  const dashboardContactEmail = String(profileData.email || primaryCertificate?.orderEmail || user?.primaryEmailAddress?.emailAddress || "").trim();
  const username = user?.username || dashboardContactEmail.split("@")[0] || "ibpa.member";
  const memberSinceDate = primaryCertificate?.createdAt ? new Date(primaryCertificate.createdAt) : user?.createdAt ? new Date(user.createdAt) : null;
  const memberSinceDisplay = memberSinceDate
    ? memberSinceDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Pending";
  const membershipExpiresAt = primaryCertificate?.expiresAt ? new Date(primaryCertificate.expiresAt) : addOneYear(primaryCertificate?.createdAt);
  const membershipExpiresDisplay = membershipExpiresAt
    ? membershipExpiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Pending";
  const membershipCategoryLabel = isTeamMemberDashboard
    ? "Partner Team Access"
    : isPartnerOwner
      ? "Partner Membership"
      : formatMembershipCategory(primaryCertificate?.membershipCategory || profileData.membershipCategory);

  const statusSummary = getDashboardStatus({
    isTeamMemberDashboard,
    isPartnerOwner,
    isMembershipActive,
    normalizedCertificateStatus,
    normalizedMembershipStatus,
  });

  const activeApplicationPayload = useMemo<Record<string, unknown>>(() => {
    if (primaryCertificate?.applicationPayload && typeof primaryCertificate.applicationPayload === "object" && !Array.isArray(primaryCertificate.applicationPayload)) {
      return primaryCertificate.applicationPayload;
    }

    if (profileData.applicationPayload && typeof profileData.applicationPayload === "object" && !Array.isArray(profileData.applicationPayload)) {
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
  const profileHeroImage = mergedProfileData.imageUrl || user?.imageUrl || null;
  const profileChecklist = buildOnboardingChecklist({
    profile: mergedProfileData,
    hasPhoto: Boolean(profileHeroImage),
    certificatesCount: certificates.length,
  });
  const memberIdDisplay = formatMemberId(profileData.orderId || primaryCertificate?.certNumber || user?.id);
  const publicProfileHref = getPublicProfileHref(profileData.orderId);
  const instagramUrl = normalizeExternalUrl(mergedProfileData.instagramUrl);
  const websiteUrl = normalizeExternalUrl(typeof activeApplicationPayload.websiteLink === "string" ? activeApplicationPayload.websiteLink : null);
  const achievementsSummary = String(
    profileData.achievements ||
      (typeof activeApplicationPayload.achievementsDesc === "string" ? activeApplicationPayload.achievementsDesc : "") ||
      "",
  ).trim();
  const certificateSummary = String(profileData.certificatesSummary || "").trim();

  const systemNotifications = buildSystemNotifications({
    hasApprovedCert,
    membershipCategoryLabel,
    primaryCertificate,
    userCreatedAt: user?.createdAt?.toISOString(),
  });

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
    if (!isNotificationsOpen) return;

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
  const latestEventsAt = dashboardEvents[0]?.createdAt || null;
  const hasNewEvents = Boolean(latestEventsAt && (!lastSeenEventsAt || new Date(latestEventsAt).getTime() > new Date(lastSeenEventsAt).getTime()));
  const certificateStatusDisplay = formatStatusLabel(normalizedCertificateStatus, "Pending");
  const partnerSeatPrice = partnerTeamSummary?.additionalSeatPrice ?? 100;
  const invitedPartnerMembers = partnerTeamSummary?.invitedMembers || [];

  useEffect(() => {
    if (activeTab === "events" && typeof window !== "undefined") {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(DASHBOARD_EVENTS_SEEN_KEY, timestamp);
      setLastSeenEventsAt(timestamp);
    }

    if (activeTab === "dashboard" && typeof window !== "undefined" && dashboardNews.length > 0) {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(DASHBOARD_NEWS_SEEN_KEY, timestamp);
      setLastSeenNewsAt(timestamp);
    }
  }, [activeTab, dashboardNews.length]);

  useEffect(() => {
    if (isTeamMemberDashboard && (activeTab === "billing" || activeTab === "certificates" || activeTab === "teamMembers")) {
      setActiveTab("dashboard");
      return;
    }

    if (isPartnerOwner && activeTab === "certificates") {
      setActiveTab("billing");
    }
  }, [activeTab, isPartnerOwner, isTeamMemberDashboard]);

  const billingEntries = certificates.map((cert) => ({
    id: cert.certNumber,
    date: new Date(cert.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    amount: getMembershipAmount(cert.membershipCategory),
    status: cert.status,
    certificateUrl: cert.certificateUrl,
  }));

  const eventCards = dashboardEvents.map((item) => {
    const audience = inferEventAudience(item.title, item.body, item.ctaLabel);
    return {
      ...item,
      audience,
      dateDisplay: new Date(item.eventDate || item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      price: extractPriceFromText(item.body, item.ctaLabel) || (audience === "members" ? "Members rate" : "TBD"),
      discountLabel: buildEventDiscountLabel({
        isMembershipActive,
        audience,
        membershipLabel: membershipCategoryLabel,
      }),
    };
  });

  const filteredEventCards = eventCards.filter((item) => eventAudienceFilter === "all" || item.audience === eventAudienceFilter);

  const alertCards = allNotifications.slice(0, 3);

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
      onClick: () => setActiveTab(showCertificatesTab ? "certificates" : "billing"),
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

  const faqItems = [
    {
      question: "How do I update my public profile?",
      answer: "Open Edit Profile to refresh your photo, contact details, specialization, and biography.",
    },
    {
      question: "Where do certificate files appear?",
      answer: "Issued certificate files appear in My Certificates after administrative review and upload.",
    },
    {
      question: "How are reminders delivered?",
      answer: "IBPA can send reminders, updates, and invitations through the existing email workflow when those automations are enabled.",
    },
    {
      question: "Can I change my membership plan online?",
      answer: "Plan change and renewal actions are surfaced here, while final payment flow still follows the existing membership process.",
    },
  ];

  const quickAnswers = [
    "Support replies arrive through the existing IBPA contact workflow.",
    "Public profile sharing uses your live member page link.",
    "Directory visibility depends on active paid membership.",
  ];

  const supportTopicLabel =
    supportMode === "idea" ? "Suggest an idea" : supportMode === "problem" ? "Report a problem" : "Ask a question";

  const handleSupportSubmit = useCallback(async () => {
    const memberName = fullName || user?.fullName || "IBPA Member";
    const email = dashboardContactEmail;

    if (!email) {
      toast.error("A signed-in email address is required to send support requests.");
      return;
    }

    if (supportMessage.trim().length < 20) {
      toast.error("Please provide at least 20 characters so the support team has enough context.");
      return;
    }

    setSupportSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName,
          email,
          phone: supportPhone.trim() || undefined,
          source: `Dashboard Support - ${supportTopicLabel}`,
          message: `${supportTopicLabel}\n\nMember ID: ${memberIdDisplay}\nMembership: ${membershipCategoryLabel}\n\n${supportMessage.trim()}`,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to send support request.");
      }

      toast.success("Your request was sent to IBPA support.");
      setSupportMessage("");
      setSupportPhone("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send support request.");
    } finally {
      setSupportSubmitting(false);
    }
  }, [dashboardContactEmail, fullName, memberIdDisplay, membershipCategoryLabel, supportMessage, supportPhone, supportTopicLabel, user?.fullName]);

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

  const togglePreference = useCallback((key: NotificationPreferenceKey) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const overviewCards = [
    { label: "Member status", value: statusSummary.label, helper: statusSummary.description },
    { label: "Member since", value: memberSinceDisplay, helper: "First linked activation date" },
    { label: "Membership type", value: membershipCategoryLabel, helper: "Current linked membership record" },
    { label: "Expiry date", value: membershipExpiresDisplay, helper: "Latest certificate or renewal date" },
  ];

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      <SectionCard className="overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#eef5fb_100%)]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill label={statusSummary.label} tone={statusSummary.tone} />
                  {!isTeamMemberDashboard ? <StatusPill label="Verified IBPA Member" tone={isMembershipActive ? "verified" : "pending"} /> : null}
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#10203B] md:text-5xl">{fullName}</h1>
                <p className="mt-2 text-sm text-slate-500 md:text-base">@{username}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#4C7D9D]" />
                    {locationDisplay}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#4C7D9D]" />
                    {specializationDisplay}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/profile/edit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                >
                  Edit Profile
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab("billing")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                >
                  View Membership
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">{item.label}</p>
                  <p className="mt-3 text-lg font-semibold text-[#10203B]">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-[#d8e5f0] bg-white/90 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Profile completion</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {profileChecklist.completed} of {profileChecklist.total} onboarding steps completed.
                  </p>
                </div>
                <p className="text-2xl font-semibold text-[#10203B]">{profileChecklist.percentage}%</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#8dc7e8_0%,#4C7D9D_100%)]" style={{ width: `${profileChecklist.percentage}%` }} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {profileChecklist.items.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-[#F5F8FC] px-4 py-3 text-sm text-slate-600">
                    {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock3 className="h-4 w-4 text-amber-500" />}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#dbe9f4] text-xl font-semibold text-[#10203B]">
                  {profileHeroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileHeroImage} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Member identity</p>
                  <p className="mt-2 text-xl font-semibold text-[#10203B]">{memberIdDisplay}</p>
                  <p className="mt-2 text-sm text-slate-500">{dashboardContactEmail || "Primary member email unavailable"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[#F5F8FC] px-4 py-3">
                  <span className="text-sm text-slate-500">Verification badge</span>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#10203B]">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Verified IBPA Member
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[#F5F8FC] px-4 py-3">
                  <span className="text-sm text-slate-500">Certificate status</span>
                  <span className="text-sm font-medium text-[#10203B]">{certificateStatusDisplay}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={copyPublicLink}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                >
                  <Copy className="h-4 w-4" />
                  Copy Public Link
                </button>
                {publicProfileHref ? (
                  <Link
                    href={publicProfileHref}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                  >
                    Open Public Profile
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Alerts</p>
                  <p className="mt-2 text-sm text-slate-500">Membership reminders, profile review, and event opportunities.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("notifications")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#4C7D9D]"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {alertCards.length > 0 ? (
                  alertCards.map((item) => {
                    const meta = getNotificationMeta(item);
                    return (
                      <div key={item.id} className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#10203B]">{item.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                          </div>
                          {item.unread ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" /> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.categoryClassName}`}>{meta.categoryLabel}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.priorityClassName}`}>{meta.priorityLabel}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] p-5 text-sm text-slate-500">
                    Alerts will appear here as soon as new member activity is available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Quick actions</p>
              <p className="mt-2 text-sm text-slate-500">Everything most members need, without extra dashboard clutter.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="rounded-3xl border border-slate-200 bg-[#FBFCFE] p-4 text-left transition hover:border-[#c5d7e6] hover:bg-white hover:shadow-[0_18px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E9F1F8] text-[#4C7D9D]">{item.icon}</div>
                <p className="mt-4 text-base font-semibold text-[#10203B]">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">At a glance</p>
              <p className="mt-2 text-sm text-slate-500">Fast snapshots for certificates, billing, and events.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => setActiveTab("certificates")} className="flex w-full items-center justify-between rounded-2xl bg-[#F5F8FC] px-4 py-4 text-left">
              <div>
                <p className="text-sm font-semibold text-[#10203B]">My Certificates</p>
                <p className="mt-1 text-sm text-slate-500">{certificates.length > 0 ? `${certificates.length} record(s) available` : "No issued certificate files yet"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button type="button" onClick={() => setActiveTab("billing")} className="flex w-full items-center justify-between rounded-2xl bg-[#F5F8FC] px-4 py-4 text-left">
              <div>
                <p className="text-sm font-semibold text-[#10203B]">Billing & Membership</p>
                <p className="mt-1 text-sm text-slate-500">{billingEntries.length > 0 ? `${billingEntries.length} payment record(s)` : "Payment history appears after activation"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button type="button" onClick={() => setActiveTab("events")} className="flex w-full items-center justify-between rounded-2xl bg-[#F5F8FC] px-4 py-4 text-left">
              <div>
                <p className="text-sm font-semibold text-[#10203B]">Events & Benefits</p>
                <p className="mt-1 text-sm text-slate-500">{dashboardEvents.length > 0 ? `${dashboardEvents.length} event option(s)` : "Upcoming member opportunities appear here"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Profile"
          title="Professional profile"
          description="A clean public-facing identity card aligned with your application data, member verification, and current specialization."
          action={
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex items-center gap-2 rounded-full bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
            >
              Edit profile
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        {isTeamMemberDashboard ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-2 text-xl font-semibold text-[#10203B]">{teamMemberAccess?.role || "Team Member"}</p>
            </div>
            <div className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-sm text-slate-500">Partner business</p>
              <p className="mt-2 text-xl font-semibold text-[#10203B]">{teamMemberAccess?.partnerBusinessName || "Partner account"}</p>
            </div>
            <div className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-sm text-slate-500">Access</p>
              <p className="mt-2 text-xl font-semibold capitalize text-[#10203B]">{teamMemberAccess?.status || "Invited"}</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#dbe9f4] text-2xl font-semibold text-[#10203B]">
                  {profileHeroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileHeroImage} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill label={statusSummary.label} tone={statusSummary.tone} />
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F8F3] px-3 py-1 text-[11px] font-medium text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Verified IBPA Member
                    </span>
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[#10203B]">{fullName}</h3>
                  <p className="mt-2 text-sm text-slate-500">@{username}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Location</p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">{locationDisplay}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Specialization</p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">{specializationDisplay}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {instagramUrl ? (
                      <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                        <Instagram className="h-4 w-4 text-[#4C7D9D]" />
                        Instagram
                      </a>
                    ) : null}
                    {websiteUrl ? (
                      <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                        <Globe className="h-4 w-4 text-[#4C7D9D]" />
                        Website
                      </a>
                    ) : null}
                    {publicProfileHref ? (
                      <Link href={publicProfileHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                        <ExternalLink className="h-4 w-4 text-[#4C7D9D]" />
                        Public profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {mergedProfileData.bio ? (
                <div className="mt-6 rounded-3xl bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bio</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{mergedProfileData.bio}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Professional info</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Years of experience", value: mergedProfileData.experienceYears || "Not added yet" },
                    { label: "Education", value: mergedProfileData.education || "Not added yet" },
                    { label: "Certificates", value: certificateSummary || "Certificate details appear here once added" },
                    { label: "Achievements", value: achievementsSummary || "Add awards, publications, or notable accomplishments" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[#10203B]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Identity</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Member ID</p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">{memberIdDisplay}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Membership</p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">{membershipCategoryLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Snapshot</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshotItems.map((item) => (
            <div key={item.label} className="rounded-3xl bg-[#F5F8FC] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-sm font-medium leading-6 text-[#10203B]">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="My Certificates"
          title="Verification and downloads"
          description="Issued certificate records, review status, and your public verification link for clients."
          action={
            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
            >
              <Award className="h-4 w-4" />
              Need to upload more?
            </button>
          }
        />

        <div className="mt-6 space-y-4">
          {showCertificatesTab ? (
            certificates.length > 0 ? (
              certificates.map((cert) => (
                <div key={cert.certNumber} className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-[#10203B]">{cert.certNumber}</p>
                        <StatusPill label={cert.status === "paid" ? "Verified" : formatStatusLabel(cert.status, "Pending")} tone={cert.status === "paid" ? "verified" : cert.status === "approved" ? "active" : "pending"} />
                      </div>
                      <p className="mt-3 text-sm text-slate-500">{cert.orderName || fullName}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Issue date</p>
                          <p className="mt-2 text-sm font-medium text-[#10203B]">{new Date(cert.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Expiry</p>
                          <p className="mt-2 text-sm font-medium text-[#10203B]">
                            {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : membershipExpiresDisplay}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Verification link</p>
                          <p className="mt-2 truncate text-sm font-medium text-[#10203B]">{publicProfileHref || "Available after profile mapping"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {cert.certificateUrl ? (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-400"
                        >
                          <Download className="h-4 w-4" />
                          Not available yet
                        </button>
                      )}
                      {publicProfileHref ? (
                        <Link
                          href={publicProfileHref}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Public verification
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFE] p-8 text-center">
                <Award className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-lg font-semibold text-[#10203B]">No issued certificates yet</p>
                <p className="mt-2 text-sm text-slate-500">Certificate files appear here once the review and upload process is complete.</p>
              </div>
            )
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFE] p-8 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-[#10203B]">Partner access uses team management instead</p>
              <p className="mt-2 text-sm text-slate-500">Open Team Members to manage seats, invited specialists, and partner access.</p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Billing & Membership"
          title={isPartnerOwner ? "Partner membership control" : "Membership billing"}
          description="Plan details, expiration timeline, renewal actions, payment history, and invoice-ready structure."
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/membership" className="inline-flex items-center gap-2 rounded-full bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]">
                Renew Membership
              </Link>
              <Link href="/membership" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]">
                Change Plan
              </Link>
            </div>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Membership type</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">{membershipCategoryLabel}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Price</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">{isPartnerOwner ? `${partnerTeamSummary?.includedSeats ?? 5} included seats` : getMembershipAmount(primaryCertificate?.membershipCategory)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Expiration date</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">{membershipExpiresDisplay}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">{statusSummary.label}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Payment history</p>
                  <p className="mt-2 text-sm text-slate-500">Existing membership payment records connected to this account.</p>
                </div>
                {lastSyncedAt ? <p className="text-xs text-slate-400">Updated {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p> : null}
              </div>

              <div className="mt-5 space-y-3">
                {billingEntries.length > 0 ? (
                  billingEntries.map((entry) => (
                    <div key={entry.id} className="flex flex-col gap-4 rounded-2xl bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F1F8] text-[#4C7D9D]">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#10203B]">{entry.id}</p>
                          <p className="mt-1 text-sm text-slate-500">{entry.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#10203B]">{entry.amount}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{formatStatusLabel(entry.status, "Pending")}</p>
                        </div>
                        {entry.certificateUrl ? (
                          <a href={entry.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]">
                            Download file
                          </a>
                        ) : (
                          <button type="button" disabled className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-400">
                            Invoice pending
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                    Payment history appears here after membership activation and billing sync.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#10203B] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Membership record</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/65">Member ID</span>
                  <span className="text-sm font-medium">{memberIdDisplay}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/65">Type</span>
                  <span className="text-sm font-medium">{membershipCategoryLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/65">Expiry</span>
                  <span className="text-sm font-medium">{membershipExpiresDisplay}</span>
                </div>
                {isPartnerOwner ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/65">Additional seat</span>
                    <span className="text-sm font-medium">${partnerSeatPrice}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Invoices</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Invoice download is structured in the UI, but actual invoice files depend on the current payment sync. If a file is missing, request a copy from support.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <button type="button" disabled className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400">
                  <FileText className="h-4 w-4" />
                  Download latest invoice
                </button>
                <button type="button" onClick={() => setActiveTab("support")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]">
                  Contact billing support
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Events & Benefits"
          title="Member opportunities"
          description="Professional events, education opportunities, and member-only perks with clear filters and clean registration actions."
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {[
            { key: "all" as const, label: "All events" },
            { key: "members" as const, label: "Members only" },
            { key: "open" as const, label: "Open to all" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setEventAudienceFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                eventAudienceFilter === filter.key ? "bg-[#10203B] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filteredEventCards.length > 0 ? (
            filteredEventCards.map((item) => (
              <article key={item.id} className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${item.audience === "members" ? "bg-[#EAF4FF] text-[#4C7D9D]" : "bg-[#F4F4F5] text-slate-600"}`}>
                    {item.audience === "members" ? "Members only" : "Open to all"}
                  </span>
                  {item.discountLabel ? <span className="rounded-full bg-[#F1F8F3] px-3 py-1 text-[11px] font-medium text-emerald-700">{item.discountLabel}</span> : null}
                  {item.isPinned ? <span className="rounded-full bg-[#FFF5D8] px-3 py-1 text-[11px] font-medium text-amber-700">Highlighted</span> : null}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#10203B]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{item.body}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Date</p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">{item.dateDisplay}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Price</p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">{item.price}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Registration</p>
                    <p className="mt-2 text-sm font-medium text-[#10203B]">{item.ctaLabel || "Register"}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={item.ctaUrl || "/contact"}
                    target={item.ctaUrl ? "_blank" : undefined}
                    rel={item.ctaUrl ? "noreferrer" : undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                  >
                    Register
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {item.discountLabel ? (
                    <div className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                      {item.discountLabel}
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFE] p-8 text-center text-sm text-slate-500 xl:col-span-2">
              No events match the current filter yet.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const renderDirectory = () => (
    <div className="space-y-6">
      <SectionCard className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 md:px-7">
          <SectionHeader
            eyebrow="Member Directory"
            title="Networking and collaborations"
            description="Search active members, filter by level, country, and specialization, and open public-ready profile previews."
          />
        </div>
        <MembersDirectory locale="en" items={directoryMembers} mode="full" surface="dashboard" />
      </SectionCard>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Support / Requests"
          title="Need help from IBPA?"
          description="Use the existing contact workflow directly from your cabinet to ask a question, suggest an idea, or report a problem."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
            <div className="flex flex-wrap gap-3">
              {([
                { key: "question" as const, label: "Ask a question" },
                { key: "idea" as const, label: "Suggest an idea" },
                { key: "problem" as const, label: "Report a problem" },
              ]).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSupportMode(option.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    supportMode === option.key ? "bg-[#10203B] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Member email</p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">{dashboardContactEmail || "Unavailable"}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Member ID</p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">{memberIdDisplay}</p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Phone (optional)</span>
              <input
                value={supportPhone}
                onChange={(event) => setSupportPhone(event.target.value)}
                placeholder="Best number for follow-up"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#10203B] outline-none transition focus:border-[#4C7D9D]"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{supportTopicLabel}</span>
              <textarea
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                placeholder="Share enough detail so the team can help quickly."
                className="mt-2 min-h-[170px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-[#10203B] outline-none transition focus:border-[#4C7D9D]"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleSupportSubmit()}
                disabled={supportSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {supportSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send request
              </button>
              <a
                href="mailto:support@ibpassociations.org"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
              >
                Email support directly
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Quick answers</p>
              <div className="mt-4 space-y-3">
                {quickAnswers.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">FAQ</p>
              <div className="mt-4 space-y-3">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-sm font-medium text-[#10203B]">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Notifications"
          title="Updates and notification preferences"
          description="Application updates, support replies, renewal reminders, and new member opportunities in one calm space."
          action={
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
            >
              Open full notifications page
              <ExternalLink className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {allNotifications.length > 0 ? (
              allNotifications.map((item) => {
                const meta = getNotificationMeta(item);
                return (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-[#FBFCFE] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.categoryClassName}`}>{meta.categoryLabel}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.priorityClassName}`}>{meta.priorityLabel}</span>
                        </div>
                        <p className="mt-4 text-lg font-semibold text-[#10203B]">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      {item.unread ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" /> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#FBFCFE] p-6 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Preference center</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              These toggles are stored in this browser today and keep the UI ready for account-level notification settings later.
            </p>
            <div className="mt-5 space-y-3">
              {([
                { key: "applicationUpdates" as const, label: "Application updates" },
                { key: "certificateReminders" as const, label: "Certificate reminders" },
                { key: "membershipRenewal" as const, label: "Membership renewal" },
                { key: "eventInvitations" as const, label: "Event invitations" },
                { key: "supportReplies" as const, label: "Support replies" },
              ]).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => togglePreference(item.key)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left"
                >
                  <span className="text-sm font-medium text-[#10203B]">{item.label}</span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${notificationPreferences[item.key] ? "bg-[#EAF4FF] text-[#4C7D9D]" : "bg-slate-100 text-slate-500"}`}>
                    {notificationPreferences[item.key] ? "On" : "Off"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Settings"
          title="Account settings"
          description="Email settings, password and account management, notification preferences, and profile safety controls using the current auth stack."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Included today</p>
              <div className="mt-4 space-y-3">
                {[
                  "Email and account settings via the existing Clerk profile surface.",
                  "Password and security options where supported by your sign-in method.",
                  "Delete account only if it is enabled in the current auth configuration.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Notification preferences</p>
              <div className="mt-4 space-y-3">
                {Object.entries(notificationPreferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <span className="text-sm capitalize text-[#10203B]">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${value ? "bg-[#EAF4FF] text-[#4C7D9D]" : "bg-slate-100 text-slate-500"}`}>{value ? "Enabled" : "Muted"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3">
            {isSignedIn ? (
              <UserProfile routing="hash" />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                  <LogIn className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-lg font-semibold text-[#10203B]">Authentication required</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderTeamMembers = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Team Members"
          title="Partner team management"
          description="Invite specialists, review seat usage, and manage partner team access without changing existing partner logic."
        />
        <div className="mt-6">
          <TeamMembersPanel enabled={isPartnerOwner} />
        </div>
      </SectionCard>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfile();
      case "certificates":
        return renderCertificates();
      case "billing":
        return renderBilling();
      case "events":
        return renderEvents();
      case "directory":
        return renderDirectory();
      case "support":
        return renderSupport();
      case "notifications":
        return renderNotifications();
      case "settings":
        return renderSettings();
      case "teamMembers":
        return renderTeamMembers();
      case "dashboard":
      default:
        return renderDashboardOverview();
    }
  };

  const navItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "profile" as const, label: "Profile", icon: <User className="h-4 w-4" /> },
    ...(showCertificatesTab ? [{ key: "certificates" as const, label: "My Certificates", icon: <Award className="h-4 w-4" /> }] : []),
    ...(isPartnerOwner ? [{ key: "teamMembers" as const, label: "Team Members", icon: <UserPlus className="h-4 w-4" /> }] : []),
    { key: "billing" as const, label: "Billing & Membership", icon: <CreditCard className="h-4 w-4" /> },
    { key: "events" as const, label: "Events & Benefits", icon: <CalendarDays className="h-4 w-4" />, accent: hasNewEvents ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : null },
    { key: "directory" as const, label: "Member Directory", icon: <Search className="h-4 w-4" /> },
    { key: "support" as const, label: "Support", icon: <LifeBuoy className="h-4 w-4" /> },
    { key: "notifications" as const, label: "Notifications", icon: <Bell className="h-4 w-4" />, accent: unreadNotificationsCount > 0 ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : null },
    { key: "settings" as const, label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  const navContent = (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <NavButton
          key={item.key}
          active={activeTab === item.key}
          label={item.label}
          icon={item.icon}
          accent={item.accent}
          onClick={() => {
            setActiveTab(item.key);
            setIsMobileMenuOpen(false);
          }}
        />
      ))}
    </nav>
  );

  if (!userLoaded || (isSignedIn && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4C7D9D]" />
      </div>
    );
  }

  if (isSignedIn && accessBlocked) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-5xl">
          <SectionCard>
            <SectionHeader
              eyebrow="Dashboard Access"
              title="Membership activation required"
              description={
                accessErrorMessage ||
                "This dashboard opens only for paid IBPA members. Sign in with the same email used for your application and payment once your membership is completed."
              }
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-[#FBFCFE] p-5">
                <p className="text-sm font-semibold text-[#10203B]">Already paid?</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Use the same email address from your approved application and payment. If your payment just completed, wait a minute and refresh.
                </p>
              </div>
              <div className="rounded-[24px] bg-[#FBFCFE] p-5">
                <p className="text-sm font-semibold text-[#10203B]">Need help?</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  If payment is complete but access is still blocked, contact the IBPA team so we can verify and unlock your member cabinet.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-[#10203B] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]">
                Contact support
              </Link>
              <Link href="/apply" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]">
                Apply now
              </Link>
            </div>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10203B] text-white shadow-[0_12px_30px_rgba(16,32,59,0.18)]">
              <LayoutDashboard className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">IBPA</p>
              <p className="text-lg font-semibold tracking-tight text-[#10203B]">Member cabinet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
              aria-label="Open notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" /> : null}
            </button>

            <AnimatePresence>
              {isNotificationsOpen ? (
                <>
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNotificationsOpen(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-4 top-20 z-50 w-[min(90vw,420px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl md:right-6"
                  >
                    <div className="border-b border-slate-100 px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Notifications</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[#10203B]">Latest updates</h3>
                        {unreadNotificationsCount > 0 ? <span className="rounded-full bg-[#EAF4FF] px-3 py-1 text-[11px] font-medium text-[#4C7D9D]">{unreadNotificationsCount} new</span> : null}
                      </div>
                    </div>
                    <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
                      {alertCards.length > 0 ? (
                        alertCards.map((item) => (
                          <div key={item.id} className="rounded-2xl bg-[#F8FAFC] px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[#10203B]">{item.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                              </div>
                              {item.unread ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" /> : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] px-4 py-5 text-sm text-slate-500">
                          No fresh alerts yet.
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-100 px-4 py-4">
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block rounded-2xl bg-[#10203B] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#1a3157]"
                      >
                        Open notification center
                      </Link>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>

            {!userLoaded ? (
              <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
            ) : isSignedIn ? (
              <div className="flex items-center gap-3">
                <SignOutButton>
                  <button className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B] md:inline-flex">
                    Sign out
                  </button>
                </SignOutButton>
                <UserButton />
              </div>
            ) : (
              <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a3157]">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col bg-white px-5 py-5 shadow-2xl md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">IBPA</p>
                  <p className="text-lg font-semibold tracking-tight text-[#10203B]">Navigation</p>
                </div>
                <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto">
                {navContent}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[104px] space-y-4">
            <SectionCard className="p-4">
              <div className="mb-4 rounded-[24px] bg-[linear-gradient(135deg,#10203B_0%,#284872_100%)] p-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Current member</p>
                <p className="mt-2 text-lg font-semibold">{fullName}</p>
                <p className="mt-1 text-sm text-white/75">{memberIdDisplay}</p>
              </div>
              {navContent}
            </SectionCard>

            <SectionCard className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">Support</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Need a fast answer about membership, certificates, or event access?</p>
              <button type="button" onClick={() => setActiveTab("support")} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#10203B]">
                Open support
                <ChevronRight className="h-4 w-4" />
              </button>
            </SectionCard>
          </div>
        </aside>

        <section className="space-y-6">
          <SectionCard className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">Personal cabinet</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#10203B] md:text-4xl">
                  {activeTab === "dashboard"
                    ? "Dashboard overview"
                    : activeTab === "profile"
                      ? "Profile"
                      : activeTab === "certificates"
                        ? "My certificates"
                        : activeTab === "billing"
                          ? "Billing & membership"
                          : activeTab === "events"
                            ? "Events & benefits"
                            : activeTab === "directory"
                              ? "Member directory"
                              : activeTab === "support"
                                ? "Support"
                                : activeTab === "notifications"
                                  ? "Notifications"
                                  : activeTab === "teamMembers"
                                    ? "Team members"
                                    : "Settings"}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                  Modern member tools aligned with the IBPA public site style: clean, minimal, responsive, and grounded in your existing live data.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">{statusSummary.label}</p>
                </div>
                <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Member since</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">{memberSinceDisplay}</p>
                </div>
                <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Last sync</p>
                  <p className="mt-2 text-sm font-medium text-[#10203B]">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Just now"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
