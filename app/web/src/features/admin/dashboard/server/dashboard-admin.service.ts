import { listMemberApplications, listPartnerApplications } from "../../applications/server/application-admin.repository";
import { listContentItems } from "../../events/server/event-admin.repository";
import { listProfiles } from "../../profiles/server/profile-admin.repository";
import type { AdminOrder, AdminPartnerApplication } from "../../shared/types/admin.types";
import { formatAdminDate, formatAdminDateTime } from "../../shared/utils/admin-formatters";
import type {
  AdminOverviewActivity,
  AdminOverviewData,
  AdminOverviewEvent,
  AdminOverviewPayment,
  AdminOverviewStat,
} from "../types/dashboard-admin.types";

const RECENT_LIMIT = 6;
const UPCOMING_EVENTS_LIMIT = 5;

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function buildStats(
  memberTotal: number,
  upcomingEventsCount: number,
  publishedArticlesCount: number,
  paidThisMonth: number,
): AdminOverviewStat[] {
  return [
    {
      key: "members",
      label: "Total members",
      value: memberTotal,
      href: "/admin/members",
    },
    {
      key: "active-events",
      label: "Active events",
      value: upcomingEventsCount,
      href: "/admin/events",
    },
    {
      key: "revenue",
      label: "Revenue this month",
      value: paidThisMonth,
      href: "/admin/payments",
    },
    {
      key: "articles",
      label: "Published articles",
      value: publishedArticlesCount,
      href: "/admin/articles",
    },
  ];
}

function buildUpcomingEvents(
  contentItems: Awaited<ReturnType<typeof listContentItems>>,
): AdminOverviewEvent[] {
  const now = Date.now();

  return (contentItems?.items ?? [])
    .filter((item) => item.type === "events" && item.eventDate && toTimestamp(item.eventDate) >= now)
    .sort((a, b) => toTimestamp(a.eventDate) - toTimestamp(b.eventDate))
    .slice(0, UPCOMING_EVENTS_LIMIT)
    .map((item) => ({
      id: item.id,
      title: item.title,
      dateLabel: formatAdminDate(item.eventDate),
      location: item.eventAddress?.trim() || "Location to be announced",
      href: "/admin/events",
    }));
}

function buildRecentPayments(memberOrders: AdminOrder[], partnerApplications: AdminPartnerApplication[]): AdminOverviewPayment[] {
  const memberPayments: Array<AdminOverviewPayment & { timestamp: number }> = memberOrders
    .filter((order) => order.status === "paid")
    .map((order) => ({
      id: `member:${order.id}`,
      name: order.name || order.email,
      source: "member" as const,
      sourceLabel: "Member",
      statusLabel: "Paid",
      statusTone: "success" as const,
      dateLabel: formatAdminDate(order.createdAt),
      href: "/admin/payments",
      timestamp: toTimestamp(order.createdAt),
    }));

  const partnerPayments: Array<AdminOverviewPayment & { timestamp: number }> = partnerApplications
    .filter((application) => application.paymentStatus === "PAID")
    .map((application) => ({
      id: `partner:${application.id}`,
      name: application.name || application.email,
      source: "partner" as const,
      sourceLabel: "Partner",
      statusLabel: "Paid",
      statusTone: "success" as const,
      dateLabel: formatAdminDate(application.paidAt ?? application.updatedAt),
      href: "/admin/payments",
      timestamp: toTimestamp(application.paidAt ?? application.updatedAt),
    }));

  return [...memberPayments, ...partnerPayments]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, RECENT_LIMIT)
    .map(({ timestamp: _timestamp, ...payment }) => payment);
}

function buildRecentActivity(
  memberOrders: AdminOrder[],
  partnerApplications: AdminPartnerApplication[],
  contentItems: Awaited<ReturnType<typeof listContentItems>>,
): AdminOverviewActivity[] {
  const entries: Array<AdminOverviewActivity & { timestamp: number }> = [];

  for (const order of memberOrders) {
    entries.push({
      id: `member-submitted:${order.id}`,
      title: `${order.name || order.email} submitted a member application`,
      description: order.membershipCategory || "Membership application",
      dateLabel: formatAdminDateTime(order.createdAt),
      timestamp: toTimestamp(order.createdAt),
      tone: "info",
      href: "/admin/applications",
    });

    if (order.status === "approved" || order.status === "paid") {
      entries.push({
        id: `member-approved:${order.id}`,
        title: `${order.name || order.email}'s membership was approved`,
        description: order.certificateNumber ? `Certificate ${order.certificateNumber}` : "Membership approved",
        dateLabel: formatAdminDateTime(order.createdAt),
        timestamp: toTimestamp(order.createdAt),
        tone: "success",
        href: "/admin/profiles",
      });
    }
  }

  for (const application of partnerApplications) {
    entries.push({
      id: `partner-submitted:${application.id}`,
      title: `${application.name || application.email} applied as a partner`,
      description: application.requestedTier ? `Requested tier: ${application.requestedTier}` : "Partner application",
      dateLabel: formatAdminDateTime(application.createdAt),
      timestamp: toTimestamp(application.createdAt),
      tone: "info",
      href: "/admin/applications?applicantType=partner",
    });

    if (application.status === "APPROVED" && application.approvedAt) {
      entries.push({
        id: `partner-approved:${application.id}`,
        title: `${application.name || application.email}'s partner application was approved`,
        description: application.requestedTier ? `Tier: ${application.requestedTier}` : "Partner approved",
        dateLabel: formatAdminDateTime(application.approvedAt),
        timestamp: toTimestamp(application.approvedAt),
        tone: "success",
        href: "/admin/applications?applicantType=partner",
      });
    }

    if (application.paymentStatus === "PAID" && application.paidAt) {
      entries.push({
        id: `partner-paid:${application.id}`,
        title: `${application.name || application.email} completed a partner payment`,
        description: "Partner payment received",
        dateLabel: formatAdminDateTime(application.paidAt),
        timestamp: toTimestamp(application.paidAt),
        tone: "success",
        href: "/admin/payments",
      });
    }
  }

  for (const item of contentItems?.items ?? []) {
    if (item.type !== "events") continue;

    entries.push({
      id: `event-published:${item.id}`,
      title: `Event "${item.title}" was ${item.publishToSite || item.publishToDashboard ? "published" : "saved as a draft"}`,
      description: item.eventDate ? `Scheduled for ${formatAdminDate(item.eventDate)}` : "Date to be announced",
      dateLabel: formatAdminDateTime(item.updatedAt ?? item.createdAt),
      timestamp: toTimestamp(item.updatedAt ?? item.createdAt),
      tone: "neutral",
      href: "/admin/events",
    });
  }

  return entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, RECENT_LIMIT)
    .map(({ timestamp: _timestamp, ...activity }) => activity);
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const [profilesResult, memberOrdersResult, partnerApplicationsResult, contentResult] = await Promise.allSettled([
    listProfiles({ limit: 1 }),
    listMemberApplications({ limit: 100 }),
    listPartnerApplications({ limit: 100 }),
    listContentItems(),
  ]);

  const memberTotal = profilesResult.status === "fulfilled" ? profilesResult.value.total : 0;

  const memberOrders = memberOrdersResult.status === "fulfilled" ? memberOrdersResult.value.items : [];
  const memberSummary = memberOrdersResult.status === "fulfilled" ? memberOrdersResult.value.summary : null;

  const partnerApplications = partnerApplicationsResult.status === "fulfilled" ? partnerApplicationsResult.value.items : [];
  const partnerSummary = partnerApplicationsResult.status === "fulfilled" ? partnerApplicationsResult.value.summary : null;

  const contentItems =
    contentResult.status === "fulfilled" && contentResult.value ? contentResult.value : { items: [] };

  const upcomingEvents = buildUpcomingEvents(contentItems);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = memberOrders.filter(
    (o) => o.status === "paid" && new Date(o.createdAt ?? "") >= startOfMonth,
  ).length;

  const publishedArticlesCount =
    contentItems.items?.filter((i) => i.type === "news" && (i.publishToSite || i.publishToDashboard)).length ?? 0;

  return {
    stats: buildStats(memberTotal, upcomingEvents.length, publishedArticlesCount, paidThisMonth),
    upcomingEvents,
    recentPayments: buildRecentPayments(memberOrders, partnerApplications),
    recentActivity: buildRecentActivity(memberOrders, partnerApplications, contentItems),
  };
}
