"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";

import {
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  SectionCard,
  SectionHeader,
} from "@/components/dashboard/DashboardShared";
import {
  buildSystemNotifications,
  normalizeNotifications,
  type DashboardNotification,
} from "@/lib/notifications";

const DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY =
  "ibpa-dashboard-system-notifications-seen";

function getNotificationSignature(notification: DashboardNotification) {
  return `${notification.id}:${notification.timestamp}`;
}

interface Certificate {
  certNumber: string;
  orderEmail: string;
  orderName: string;
  membershipCategory?: string | null;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
}

function formatMembershipCategory(category?: string | null) {
  switch (category) {
    case "Student":
    case "Specialist":
      return "Specialist Membership";
    case "Professional":
      return "Professional Membership";
    case "Trainer":
      return "Trainer Membership";
    case "Business":
      return "Business Membership";
    case "Brand":
      return "Brand Membership";
    default:
      return "Membership Review";
  }
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

export default function NotificationsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [customNotifications, setCustomNotifications] = useState<
    DashboardNotification[]
  >([]);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [seenSystemNotifications, setSeenSystemNotifications] = useState<
    string[]
  >([]);

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
        prev.map((item) =>
          normalizedIds.includes(item.id) ? { ...item, unread: false } : item,
        ),
      );
    } catch {
      // Keep the last known UI state on transient failures.
    }
  }, []);

  const refreshNotifications = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!isSignedIn) {
        setAccessBlocked(false);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const [certRes, notificationsRes] = await Promise.all([
          fetch("/api/dashboard/me", { cache: "no-store" }),
          fetch("/api/dashboard/notifications", { cache: "no-store" }),
        ]);

        if (certRes.status === 403 || notificationsRes.status === 403) {
          setAccessBlocked(true);
          setCertificates([]);
          setCustomNotifications([]);
          return;
        }

        const contentType = certRes.headers.get("content-type");

        if (certRes.ok && contentType?.includes("application/json")) {
          setAccessBlocked(false);
          const data = await certRes.json();
          setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
        }

        if (notificationsRes.ok) {
          const data = await notificationsRes.json();
          setCustomNotifications(
            normalizeNotifications(
              Array.isArray(data.notifications) ? data.notifications : [],
            ),
          );
        }

        setLastSyncedAt(new Date().toISOString());
      } catch {
        // Preserve the last known state during network failures.
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn],
  );

  useEffect(() => {
    if (isLoaded) {
      void refreshNotifications();
    }
  }, [isLoaded, refreshNotifications]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(
        DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY,
      );
      setSeenSystemNotifications(stored ? JSON.parse(stored) : []);
    } catch {
      setSeenSystemNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshNotifications({ silent: true });
    }, 30000);

    const handleFocus = () => {
      void refreshNotifications({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, refreshNotifications]);

  const hasApprovedCert = certificates.some(
    (item) => item.status === "approved" || item.status === "paid",
  );
  const primaryCertificate = certificates[0];
  const membershipCategoryLabel = formatMembershipCategory(
    primaryCertificate?.membershipCategory,
  );

  const notifications = useMemo(() => {
    const system = buildSystemNotifications({
      hasApprovedCert,
      membershipCategoryLabel,
      primaryCertificate,
      userCreatedAt: user?.createdAt?.toISOString(),
    });

    const normalizedSystemNotifications = system.map((item) => ({
      ...item,
      unread:
        item.unread &&
        !seenSystemNotifications.includes(getNotificationSignature(item)),
    }));

    return normalizeNotifications([
      ...customNotifications,
      ...normalizedSystemNotifications,
    ]).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [
    customNotifications,
    hasApprovedCert,
    membershipCategoryLabel,
    primaryCertificate,
    seenSystemNotifications,
    user?.createdAt,
  ]);

  useEffect(() => {
    const unreadCustomIds = customNotifications
      .filter((item) => item.unread)
      .map((item) => item.id);

    if (unreadCustomIds.length > 0) {
      void markNotificationsAsRead(unreadCustomIds);
    }
  }, [customNotifications, markNotificationsAsRead]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const system = buildSystemNotifications({
      hasApprovedCert,
      membershipCategoryLabel,
      primaryCertificate,
      userCreatedAt: user?.createdAt?.toISOString(),
    });

    const signatures = system.map(getNotificationSignature);
    const nextSeen = Array.from(new Set([...seenSystemNotifications, ...signatures]));

    if (nextSeen.length !== seenSystemNotifications.length) {
      window.localStorage.setItem(
        DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY,
        JSON.stringify(nextSeen),
      );
      setSeenSystemNotifications(nextSeen);
    }
  }, [
    hasApprovedCert,
    membershipCategoryLabel,
    primaryCertificate,
    seenSystemNotifications,
    user?.createdAt,
  ]);

  if (isSignedIn && accessBlocked) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <SectionCard>
            <SectionHeader title="Notifications" />
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              Notifications are available only for paid IBPA members whose dashboard access has been activated.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className={dashboardPrimaryButtonClassName}>
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <Link
                href="https://ibpassociations.org/contact"
                className={dashboardSecondaryButtonClassName}
              >
                Contact Support
              </Link>
            </div>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className={dashboardSecondaryButtonClassName}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {lastSyncedAt ? (
            <p className="text-sm text-slate-400">
              Updated{" "}
              {new Date(lastSyncedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>

        <SectionCard>
          <SectionHeader title="Notifications" />

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#4C7D9D]" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="mt-6 space-y-3">
              {notifications.map((item) => {
                const meta = getNotificationMeta(item);

                return (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#4C7D9D]">
                          <Bell className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.categoryClassName}`}
                            >
                              {meta.categoryLabel}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.priorityClassName}`}
                            >
                              {meta.priorityLabel}
                            </span>
                          </div>

                          <p className="mt-3 text-base font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {item.description}
                          </p>

                          {item.ctaLabel && item.ctaUrl ? (
                            <a
                              href={item.ctaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`${dashboardSecondaryButtonClassName} mt-4`}
                            >
                              {item.ctaLabel}
                            </a>
                          ) : null}

                          <p className="mt-3 text-xs text-slate-400">
                            {new Date(item.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {item.unread ? (
                        <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[#4C7D9D]" />
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[22px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
        </SectionCard>
      </div>
    </main>
  );
}
