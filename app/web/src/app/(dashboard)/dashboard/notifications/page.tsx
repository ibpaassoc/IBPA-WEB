"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bell, ChevronLeft, Loader2 } from "lucide-react";
import { buildSystemNotifications, normalizeNotifications, type DashboardNotification } from "@/lib/notifications";
const DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY = "ibpa-dashboard-system-notifications-seen";

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
      return "Student Membership";
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

export default function NotificationsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [customNotifications, setCustomNotifications] = useState<DashboardNotification[]>([]);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
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
      // Keep the current UI state if marking notifications as read fails.
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
          setCustomNotifications(normalizeNotifications(Array.isArray(data.notifications) ? data.notifications : []));
        }

        setLastSyncedAt(new Date().toISOString());
      } catch {
        // Preserve the last known good state during transient network failures.
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
      const stored = window.localStorage.getItem(DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY);
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

  const hasApprovedCert = certificates.some((item) => item.status === "approved" || item.status === "paid");
  const primaryCertificate = certificates[0];
  const membershipCategoryLabel = formatMembershipCategory(primaryCertificate?.membershipCategory);

  const notifications = useMemo(() => {
    const system = buildSystemNotifications({
      hasApprovedCert,
      membershipCategoryLabel,
      primaryCertificate,
      userCreatedAt: user?.createdAt?.toISOString(),
    });

    const normalizedSystemNotifications = system.map((item) => ({
      ...item,
      unread: item.unread && !seenSystemNotifications.includes(getNotificationSignature(item)),
    }));

    return normalizeNotifications([...customNotifications, ...normalizedSystemNotifications]).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [customNotifications, hasApprovedCert, membershipCategoryLabel, primaryCertificate, seenSystemNotifications, user?.createdAt]);

  useEffect(() => {
    const unreadCustomIds = customNotifications.filter((item) => item.unread).map((item) => item.id);
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
      window.localStorage.setItem(DASHBOARD_SYSTEM_NOTIFICATIONS_SEEN_KEY, JSON.stringify(nextSeen));
      setSeenSystemNotifications(nextSeen);
    }
  }, [hasApprovedCert, membershipCategoryLabel, primaryCertificate, seenSystemNotifications, user?.createdAt]);

  if (isSignedIn && accessBlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Notifications</p>
            <h1 className="mt-4 text-3xl uppercase font-anton text-slate-900 md:text-5xl">
              Dashboard Access Required
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
              Notifications are available only for paid IBPA members whose dashboard access has been activated.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] hover:text-black"
              >
                Back to Dashboard
              </Link>
              <Link
                href="https://ibpassociations.org/contact"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Notification Center</p>
            <h1 className="mt-3 text-3xl uppercase font-anton text-slate-900 md:text-5xl">
              All Notifications
            </h1>
            {lastSyncedAt && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#72A0C1]" />
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5 md:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#72A0C1] shadow-sm">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">
                          {item.title}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${getNotificationMeta(item).categoryClassName}`}>
                            {getNotificationMeta(item).categoryLabel}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${getNotificationMeta(item).priorityClassName}`}>
                            {getNotificationMeta(item).priorityLabel}
                          </span>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                        {item.ctaLabel && item.ctaUrl && (
                          <a
                            href={item.ctaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center rounded-full border border-[#72A0C1]/20 bg-[#72A0C1]/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#72A0C1] transition-colors hover:border-[#72A0C1] hover:bg-[#72A0C1]/10"
                          >
                            {item.ctaLabel}
                          </a>
                        )}
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                          {new Date(item.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {item.unread && <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#72A0C1] animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
