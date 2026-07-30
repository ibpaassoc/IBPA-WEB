/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type {
  AdminCertificate,
  BillingHistoryEntry,
  Certificate,
  DashboardAccessType,
  DashboardContentItem,
  ExternalCertificate,
  DashboardMeta,
  DashboardProfileData,
  PartnerTeamSummary,
  TeamMemberAccessInfo,
} from "@/components/dashboard/dashboard-types";
import { normalizeNotifications, type DashboardNotification } from "@/lib/notifications";
import type { PublicMember } from "@/lib/public-members";

export function useDashboardData({
  isSignedIn,
  userLoaded,
}: {
  isSignedIn: boolean;
  userLoaded: boolean;
}) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [externalCertificates, setExternalCertificates] = useState<
    ExternalCertificate[]
  >([]);
  const [adminCertificates, setAdminCertificates] = useState<AdminCertificate[]>(
    [],
  );
  const [billingHistory, setBillingHistory] = useState<BillingHistoryEntry[]>([]);
  const [profileData, setProfileData] = useState<DashboardProfileData>({});
  const [dashboardMeta, setDashboardMeta] = useState<DashboardMeta>({});
  const [dashboardAccessType, setDashboardAccessType] =
    useState<DashboardAccessType>("member");
  const [teamMemberAccess, setTeamMemberAccess] =
    useState<TeamMemberAccessInfo | null>(null);
  const [directoryMembers, setDirectoryMembers] = useState<PublicMember[]>([]);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessErrorMessage, setAccessErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customNotifications, setCustomNotifications] = useState<
    DashboardNotification[]
  >([]);
  const [dashboardNews, setDashboardNews] = useState<DashboardContentItem[]>([]);
  const [dashboardEvents, setDashboardEvents] = useState<DashboardContentItem[]>(
    [],
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const markNotificationsAsRead = useCallback(async (ids?: string[]) => {
    const normalizedIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    if (normalizedIds.length === 0) return;

    try {
      const res = await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: normalizedIds }),
      });

      if (!res.ok) return;

      setCustomNotifications((prev) =>
        prev.map((item) =>
          normalizedIds.includes(item.id) ? { ...item, unread: false } : item,
        ),
      );
    } catch {
      // keep current UI state
    }
  }, []);

  const registerDashboardEvent = useCallback(async (eventId: string) => {
    const response = await fetch(`/api/dashboard/events/${eventId}/register`, {
      method: "POST",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string"
          ? payload.error
          : "Unable to register for this event right now.",
      );
    }

    const nextItem =
      payload?.item && typeof payload.item === "object" ? payload.item : null;

    if (nextItem?.id) {
      setDashboardEvents((prev) =>
        prev.map((item) =>
          item.id === nextItem.id
            ? {
                ...item,
                ...nextItem,
                isRegistered: true,
                registrationStatus:
                  typeof nextItem.registrationStatus === "string"
                    ? nextItem.registrationStatus
                    : "REGISTERED",
              }
            : item,
        ),
      );
    }

    return payload;
  }, []);

  const unregisterDashboardEvent = useCallback(async (eventId: string) => {
    const response = await fetch(`/api/dashboard/events/${eventId}/register`, {
      method: "DELETE",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string"
          ? payload.error
          : "Unable to unregister from this event right now.",
      );
    }

    const nextItem =
      payload?.item && typeof payload.item === "object" ? payload.item : null;

    if (nextItem?.id) {
      setDashboardEvents((prev) =>
        prev.map((item) =>
          item.id === nextItem.id
            ? {
                ...item,
                ...nextItem,
                isRegistered: false,
                registrationStatus: null,
                registrationId: null,
                registrationSource: null,
              }
            : item,
        ),
      );
    }

    return payload;
  }, []);

  const refreshDashboardData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!isSignedIn) {
        setCertificates([]);
        setProfileData({});
        setExternalCertificates([]);
        setAdminCertificates([]);
        setBillingHistory([]);
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

      if (!silent) setLoading(true);

      try {
        const [
          certRes,
          profRes,
          notificationsRes,
          newsRes,
          eventsRes,
          communityRes,
        ] = await Promise.all([
          fetch("/api/dashboard/me", { cache: "no-store" }),
          fetch("/api/dashboard/profile", { cache: "no-store" }),
          fetch("/api/dashboard/notifications", { cache: "no-store" }),
          fetch("/api/content?type=news&target=dashboard", { cache: "no-store" }),
          fetch("/api/dashboard/events", { cache: "no-store" }),
          fetch("/api/dashboard/community/members", { cache: "no-store" }),
        ]);

        if (certRes.status === 401 || profRes.status === 401) {
          setCertificates([]);
          setProfileData({});
          setExternalCertificates([]);
        setAdminCertificates([]);
          setBillingHistory([]);
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
          setAccessErrorMessage(
            "This dashboard becomes available after your IBPA membership payment is completed and activated.",
          );
          setCertificates([]);
          setProfileData({});
          setExternalCertificates([]);
        setAdminCertificates([]);
          setBillingHistory([]);
          setDirectoryMembers([]);
          setDashboardMeta({});
          setDashboardAccessType("member");
          setTeamMemberAccess(null);
          setCustomNotifications([]);
          setDashboardNews([]);
          setDashboardEvents([]);
          return;
        }

        const [
          certData,
          profileJson,
          notificationsJson,
          newsJson,
          eventsJson,
          communityJson,
        ] = await Promise.all([
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
          setCertificates(
            Array.isArray(certData.certificates) ? certData.certificates : [],
          );
          setExternalCertificates(
            Array.isArray(certData.externalCertificates)
              ? certData.externalCertificates
              : [],
          );
          setAdminCertificates(
            Array.isArray(certData.adminCertificates)
              ? certData.adminCertificates
              : [],
          );
          setBillingHistory(
            Array.isArray(certData.paymentHistory)
              ? certData.paymentHistory
              : [],
          );

          setDashboardMeta({
            accountType:
              typeof certData?.accountType === "string" ? certData.accountType : null,
            applicationType:
              typeof certData?.applicationType === "string"
                ? certData.applicationType
                : null,
            orderType:
              typeof certData?.orderType === "string" ? certData.orderType : null,
            membershipStatus:
              typeof certData?.membershipStatus === "string"
                ? certData.membershipStatus
                : null,
            paymentStatus:
              typeof certData?.paymentStatus === "string"
                ? certData.paymentStatus
                : null,
            certificateStatus:
              typeof certData?.certificateStatus === "string"
                ? certData.certificateStatus
                : null,
            partnerTeam:
              certData?.partnerTeam && typeof certData.partnerTeam === "object"
                ? (certData.partnerTeam as PartnerTeamSummary)
                : null,
          });

          const accessFromMe = certData?.dashboardAccess?.type;

          if (
            accessFromMe === "member" ||
            accessFromMe === "partner_owner" ||
            accessFromMe === "partner_team_member"
          ) {
            setDashboardAccessType(accessFromMe);
          }

          if (accessFromMe === "partner_team_member" && certData?.dashboardAccess) {
            setTeamMemberAccess({
              teamMemberId: certData.dashboardAccess.teamMemberId || "Pending",
              role: certData.dashboardAccess.role || "Team Member",
              licenseNumber:
                certData.dashboardAccess.licenseNumber || "Not provided",
              status: certData.dashboardAccess.teamMemberStatus || "invited",
              ownerMemberId:
                certData.dashboardAccess.ownerMemberId || "IBPA #000123",
              partnerBusinessName:
                certData.dashboardAccess.partnerName || "Partner Account",
              partnerBusinessEmail:
                certData.dashboardAccess.partnerEmail || "Not provided",
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

          if (
            accessFromProfile === "member" ||
            accessFromProfile === "partner_owner" ||
            accessFromProfile === "partner_team_member"
          ) {
            setDashboardAccessType(accessFromProfile);
          }

          if (nextProfile.teamMember) {
            setTeamMemberAccess(nextProfile.teamMember);
          } else if (accessFromProfile !== "partner_team_member") {
            setTeamMemberAccess(null);
          }
        }

        if (notificationsRes.ok && notificationsJson) {
          setCustomNotifications(
            normalizeNotifications(
              Array.isArray(notificationsJson.notifications)
                ? notificationsJson.notifications
                : [],
            ),
          );
        }

        if (newsRes.ok && newsJson) {
          setDashboardNews(Array.isArray(newsJson.items) ? newsJson.items : []);
        }

        if (eventsRes.ok && eventsJson) {
          setDashboardEvents(Array.isArray(eventsJson.items) ? eventsJson.items : []);
        }

        if (communityRes.ok && communityJson) {
          setDirectoryMembers(
            Array.isArray(communityJson.items) ? communityJson.items : [],
          );
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

  return {
    certificates,
    externalCertificates,
    adminCertificates,
    billingHistory,
    profileData,
    dashboardMeta,
    dashboardAccessType,
    teamMemberAccess,
    directoryMembers,
    accessBlocked,
    accessErrorMessage,
    loading,
    customNotifications,
    setCustomNotifications,
    dashboardNews,
    dashboardEvents,
    lastSyncedAt,
    markNotificationsAsRead,
    registerDashboardEvent,
    unregisterDashboardEvent,
    refreshDashboardData,
  };
}
