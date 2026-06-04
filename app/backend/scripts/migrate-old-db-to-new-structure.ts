import "../src/load-env";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import {
  applicationAdditionalFiles,
  certificates,
  contentItems,
  coreFiles,
  dashboardNotifications,
  emailLogs,
  orders,
  partnerApplications,
  requireDb,
  stripeWebhookEvents,
  teamMembers,
  teamSeatExtensions,
  users,
} from "../src/lib/db";
import type {
  ApplicationAdditionalFile,
  Certificate,
  ContentItem,
  DashboardNotificationRecord,
  EmailLog,
  Order,
  PartnerApplication,
  StripeWebhookEvent,
  TeamMember,
  TeamSeatExtension,
  User,
} from "../src/lib/db";
import { syncCanonicalUserFromLegacyOrder, syncCanonicalUserFromLegacyUser } from "../src/features/users/server/user.service";
import { syncLegacyUserProfile } from "../src/features/profiles/server/profile.service";
import { syncLegacyOrderApplication, syncLegacyPartnerApplication } from "../src/features/applications/server/application.service";
import { syncLegacyOrderMembership } from "../src/features/memberships/server/membership.service";
import { syncLegacyOrderPayment, syncLegacyPartnerApplicationPayment, syncLegacyStripeWebhookEvent } from "../src/features/payments/server/payment.service";
import { syncLegacyCertificate } from "../src/features/certificates/server/certificate.service";
import { syncLegacyTeam, syncLegacyTeamMember } from "../src/features/teams/server/team.service";
import { upsertCanonicalEvent } from "../src/features/events/server/event.repository";
import { upsertCanonicalArticle } from "../src/features/news/server/article.repository";
import { insertCanonicalNotification } from "../src/features/notifications/server/notification.repository";

type Counter = {
  processed: number;
  created: number;
  skipped: number;
  duplicated: number;
  failed: number;
};

type Report = Record<string, Counter>;

const report: Report = {
  users: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  profiles: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  applications: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  memberships: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  payments: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  certificates: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  events: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  news: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  notifications: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  teams: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  team_members: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  files: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
  stripe_webhook_events: { processed: 0, created: 0, skipped: 0, duplicated: 0, failed: 0 },
};

function trackSkipped(key: keyof typeof report) {
  report[key].processed += 1;
  report[key].skipped += 1;
}

function trackResult<T extends { created: boolean } | null>(key: keyof typeof report, result: T) {
  report[key].processed += 1;

  if (!result) {
    report[key].skipped += 1;
    return;
  }

  if (result.created) {
    report[key].created += 1;
  } else {
    report[key].duplicated += 1;
  }
}

function trackFailure(key: keyof typeof report, error: unknown, detail: string) {
  report[key].processed += 1;
  report[key].failed += 1;
  console.error(`[Migration:${key}] ${detail}`, error);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function isMissingRelationError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("relation");
}

function deterministicUuid(seed: string) {
  const hash = crypto.createHash("sha1").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function upsertCoreFile(db: ReturnType<typeof requireDb>, input: {
  id: string;
  ownerUserId?: string | null;
  relatedId?: string | null;
  type: "PROFILE" | "APPLICATION" | "EVENT";
  fileUrl: string;
  fileName?: string | null;
  createdAt?: Date;
}) {
  const [existing] = await db.select().from(coreFiles).where(eq(coreFiles.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreFiles)
      .set({
        ownerUserId: input.ownerUserId ?? existing.ownerUserId,
        relatedId: input.relatedId ?? existing.relatedId,
        type: input.type,
        fileUrl: input.fileUrl,
        fileName: input.fileName ?? existing.fileName,
        createdAt: input.createdAt ?? existing.createdAt,
      })
      .where(eq(coreFiles.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreFiles)
    .values({
      id: input.id,
      ownerUserId: input.ownerUserId ?? null,
      relatedId: input.relatedId ?? null,
      type: input.type,
      fileUrl: input.fileUrl,
      fileName: input.fileName ?? null,
      createdAt: input.createdAt ?? new Date(),
    })
    .returning();

  return { record: created, created: true };
}

async function main() {
  const db = requireDb();
  const safeLoad = async <T>(label: string, loader: () => Promise<T[]>) => {
    try {
      return await loader();
    } catch (error) {
      if (isMissingRelationError(error)) {
        console.warn(`[Migration] Skipping optional legacy table for ${label} because it does not exist yet.`);
        return [] as T[];
      }

      throw error;
    }
  };

  const [
    legacyUsers,
    legacyOrders,
    legacyCertificates,
    legacyApplicationFiles,
    legacyPartnerApplications,
    legacyContentItems,
    legacyDashboardNotifications,
    legacyEmailLogs,
    legacyTeamMembers,
    legacySeatExtensions,
    legacyStripeWebhookEvents,
  ] = await Promise.all([
    safeLoad<User>("users", () => db.select().from(users)),
    safeLoad<Order>("orders", () => db.select().from(orders)),
    safeLoad<Certificate>("certificates", () => db.select().from(certificates)),
    safeLoad<ApplicationAdditionalFile>("application_additional_files", () => db.select().from(applicationAdditionalFiles)),
    safeLoad<PartnerApplication>("partner_applications", () => db.select().from(partnerApplications)),
    safeLoad<ContentItem>("content_items", () => db.select().from(contentItems)),
    safeLoad<DashboardNotificationRecord>("dashboard_notifications", () => db.select().from(dashboardNotifications)),
    safeLoad<EmailLog>("email_logs", () => db.select().from(emailLogs)),
    safeLoad<TeamMember>("team_members", () => db.select().from(teamMembers)),
    safeLoad<TeamSeatExtension>("team_seat_extensions", () => db.select().from(teamSeatExtensions)),
    safeLoad<StripeWebhookEvent>("stripe_webhook_events", () => db.select().from(stripeWebhookEvents)),
  ]);

  const latestOrderByEmail = new Map<string, typeof legacyOrders[number]>();
  const orderById = new Map<string, typeof legacyOrders[number]>();
  const certificateByOrderId = new Map<string, typeof legacyCertificates[number]>();
  const applicationFilesByOrderId = new Map<string, typeof legacyApplicationFiles>();
  const seatExtensionsByOrderId = new Map<string, typeof legacySeatExtensions>();
  const teamMembersByOrderId = new Map<string, typeof legacyTeamMembers>();

  for (const order of legacyOrders) {
    orderById.set(order.id, order);
    const email = normalizeEmail(order.email);
    const existing = latestOrderByEmail.get(email);

    if (!existing || new Date(order.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      latestOrderByEmail.set(email, order);
    }
  }

  for (const certificate of legacyCertificates) {
    certificateByOrderId.set(certificate.orderId, certificate);
  }

  for (const file of legacyApplicationFiles) {
    const existing = applicationFilesByOrderId.get(file.applicationId) ?? [];
    existing.push(file);
    applicationFilesByOrderId.set(file.applicationId, existing);
  }

  for (const extension of legacySeatExtensions) {
    const existing = seatExtensionsByOrderId.get(extension.partnerOrderId) ?? [];
    existing.push(extension);
    seatExtensionsByOrderId.set(extension.partnerOrderId, existing);
  }

  for (const member of legacyTeamMembers) {
    const existing = teamMembersByOrderId.get(member.ownerOrderId) ?? [];
    existing.push(member);
    teamMembersByOrderId.set(member.ownerOrderId, existing);
  }

  const canonicalUserIdByEmail = new Map<string, string>();
  const canonicalUserIdByClerkId = new Map<string, string>();

  const rememberUser = (record: { id: string; email: string; clerkId: string | null }) => {
    canonicalUserIdByEmail.set(normalizeEmail(record.email), record.id);
    if (record.clerkId) {
      canonicalUserIdByClerkId.set(record.clerkId, record.id);
    }
  };

  for (const legacyUser of legacyUsers) {
    try {
      const userResult = await syncCanonicalUserFromLegacyUser(db, legacyUser);
      trackResult("users", userResult);
      rememberUser(userResult.record);
    } catch (error) {
      trackFailure("users", error, `legacy user ${legacyUser.clerkId}`);
      continue;
    }

    try {
      const canonicalUserId = canonicalUserIdByClerkId.get(legacyUser.clerkId) ?? canonicalUserIdByEmail.get(normalizeEmail(legacyUser.email));
      if (!canonicalUserId) {
        trackSkipped("profiles");
        continue;
      }

      const latestOrder = latestOrderByEmail.get(normalizeEmail(legacyUser.email));
      const profileResult = await syncLegacyUserProfile(db, {
        canonicalUserId,
        legacyUser,
        applicationPayload: latestOrder?.applicationPayload,
      });
      trackResult("profiles", profileResult);
    } catch (error) {
      trackFailure("profiles", error, `legacy profile ${legacyUser.clerkId}`);
    }
  }

  for (const order of legacyOrders) {
    const normalizedEmail = normalizeEmail(order.email);
    let canonicalUserId = canonicalUserIdByEmail.get(normalizedEmail);

    if (!canonicalUserId) {
      try {
        const userResult = await syncCanonicalUserFromLegacyOrder(db, order);
        trackResult("users", userResult);
        rememberUser(userResult.record);
        canonicalUserId = userResult.record.id;
      } catch (error) {
        trackFailure("users", error, `legacy order user ${order.id}`);
      }
    }

    try {
      const applicationFiles = (applicationFilesByOrderId.get(order.id) ?? []).map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
      }));

      const applicationResult = await syncLegacyOrderApplication(db, {
        order,
        userId: canonicalUserId ?? null,
        applicationFiles,
      });
      trackResult("applications", applicationResult);
    } catch (error) {
      trackFailure("applications", error, `legacy order ${order.id}`);
    }

    if (order.status === "paid" && canonicalUserId) {
      let membershipCreated = false;

      try {
        const membershipResult = await syncLegacyOrderMembership(db, {
          order,
          userId: canonicalUserId,
          certificate: certificateByOrderId.get(order.id) ?? null,
        });
        trackResult("memberships", membershipResult);
        membershipCreated = Boolean(membershipResult?.record?.id);
      } catch (error) {
        trackFailure("memberships", error, `legacy membership ${order.id}`);
      }

      const certificate = certificateByOrderId.get(order.id);
      if (certificate && membershipCreated) {
        try {
          const certificateResult = await syncLegacyCertificate(db, {
            certificate,
            membershipId: order.id,
          });
          trackResult("certificates", certificateResult);
        } catch (error) {
          trackFailure("certificates", error, `legacy certificate ${certificate.id}`);
        }
      }
    } else if (order.status === "paid") {
      trackSkipped("memberships");
    }

    if (order.stripeSessionId || order.status === "paid") {
      try {
        const paymentResult = await syncLegacyOrderPayment(db, {
          order,
          userId: canonicalUserId ?? null,
        });
        trackResult("payments", paymentResult);
      } catch (error) {
        trackFailure("payments", error, `legacy payment ${order.id}`);
      }
    }

    if (order.accountType?.toLowerCase() === "partner" && order.status === "paid" && canonicalUserId) {
      try {
        const teamResult = await syncLegacyTeam(db, {
          order,
          ownerUserId: canonicalUserId,
          seatExtensions: seatExtensionsByOrderId.get(order.id) ?? [],
        });
        trackResult("teams", teamResult);
      } catch (error) {
        trackFailure("teams", error, `legacy team ${order.id}`);
      }
    }

    for (const file of applicationFilesByOrderId.get(order.id) ?? []) {
      try {
        const fileResult = await upsertCoreFile(db, {
          id: file.id,
          ownerUserId: canonicalUserId ?? null,
          relatedId: order.id,
          type: "APPLICATION",
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          createdAt: file.createdAt,
        });
        trackResult("files", fileResult);
      } catch (error) {
        trackFailure("files", error, `legacy application file ${file.id}`);
      }
    }
  }

  for (const application of legacyPartnerApplications) {
    let canonicalUserId = canonicalUserIdByEmail.get(normalizeEmail(application.email));

    if (!canonicalUserId) {
      try {
        const userResult = await syncCanonicalUserFromLegacyOrder(db, {
          id: application.id,
          email: application.email,
          name: application.name,
          accountType: "partner",
          membershipCategory: application.requestedTier,
          applicantType: "Partner",
          applicationPayload: { message: application.message },
          status: application.paymentStatus === "PAID" ? "paid" : "approved",
          stripeSessionId: application.stripeCheckoutSessionId,
          confirmationEmailStatus: application.confirmationEmailStatus,
          emailSentAt: application.emailSentAt,
          emailError: application.emailError,
          secureToken: application.id,
          package: application.requestedTier,
          phone: application.phone,
          createdAt: application.createdAt,
        });
        trackResult("users", userResult);
        rememberUser(userResult.record);
        canonicalUserId = userResult.record.id;
      } catch (error) {
        trackFailure("users", error, `legacy partner application user ${application.id}`);
      }
    }

    try {
      const applicationResult = await syncLegacyPartnerApplication(db, {
        application,
        userId: canonicalUserId ?? null,
      });
      trackResult("applications", applicationResult);
    } catch (error) {
      trackFailure("applications", error, `legacy partner application ${application.id}`);
    }

    if (!application.partnerOrderId && (application.stripeCheckoutSessionId || application.paymentStatus === "PAID")) {
      try {
        const paymentResult = await syncLegacyPartnerApplicationPayment(db, {
          application,
          userId: canonicalUserId ?? null,
        });
        trackResult("payments", paymentResult);
      } catch (error) {
        trackFailure("payments", error, `legacy partner payment ${application.id}`);
      }
    }
  }

  for (const item of legacyContentItems) {
    if (item.type === "events") {
      try {
        const eventResult = await upsertCanonicalEvent(db, {
          id: item.id,
          title: item.title,
          description: item.body,
          coverImageUrl: item.coverImage ?? null,
          coverAspect: item.coverAspect ?? null,
          location: item.eventAddress ?? null,
          visibility: item.publishToSite && item.publishToDashboard ? "BOTH" : item.publishToSite ? "SITE" : item.publishToDashboard ? "DASHBOARD" : "PRIVATE",
          eventLink: item.ctaUrl ?? null,
          eventAllDay: item.eventAllDay,
          ctaLabel: item.ctaLabel ?? null,
          isPinned: item.isPinned,
          publishToSite: item.publishToSite,
          publishToDashboard: item.publishToDashboard,
          startDate: item.eventDate ?? null,
          endDate: item.eventEndDate ?? null,
          status: item.publishToSite || item.publishToDashboard ? "PUBLISHED" : "DRAFT",
        });
        trackResult("events", eventResult);
      } catch (error) {
        trackFailure("events", error, `legacy event ${item.id}`);
      }

      if (item.coverImage) {
        try {
          const fileResult = await upsertCoreFile(db, {
            id: deterministicUuid(`event-cover:${item.id}`),
            relatedId: item.id,
            type: "EVENT",
            fileUrl: item.coverImage,
            fileName: `${slugify(item.title) || "event"}-cover`,
            createdAt: item.createdAt,
          });
          trackResult("files", fileResult);
        } catch (error) {
          trackFailure("files", error, `legacy event file ${item.id}`);
        }
      }

      continue;
    }

    if (item.type === "news") {
      try {
        const articleResult = await upsertCanonicalArticle(db, {
          id: item.id,
          title: item.title,
          content: item.body,
          coverImage: item.coverImage ?? null,
          ctaUrl: item.ctaUrl ?? null,
          ctaLabel: item.ctaLabel ?? null,
          isPinned: item.isPinned,
          publishToSite: item.publishToSite,
          publishToDashboard: item.publishToDashboard,
        });
        trackResult("news", articleResult);
      } catch (error) {
        trackFailure("news", error, `legacy article ${item.id}`);
      }

      continue;
    }

    trackSkipped("news");
  }

  for (const notification of legacyDashboardNotifications) {
    try {
      const result = await insertCanonicalNotification(db, {
        id: notification.id,
        title: notification.title,
        message: notification.description,
        type: "DASHBOARD",
        visibility: "INDIVIDUAL",
        recipients: { emails: [notification.email] },
        metadata: {
          ctaLabel: notification.ctaLabel,
          ctaUrl: notification.ctaUrl,
          readAt: notification.readAt,
        },
      });
      trackResult("notifications", result);
    } catch (error) {
      trackFailure("notifications", error, `legacy notification ${notification.id}`);
    }
  }

  for (const emailLog of legacyEmailLogs) {
    try {
      const result = await insertCanonicalNotification(db, {
        id: emailLog.id,
        title: emailLog.subject,
        message: emailLog.body,
        type: "EMAIL",
        visibility: "INDIVIDUAL",
        recipients: { emails: [emailLog.to] },
        metadata: {
          status: emailLog.status,
        },
      });
      trackResult("notifications", result);
    } catch (error) {
      trackFailure("notifications", error, `legacy email log ${emailLog.id}`);
    }
  }

  for (const order of legacyOrders.filter((item) => item.accountType?.toLowerCase() === "partner")) {
    const ownerUserId = canonicalUserIdByEmail.get(normalizeEmail(order.email));

    if (!ownerUserId || order.status !== "paid") {
      trackSkipped("teams");
      continue;
    }

    try {
      const teamResult = await syncLegacyTeam(db, {
        order,
        ownerUserId,
        seatExtensions: seatExtensionsByOrderId.get(order.id) ?? [],
      });
      trackResult("teams", teamResult);
    } catch (error) {
      trackFailure("teams", error, `legacy team ${order.id}`);
    }
  }

  for (const member of legacyTeamMembers) {
    const parentOrder = orderById.get(member.ownerOrderId);

    if (!parentOrder) {
      trackSkipped("team_members");
      continue;
    }

    const ownerUserId = canonicalUserIdByEmail.get(normalizeEmail(parentOrder.email));
    if (!ownerUserId) {
      trackSkipped("team_members");
      continue;
    }

    const seatExtensions = seatExtensionsByOrderId.get(parentOrder.id) ?? [];
    try {
      await syncLegacyTeam(db, {
        order: parentOrder,
        ownerUserId,
        seatExtensions,
      });
    } catch {
      // Team creation is counted elsewhere; ignore here and let member sync fail naturally if needed.
    }

    try {
      const teamMemberResult = await syncLegacyTeamMember(db, {
        member,
        teamId: parentOrder.id,
      });
      trackResult("team_members", teamMemberResult);
    } catch (error) {
      trackFailure("team_members", error, `legacy team member ${member.id}`);
    }
  }

  for (const event of legacyStripeWebhookEvents) {
    try {
      const webhookResult = await syncLegacyStripeWebhookEvent(db, {
        id: event.id,
        stripeEventId: event.eventId,
        eventType: event.eventType,
        payload: {
          livemode: event.livemode,
          createdAt: event.createdAt.toISOString(),
        },
        processedAt: event.processedAt,
      });
      trackResult("stripe_webhook_events", webhookResult);
    } catch (error) {
      trackFailure("stripe_webhook_events", error, `legacy webhook event ${event.id}`);
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("[Migration] Failed to migrate old database to new structure", error);
  process.exit(1);
});
