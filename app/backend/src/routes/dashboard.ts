import crypto from "crypto";
import { Router } from "express";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { requireDb } from "../lib/db";
import {
  coreApplications,
  coreCertificates,
  coreMemberships,
  coreNotifications,
  corePayments,
  coreProfiles,
  coreTeamMembers,
  coreTeams,
  coreUsers,
} from "../lib/schema";
import {
  clerkMiddleware,
  getAuth,
  clerkOptions,
  getClerkUserWithRetry,
  getAllEmailsFromClerkUser,
  getEmailFromSessionClaims,
  getPrimaryEmailFromClerkUser,
} from "../services/clerk";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import {
  createExternalCertificate,
  deleteExternalCertificate,
  listExternalCertificates,
} from "../features/files/server/file.service";
import {
  ensureOwnedProfileRecord,
  normalizeProfileServices,
  saveOwnedProfileRecord,
  saveProfileServices,
} from "../features/profiles/server/profile.service";
import { markNotificationsRead } from "../features/notifications/server/notification.service";
import { ensureCanonicalUser, resolveUserRole } from "../features/users/server/user.service";
import { extendCanonicalTeamSeats } from "../features/teams/server/team.service";
import { findCanonicalTeam, upsertCanonicalTeam, upsertCanonicalTeamMember } from "../features/teams/server/team.repository";
import {
  listDashboardEventsForUser,
  registerDashboardEvent,
  unregisterDashboardEvent,
} from "../features/events/server/event.service";

export const dashboardRouter = Router();
export const cardsRouter = Router();

const ADMIN_CARD_LIST_DEFAULT_LIMIT = 20;
const ADMIN_CARD_MAILING_DEFAULT_LIMIT = 100;
const ADMIN_CARD_LIST_MAX_LIMIT = 50;
const ADMIN_CARD_MAILING_MAX_LIMIT = 200;
const PARTNER_INCLUDED_TEAM_SEATS = 5;
const ADDITIONAL_TEAM_SEAT_PRICE = 100;
const MAX_TEAM_SEATS = 60;

const DASHBOARD_ACCESS_ERROR = {
  error: "Dashboard access is available only for members with a completed payment.",
  code: "ACCESS_NOT_ACTIVATED",
};

const PARTNER_OWNER_ONLY_ERROR = {
  error: "Team Members are available only for partner accounts.",
  code: "PARTNER_OWNER_ONLY",
};

type DashboardAccessType = "member" | "partner_owner" | "partner_team_member";

type DashboardAccessContext = {
  db: ReturnType<typeof requireDb>;
  clerkUser: any;
  primaryEmail: string | null;
  accessType: DashboardAccessType;
  canonicalUser: typeof coreUsers.$inferSelect | null;
  membership: typeof coreMemberships.$inferSelect | null;
  application: typeof coreApplications.$inferSelect | null;
  payment: typeof corePayments.$inferSelect | null;
  certificate: typeof coreCertificates.$inferSelect | null;
  profile: typeof coreProfiles.$inferSelect | null;
  team: typeof coreTeams.$inferSelect | null;
  teamMember: typeof coreTeamMembers.$inferSelect | null;
  ownerUser: typeof coreUsers.$inferSelect | null;
};

function getPaginationParams(query: Record<string, unknown>, defaultLimit: number, maxLimit: number) {
  const rawLimit = Number(query.limit);
  const rawOffset = Number(query.offset);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

  return { limit, offset };
}

function countToNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function trimValue(value: unknown, max = 255) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalTrimmedValue(value: unknown, max = 500) {
  const next = trimValue(value, max);
  return next.length > 0 ? next : null;
}

function textValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : typeof item === "number" ? String(item) : ""))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const normalized = textValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function commaSeparatedArray(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapApplicationStatusToLegacy(status: string | null | undefined) {
  switch ((status || "").toUpperCase()) {
    case "UNDER_REVIEW":
      return "review";
    case "REJECTED":
      return "rejected";
    case "APPROVED":
    case "PAYMENT_SENT":
      return "approved";
    case "PAID":
      return "paid";
    default:
      return "pending";
  }
}

function mapPaymentStatusToLegacy(status: string | null | undefined) {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return "paid";
    case "FAILED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

function mapApplicationTypeToAccountType(type: string | null | undefined) {
  return (type || "").toUpperCase() === "PARTNER" ? "partner" : "member";
}

function mapRoleToDashboardAccess(role: string | null | undefined, hasTeam: boolean): DashboardAccessType {
  if ((role || "").toUpperCase() === "PARTNER" || hasTeam) {
    return "partner_owner";
  }

  return "member";
}

function getApplicationData(application: typeof coreApplications.$inferSelect | null | undefined) {
  return asRecord(application?.applicationData) || {};
}

function buildOwnerDashboardProfile(params: {
  user: typeof coreUsers.$inferSelect;
  profile: typeof coreProfiles.$inferSelect | null;
  application: typeof coreApplications.$inferSelect | null;
  membership: typeof coreMemberships.$inferSelect | null;
  payment: typeof corePayments.$inferSelect | null;
  certificate: typeof coreCertificates.$inferSelect | null;
  accessType: DashboardAccessType;
  partnerTeamSummary?: Record<string, unknown> | null;
}) {
  const { user, profile, application, membership, payment, certificate, accessType, partnerTeamSummary } = params;
  const accountType =
    application?.type
      ? mapApplicationTypeToAccountType(application.type)
      : accessType === "partner_owner"
        ? "partner"
        : "member";
  const fullName = [
    firstText(profile?.firstName),
    firstText(profile?.lastName),
  ].filter(Boolean).join(" ") || "IBPA Member";
  const specializations = uniqueStrings(stringArray(profile?.specializations)).filter(Boolean);
  const services = normalizeProfileServices(profile?.services);

  return {
    id: user.id,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    fullName,
    email: user.email,
    phone: profile?.phone ?? null,
    imageUrl: profile?.avatarUrl ?? null,
    bio: profile?.bio ?? null,
    achievements: profile?.achievements ?? null,
    industryContribution: profile?.industryContribution ?? null,
    websiteUrl: profile?.website ?? null,
    specialization: specializations.join(", ") || null,
    specializations,
    experienceYears: profile?.yearsExperience != null ? String(profile.yearsExperience) : null,
    education: profile?.credentials ?? null,
    instagramUrl: profile?.instagram ?? null,
    country: profile?.country ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    portfolioImages: profile?.workGalleryPhotos ?? [],
    certificatesSummary: null,
    services,
    type: accountType,
    accountType,
    applicationType: application?.type || (accessType === "partner_owner" ? "PARTNER" : "MEMBER"),
    orderType: accountType,
    membershipStatus: membership?.status?.toLowerCase() || "pending",
    paymentStatus: mapPaymentStatusToLegacy(payment?.status),
    certificateStatus: certificate?.certificateNumber ? "issued" : "pending",
    membershipCategory: membership?.type || application?.packageName || null,
    applicantType: application?.type || null,
    orderId: application?.id || membership?.id || null,
    dashboardAccessType: accessType,
    partnerTeamSummary: partnerTeamSummary ?? null,
  };
}

async function ensureSessionUser(clerkUserId: string, sessionClaims?: unknown) {
  const db = requireDb();
  const claimsEmail = normalizeEmail(getEmailFromSessionClaims(sessionClaims));
  let clerkUser: any = null;
  let primaryEmail = claimsEmail || null;
  let clerkKnownEmails: string[] = [];

  try {
    clerkUser = await getClerkUserWithRetry(clerkUserId);
    primaryEmail = normalizeEmail(getPrimaryEmailFromClerkUser(clerkUser)) || primaryEmail;
    clerkKnownEmails = getAllEmailsFromClerkUser(clerkUser).map((email) => normalizeEmail(email)).filter(Boolean);
  } catch {
    // Fall back to claims-only auth context when Clerk lookup fails.
  }

  const candidateEmails = Array.from(new Set([primaryEmail, ...clerkKnownEmails].filter(Boolean))) as string[];
  const normalizedCandidateEmails = candidateEmails.filter((value): value is string => typeof value === "string" && value.length > 0);
  const existingUser =
    (await db.select().from(coreUsers).where(eq(coreUsers.clerkId, clerkUserId)).limit(1))[0]
    ?? (normalizedCandidateEmails.length > 0
      ? (await db.select().from(coreUsers).where(inArray(coreUsers.email, normalizedCandidateEmails)).limit(1))[0]
      : null)
    ?? null;

  if (primaryEmail) {
    const ensured = await ensureCanonicalUser(db, {
      clerkId: clerkUserId,
      email: primaryEmail,
      role: existingUser?.role ?? "MEMBER",
      status: existingUser?.status ?? "ACTIVE",
    });

    return {
      db,
      clerkUser,
      primaryEmail,
      candidateEmails: Array.from(new Set([primaryEmail, ensured.record.email, ...normalizedCandidateEmails].filter(Boolean))) as string[],
      canonicalUser: ensured.record,
    };
  }

  return {
    db,
    clerkUser,
    primaryEmail,
    candidateEmails: normalizedCandidateEmails,
    canonicalUser: existingUser,
  };
}

async function findLatestApplicationByUser(db: ReturnType<typeof requireDb>, userId: string, email: string) {
  const byUserId = await db
    .select()
    .from(coreApplications)
    .where(eq(coreApplications.userId, userId))
    .orderBy(desc(coreApplications.createdAt))
    .limit(1);

  if (byUserId[0]) {
    return byUserId[0];
  }

  const byEmail = await db
    .select()
    .from(coreApplications)
    .where(eq(coreApplications.email, email))
    .orderBy(desc(coreApplications.createdAt))
    .limit(1);

  return byEmail[0] ?? null;
}

async function listPaymentsByUserId(
  db: ReturnType<typeof requireDb>,
  userId: string,
) {
  return db
    .select()
    .from(corePayments)
    .where(eq(corePayments.userId, userId))
    .orderBy(desc(corePayments.paidAt), desc(corePayments.createdAt));
}

async function requireDashboardAccess(clerkUserId: string, sessionClaims?: unknown): Promise<DashboardAccessContext | null> {
  const session = await ensureSessionUser(clerkUserId, sessionClaims);
  const { db, canonicalUser, candidateEmails, primaryEmail, clerkUser } = session;

  if (canonicalUser) {
    const [membership, team, profile] = await Promise.all([
      db
        .select()
        .from(coreMemberships)
        .where(and(eq(coreMemberships.userId, canonicalUser.id), eq(coreMemberships.status, "ACTIVE")))
        .orderBy(desc(coreMemberships.startedAt))
        .limit(1)
        .then((rows: typeof coreMemberships.$inferSelect[]) => rows[0] ?? null),
      db.select().from(coreTeams).where(eq(coreTeams.ownerUserId, canonicalUser.id)).limit(1).then((rows: typeof coreTeams.$inferSelect[]) => rows[0] ?? null),
      db.select().from(coreProfiles).where(eq(coreProfiles.userId, canonicalUser.id)).limit(1).then((rows: typeof coreProfiles.$inferSelect[]) => rows[0] ?? null),
    ]);

    if (membership) {
      const [application, payment, certificate] = await Promise.all([
        findLatestApplicationByUser(db, canonicalUser.id, canonicalUser.email),
        db.select().from(corePayments).where(eq(corePayments.id, membership.id)).limit(1).then((rows: typeof corePayments.$inferSelect[]) => rows[0] ?? null),
        db.select().from(coreCertificates).where(eq(coreCertificates.membershipId, membership.id)).limit(1).then((rows: typeof coreCertificates.$inferSelect[]) => rows[0] ?? null),
      ]);

      return {
        db,
        clerkUser,
        primaryEmail,
        accessType: mapRoleToDashboardAccess(canonicalUser.role, Boolean(team)),
        canonicalUser,
        membership,
        application,
        payment,
        certificate,
        profile,
        team,
        teamMember: null,
        ownerUser: null,
      };
    }
  }

  if (candidateEmails.length === 0) {
    return null;
  }

  const [teamMember] = await db
    .select()
    .from(coreTeamMembers)
    .where(inArray(coreTeamMembers.email, candidateEmails.filter((value): value is string => typeof value === "string" && value.length > 0)))
    .orderBy(desc(coreTeamMembers.joinedAt))
    .limit(1);

  if (!teamMember || teamMember.status.toUpperCase() === "REMOVED") {
    return null;
  }

  const [team] = await db.select().from(coreTeams).where(eq(coreTeams.id, teamMember.teamId)).limit(1);
  if (!team) {
    return null;
  }

  const [ownerUser, membership] = await Promise.all([
    db.select().from(coreUsers).where(eq(coreUsers.id, team.ownerUserId)).limit(1).then((rows: typeof coreUsers.$inferSelect[]) => rows[0] ?? null),
    db
      .select()
      .from(coreMemberships)
      .where(and(eq(coreMemberships.userId, team.ownerUserId), eq(coreMemberships.status, "ACTIVE")))
      .orderBy(desc(coreMemberships.startedAt))
      .limit(1)
      .then((rows: typeof coreMemberships.$inferSelect[]) => rows[0] ?? null),
  ]);

  if (!ownerUser || !membership) {
    return null;
  }

  const [application, payment, certificate] = await Promise.all([
    findLatestApplicationByUser(db, ownerUser.id, ownerUser.email),
    db.select().from(corePayments).where(eq(corePayments.id, membership.id)).limit(1).then((rows: typeof corePayments.$inferSelect[]) => rows[0] ?? null),
    db.select().from(coreCertificates).where(eq(coreCertificates.membershipId, membership.id)).limit(1).then((rows: typeof coreCertificates.$inferSelect[]) => rows[0] ?? null),
  ]);

  return {
    db,
    clerkUser,
    primaryEmail,
    accessType: "partner_team_member",
    canonicalUser,
    membership,
    application,
    payment,
    certificate,
    profile: null,
    team,
    teamMember,
    ownerUser,
  };
}

async function getPartnerOwnerMemberId(db: ReturnType<typeof requireDb>, teamId: string) {
  const teams = await db
    .select({ id: coreTeams.id })
    .from(coreTeams)
    .orderBy(asc(coreTeams.createdAt), asc(coreTeams.id));

  const ownerIndex = teams.findIndex((record: { id: string }) => record.id === teamId);
  const normalizedIndex = ownerIndex >= 0 ? ownerIndex + 1 : teams.length + 1;
  return `IBPA-BO-${String(normalizedIndex).padStart(3, "0")}`;
}

async function getPartnerTeamSnapshot(db: ReturnType<typeof requireDb>, team: typeof coreTeams.$inferSelect) {
  const members = await db
    .select()
    .from(coreTeamMembers)
    .where(eq(coreTeamMembers.teamId, team.id))
    .orderBy(asc(coreTeamMembers.joinedAt), asc(coreTeamMembers.id));

  const activeMembers = members.filter((member: typeof coreTeamMembers.$inferSelect) => member.status.toUpperCase() !== "REMOVED");
  const includedUsed = Math.min(activeMembers.length, PARTNER_INCLUDED_TEAM_SEATS);
  const totalAllowedSeats = Math.max(team.seatCount, PARTNER_INCLUDED_TEAM_SEATS);
  const paidAdditionalSeats = Math.max(totalAllowedSeats - PARTNER_INCLUDED_TEAM_SEATS, 0);
  const additionalUsed = Math.max(activeMembers.length - includedUsed, 0);
  const includedRemaining = Math.max(PARTNER_INCLUDED_TEAM_SEATS - includedUsed, 0);
  const usedSeats = activeMembers.length;
  const remainingSeats = Math.max(totalAllowedSeats - usedSeats, 0);
  const canInvite = usedSeats < totalAllowedSeats;
  const ownerMemberId = await getPartnerOwnerMemberId(db, team.id);

  return {
    ownerMemberId,
    records: members.map((member: typeof coreTeamMembers.$inferSelect, index: number) => {
      const isRemoved = member.status.toUpperCase() === "REMOVED";
      const activeIndex = activeMembers.findIndex((active: typeof coreTeamMembers.$inferSelect) => active.id === member.id);
      const seatNumber = activeIndex >= 0 ? activeIndex + 1 : index + 1;
      const seatKind = seatNumber <= PARTNER_INCLUDED_TEAM_SEATS ? "included" : "additional";

      return {
        id: member.id,
        teamMemberId: `${ownerMemberId}-T${String(seatNumber).padStart(2, "0")}`,
        fullName: member.fullName,
        email: member.email,
        emailNormalized: normalizeEmail(member.email),
        role: member.role || "",
        portfolioLink: null,
        license: "Not provided",
        status: isRemoved ? "removed" : member.status.toLowerCase() === "active" ? "active" : "invited",
        seatNumber,
        seatKind,
        billingStatus: seatKind === "included" ? "included" : "paid",
        accessStatus: isRemoved ? "removed" : member.status.toLowerCase(),
        registrationStatus: member.status.toLowerCase() === "active" ? "registered" : "not_registered",
        ticketCode: null,
        attendanceStatus: "not_marked",
        createdAt: member.joinedAt ?? new Date(),
      };
    }),
    summary: {
      includedSeats: PARTNER_INCLUDED_TEAM_SEATS,
      includedUsed,
      includedRemaining,
      usedSeats,
      remainingSeats,
      totalAllowedSeats,
      additionalUsed,
      paidAdditionalSeats,
      pendingSeatExtensionSeats: 0,
      pendingSeatExtensionRequests: 0,
      additionalSeatPrice: ADDITIONAL_TEAM_SEAT_PRICE,
      canInvite,
      inviteDisabledReason: canInvite
        ? null
        : "You have used all included team seats. Add more seats to invite additional members.",
    },
  };
}

function filterNotificationsForEmail(notifications: Array<typeof coreNotifications.$inferSelect>, email: string, role: string | null | undefined, userId: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = (role || "").toUpperCase();

  return notifications.filter((notification) => {
    const recipients = asRecord(notification.recipients) || {};
    const emails = stringArray(recipients.emails);
    const roles = stringArray(recipients.roles).map((item) => item.toUpperCase());
    const userIds = stringArray(recipients.userIds);

    if (notification.visibility === "PUBLIC" || notification.visibility === "ALL") {
      return true;
    }

    if (userId && userIds.includes(userId)) {
      return true;
    }

    if (emails.map((item) => normalizeEmail(item)).includes(normalizedEmail)) {
      return true;
    }

    if (normalizedRole && roles.includes(normalizedRole)) {
      return true;
    }

    return false;
  });
}

dashboardRouter.get("/me", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, accessType, canonicalUser, membership, application, payment, certificate, team, teamMember, ownerUser } = access;
    if (!membership) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    if (accessType === "partner_team_member" && teamMember && team && ownerUser) {
      const ownerMemberId = await getPartnerOwnerMemberId(db, team.id);
      return res.json({
        certificates: [],
        externalCertificates: [],
        accountType: "partner",
        applicationType: "TEAM_MEMBER",
        orderType: "partner",
        membershipStatus: membership.status.toLowerCase(),
        paymentStatus: mapPaymentStatusToLegacy(payment?.status),
        certificateStatus: "not_available_for_team_member",
        dashboardAccess: {
          type: accessType,
          accountType: "partner",
          partnerOrderId: team.id,
          partnerName: ownerUser.email,
          partnerEmail: ownerUser.email,
          ownerMemberId,
          teamMemberId: teamMember.id,
          teamMemberStatus: teamMember.status,
          role: teamMember.role,
          licenseNumber: "Not provided",
        },
      });
    }

    let partnerTeam = null;
    if (accessType === "partner_owner" && team) {
      const snapshot = await getPartnerTeamSnapshot(db, team);
      partnerTeam = {
        ...snapshot.summary,
        invitedMembers: snapshot.records
          .filter((item: any) => item.status !== "removed")
          .map((item: any) => ({
            id: item.id,
            teamMemberId: item.teamMemberId,
            fullName: item.fullName,
            email: item.email,
            role: item.role,
            status: item.status,
          })),
      };
    }

    const ownerFullName = [
      firstText(access.profile?.firstName),
      firstText(access.profile?.lastName),
    ].filter(Boolean).join(" ") || firstText(application?.fullName) || canonicalUser?.email || "";
    let externalCertificates: Awaited<ReturnType<typeof listExternalCertificates>> = [];
    try {
      externalCertificates = await listExternalCertificates({ clerkUserId });
    } catch (error) {
      console.error("[Dashboard /me] Failed to load external certificates:", error);
    }

    const paymentHistory = canonicalUser
      ? await listPaymentsByUserId(db, canonicalUser.id)
      : [];

    const certificatePayload = certificate
      ? [{
          certNumber: certificate.certificateNumber,
          orderEmail: canonicalUser?.email || "",
          orderName: ownerFullName,
          accountType: mapApplicationTypeToAccountType(application?.type),
          phone: firstText(application?.phone, getApplicationData(application).phone) || null,
          membershipCategory: membership.type,
          applicantType: application?.type || canonicalUser?.role || null,
          status: "paid",
          certificateUrl: certificate.certificateUrl,
          expiresAt: certificate.expiresAt,
          applicationPayload: application?.applicationData ?? {},
          createdAt: membership.startedAt ?? application?.createdAt ?? membership.id,
        }]
      : [];

    return res.json({
      certificates: certificatePayload,
      externalCertificates,
      paymentHistory: paymentHistory.map((entry: typeof corePayments.$inferSelect) => ({
        id: entry.id,
        type: entry.type,
        amount: entry.amount,
        status: entry.status.toLowerCase(),
        createdAt: entry.createdAt,
        paidAt: entry.paidAt,
      })),
      accountType: mapApplicationTypeToAccountType(application?.type),
      applicationType: application?.type || canonicalUser?.role || null,
      orderType: mapApplicationTypeToAccountType(application?.type),
      membershipStatus: membership.status.toLowerCase(),
      paymentStatus: mapPaymentStatusToLegacy(payment?.status),
      certificateStatus: certificate ? "issued" : "pending",
      partnerTeam,
      dashboardAccess: {
        type: accessType,
        accountType: mapApplicationTypeToAccountType(application?.type),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Dashboard /me] Error:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

dashboardRouter.get("/profile", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, primaryEmail, accessType, canonicalUser, membership, application, payment, certificate, profile, team, teamMember, ownerUser } = access;
    if (!membership) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    if (accessType === "partner_team_member" && teamMember && team && ownerUser) {
      const ownerMemberId = await getPartnerOwnerMemberId(db, team.id);
      return res.json({
        profile: {
          type: "partner",
          accountType: "partner",
          applicationType: "TEAM_MEMBER",
          orderType: "partner",
          membershipStatus: membership.status.toLowerCase(),
          paymentStatus: mapPaymentStatusToLegacy(payment?.status),
          certificateStatus: "not_available_for_team_member",
          membershipCategory: membership.type,
          applicantType: "TEAM_MEMBER",
          orderId: team.id,
          dashboardAccessType: accessType,
          teamMember: {
            id: teamMember.id,
            teamMemberId: teamMember.id,
            fullName: teamMember.fullName,
            email: teamMember.email,
            role: teamMember.role,
            licenseNumber: "Not provided",
            status: teamMember.status,
            ownerMemberId,
            partnerBusinessName: ownerUser.email,
            partnerBusinessEmail: ownerUser.email,
          },
        },
      });
    }

    if (!canonicalUser) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const ensuredProfile = await ensureOwnedProfileRecord(db, {
      clerkUserId,
      email: primaryEmail || canonicalUser.email,
      currentRole: canonicalUser.role,
    });

    const partnerTeamSnapshot = accessType === "partner_owner" && team
      ? await getPartnerTeamSnapshot(db, team)
      : null;

    const mappedProfile = buildOwnerDashboardProfile({
      user: canonicalUser,
      profile: ensuredProfile,
      application,
      membership,
      payment,
      certificate,
      accessType,
      partnerTeamSummary: partnerTeamSnapshot
        ? {
            ...partnerTeamSnapshot.summary,
            invitedMembers: partnerTeamSnapshot.records
              .filter((item: any) => item.status !== "removed")
              .map((item: any) => ({
                id: item.id,
                teamMemberId: item.teamMemberId,
                fullName: item.fullName,
                email: item.email,
                role: item.role,
                status: item.status,
              })),
          }
        : null,
    });

    return res.json({ profile: mappedProfile });
  } catch (error) {
    console.error("[Dashboard /profile GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

dashboardRouter.get("/events", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const items = await listDashboardEventsForUser(access.db, {
      userId: access.canonicalUser?.id ?? null,
    });

    return res.json({ items });
  } catch (error) {
    console.error("[Dashboard /events GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard events" });
  }
});

dashboardRouter.post("/events/:id/register", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const eventId = trimValue(req.params.id, 80);
  if (!eventId) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    if (!access.canonicalUser) {
      return res.status(400).json({ error: "User record is not ready for event registration." });
    }

    const registration = await registerDashboardEvent(access.db, {
      eventId,
      userId: access.canonicalUser.id,
      email:
        access.primaryEmail ||
        access.canonicalUser.email ||
        access.teamMember?.email ||
        "",
      source: "dashboard",
    });

    return res.status(registration.alreadyRegistered ? 200 : 201).json({
      success: true,
      alreadyRegistered: registration.alreadyRegistered,
      item: registration.event,
    });
  } catch (error) {
    console.error("[Dashboard /events/register POST] Error:", error);
    return res.status(
      error instanceof Error && error.message === "Event not found." ? 404 : 500,
    ).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to register for the event",
    });
  }
});

dashboardRouter.delete("/events/:id/register", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const eventId = trimValue(req.params.id, 80);
  if (!eventId) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    if (!access.canonicalUser) {
      return res.status(400).json({ error: "User record is not ready for event registration." });
    }

    const registration = await unregisterDashboardEvent(access.db, {
      eventId,
      userId: access.canonicalUser.id,
    });

    return res.json({
      success: true,
      removed: registration.removed,
      item: registration.event,
    });
  } catch (error) {
    console.error("[Dashboard /events/register DELETE] Error:", error);
    return res.status(
      error instanceof Error && error.message === "Event not found." ? 404 : 500,
    ).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to unregister from the event",
    });
  }
});

dashboardRouter.get("/notifications", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const notifications = await access.db
      .select()
      .from(coreNotifications)
      .orderBy(desc(coreNotifications.createdAt));
    const role = access.accessType === "partner_team_member"
      ? "TEAM_MEMBER"
      : access.canonicalUser?.role ?? "MEMBER";
    const email = access.primaryEmail || access.canonicalUser?.email || access.teamMember?.email || "";
    const visible = filterNotificationsForEmail(notifications, email, role, access.canonicalUser?.id ?? null);

    return res.json({
      notifications: visible.map((item) => {
        const metadata = asRecord(item.metadata) || {};
        const readBy = stringArray(metadata.readBy).map((entry) => normalizeEmail(entry));

        return {
          id: item.id,
          title: item.title,
          description: item.message,
          timestamp: item.createdAt,
          unread: !readBy.includes(normalizeEmail(email)),
          ctaLabel: firstText(metadata.ctaLabel) || null,
          ctaUrl: firstText(metadata.ctaUrl) || null,
        };
      }),
    });
  } catch (error) {
    console.error("[Dashboard /notifications GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

dashboardRouter.patch("/notifications", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((item: unknown): item is string => typeof item === "string" && item.length > 0)
      : [];

    const email = access.primaryEmail || access.canonicalUser?.email || access.teamMember?.email || "";
    const notifications = await access.db
      .select({ id: coreNotifications.id })
      .from(coreNotifications)
      .orderBy(desc(coreNotifications.createdAt));
    const targetIds = ids.length > 0 ? ids : notifications.map((item: { id: string }) => item.id);
    const updatedIds = await markNotificationsRead(access.db, {
      notificationIds: targetIds,
      email,
    });

    return res.json({ success: true, updatedIds });
  } catch (error) {
    console.error("[Dashboard /notifications PATCH] Error:", error);
    return res.status(500).json({ error: "Failed to update notifications" });
  }
});

dashboardRouter.get("/team-members", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, accessType, team, canonicalUser } = access;
    if (!team || !canonicalUser || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const snapshot = await getPartnerTeamSnapshot(db, team);

    return res.json({
      ownerMemberId: snapshot.ownerMemberId,
      ...snapshot.summary,
      partnerBusinessName: canonicalUser.email,
      partnerBusinessEmail: canonicalUser.email,
      members: snapshot.records.map((item: any) => ({
        id: item.id,
        teamMemberId: item.teamMemberId,
        fullName: item.fullName,
        email: item.email,
        role: item.role,
        avatarUrl: item.avatarUrl,
        bio: item.bio,
        location: item.location,
        joinedAt: item.joinedAt,
        portfolioLink: item.portfolioLink,
        licenseNumber: item.license,
        status: item.status,
        seatNumber: item.seatNumber,
        seatKind: item.seatKind,
        billingStatus: item.billingStatus,
        accessStatus: item.accessStatus,
        registrationStatus: item.registrationStatus,
        ticketCode: item.ticketCode,
        attendanceStatus: item.attendanceStatus,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Dashboard /team-members GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch team members" });
  }
});

dashboardRouter.post("/team-members", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, accessType, team, canonicalUser } = access;
    if (!team || !canonicalUser || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const fullName = trimValue(req.body?.fullName);
    const email = trimValue(req.body?.email);
    const emailNormalized = normalizeEmail(req.body?.email);
    const role = trimValue(req.body?.role, 120);
    const affiliationConfirmed = req.body?.affiliationConfirmed === true;

    if (!fullName) {
      return res.status(400).json({ error: "Full name is required." });
    }
    if (!emailNormalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!role) {
      return res.status(400).json({ error: "Position / role is required." });
    }
    if (!affiliationConfirmed) {
      return res.status(400).json({ error: "Affiliation confirmation is required before adding a team member." });
    }

    const snapshot = await getPartnerTeamSnapshot(db, team);
    const activeMembers = snapshot.records.filter((member: any) => member.status !== "removed");
    if (activeMembers.length >= MAX_TEAM_SEATS) {
      return res.status(400).json({ error: `Maximum team size is ${MAX_TEAM_SEATS} seats for this release.` });
    }
    if (activeMembers.some((member: any) => member.emailNormalized === emailNormalized)) {
      return res.status(400).json({ error: "This email is already assigned to an active team seat in your partner account." });
    }
    if (!snapshot.summary.canInvite) {
      return res.status(400).json({
        error: "You have used all included team seats. Add more seats to invite additional members.",
        code: "SEAT_LIMIT_REACHED",
      });
    }

    const created = await upsertCanonicalTeamMember(db, {
      id: crypto.randomUUID(),
      teamId: team.id,
      email,
      fullName,
      role,
      status: "INVITED",
      joinedAt: new Date(),
    });
    const refreshed = await getPartnerTeamSnapshot(db, team);
    const createdRecord = refreshed.records.find((item: any) => item.id === created.record.id);

    return res.status(201).json({
      ownerMemberId: refreshed.ownerMemberId,
      additionalSeatPrice: ADDITIONAL_TEAM_SEAT_PRICE,
      member: {
        id: created.record.id,
        teamMemberId: createdRecord?.teamMemberId ?? created.record.id,
        fullName: created.record.fullName,
        email: created.record.email,
        role: created.record.role || "",
        portfolioLink: null,
        licenseNumber: "Not provided",
        status: createdRecord?.status ?? "invited",
        seatNumber: createdRecord?.seatNumber ?? activeMembers.length + 1,
        seatKind: createdRecord?.seatKind ?? (activeMembers.length + 1 <= PARTNER_INCLUDED_TEAM_SEATS ? "included" : "additional"),
        billingStatus: createdRecord?.billingStatus ?? "included",
        accessStatus: createdRecord?.accessStatus ?? "invited",
        registrationStatus: createdRecord?.registrationStatus ?? "not_registered",
        ticketCode: null,
        attendanceStatus: "not_marked",
        createdAt: created.record.joinedAt ?? new Date(),
      },
      note: "Team educational seat is active.",
    });
  } catch (error) {
    console.error("[Dashboard /team-members POST] Error:", error);
    return res.status(500).json({ error: "Failed to add team member" });
  }
});

dashboardRouter.post("/team-members/extend-seats", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, accessType, team } = access;
    if (!team || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const seatsRequested = Math.max(1, Math.min(Number(req.body?.seatsRequested) || 1, 20));
    const updatedTeam = await extendCanonicalTeamSeats(db, {
      teamId: team.id,
      seatsRequested,
    });

    return res.status(201).json({
      seatsRequested,
      seatCount: updatedTeam?.seatCount ?? team.seatCount + seatsRequested,
      status: "active",
      note: "Team seat capacity updated.",
    });
  } catch (error) {
    console.error("[Dashboard /team-members/extend-seats POST] Error:", error);
    return res.status(500).json({ error: "Failed to request seat extension" });
  }
});

dashboardRouter.delete("/team-members/:id", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const memberId = trimValue(req.params.id, 60);
  if (!memberId) {
    return res.status(400).json({ error: "Invalid team member id." });
  }

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, accessType, team } = access;
    if (!team || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const [member] = await db
      .select()
      .from(coreTeamMembers)
      .where(and(eq(coreTeamMembers.id, memberId), eq(coreTeamMembers.teamId, team.id)));

    if (!member || member.status.toUpperCase() === "REMOVED") {
      return res.status(404).json({ error: "Team member not found." });
    }

    await upsertCanonicalTeamMember(db, {
      id: member.id,
      teamId: member.teamId,
      email: member.email,
      fullName: member.fullName,
      role: member.role,
      status: "REMOVED",
      joinedAt: member.joinedAt,
    });

    return res.json({ success: true, id: memberId });
  } catch (error) {
    console.error("[Dashboard /team-members DELETE] Error:", error);
    return res.status(500).json({ error: "Failed to remove team member" });
  }
});

dashboardRouter.patch("/profile", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, primaryEmail, accessType, canonicalUser } = access;
    if (accessType === "partner_team_member") {
      return res.status(403).json({
        error: "Team member profiles are managed by the partner owner.",
        code: "TEAM_MEMBER_EDIT_DISABLED",
      });
    }

    if (!canonicalUser) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const {
      firstName,
      lastName,
      phone,
      imageUrl,
      bio,
      specializations,
      achievements,
      industryContribution,
      experienceYears,
      education,
      instagramUrl,
      websiteUrl,
      country,
      state,
      city,
      portfolioImages,
    } = req.body;

    const { profile } = await saveOwnedProfileRecord(db, {
      clerkUserId,
      email: primaryEmail || canonicalUser.email,
      currentRole: canonicalUser.role,
      firstName,
      lastName,
      phone,
      imageUrl,
      bio,
      specializations: Array.isArray(specializations)
        ? specializations.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
        : undefined,
      achievements,
      industryContribution,
      experienceYears,
      education,
      instagramUrl,
      websiteUrl,
      country,
      state,
      city,
      portfolioImages: Array.isArray(portfolioImages)
        ? portfolioImages.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
        : undefined,
    });

    return res.json({ success: true, profile });
  } catch (error) {
    console.error("[Dashboard /profile PATCH] Error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

dashboardRouter.patch("/profile/services", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    if (access.accessType === "partner_team_member") {
      return res.status(403).json({
        error: "Team member profiles are managed by the partner owner.",
        code: "TEAM_MEMBER_EDIT_DISABLED",
      });
    }

    const services = Array.isArray(req.body?.services) ? req.body.services : [];
    const result = await saveProfileServices({
      clerkUserId,
      services,
    });

    return res.json({
      success: true,
      services: result.services,
    });
  } catch (error) {
    console.error("[Dashboard /profile/services PATCH] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update services",
    });
  }
});

dashboardRouter.get("/certificates/external", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access || access.accessType === "partner_team_member") {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const items = await listExternalCertificates({ clerkUserId });
    return res.json({ items });
  } catch (error) {
    console.error("[Dashboard /certificates/external GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch uploaded certificates" });
  }
});

dashboardRouter.post("/certificates/external", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access || access.accessType === "partner_team_member") {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const created = await createExternalCertificate({
      clerkUserId,
      title: req.body?.title,
      fileUrl: req.body?.fileUrl,
    });

    return res.status(201).json({ success: true, item: created });
  } catch (error) {
    console.error("[Dashboard /certificates/external POST] Error:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to save uploaded certificate",
    });
  }
});

dashboardRouter.delete("/certificates/external/:id", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId, auth.sessionClaims);
    if (!access || access.accessType === "partner_team_member") {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const deleted = await deleteExternalCertificate({
      clerkUserId,
      fileId: typeof req.params.id === "string" ? req.params.id : "",
    });

    return res.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("[Dashboard /certificates/external DELETE] Error:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove uploaded certificate",
    });
  }
});

async function buildAdminClientRows(db: ReturnType<typeof requireDb>) {
  const rows = await db
    .select({
      membership: coreMemberships,
      user: coreUsers,
      profile: coreProfiles,
      certificate: coreCertificates,
      application: coreApplications,
    })
    .from(coreMemberships)
    .innerJoin(coreUsers, eq(coreMemberships.userId, coreUsers.id))
    .leftJoin(coreProfiles, eq(coreProfiles.userId, coreUsers.id))
    .leftJoin(coreCertificates, eq(coreCertificates.membershipId, coreMemberships.id))
    .leftJoin(coreApplications, eq(coreApplications.id, coreMemberships.id))
    .where(eq(coreMemberships.status, "ACTIVE"))
    .orderBy(desc(coreMemberships.startedAt));

  return rows.map((row: any) => {
    const payload = getApplicationData(row.application);
    const userName = [
      firstText(row.profile?.firstName),
      firstText(row.profile?.lastName),
    ].filter(Boolean).join(" ") || firstText(row.application?.fullName) || row.user.email;

    return {
      id: row.membership.id,
      userId: row.user.id,
      profileId: row.profile?.id ?? null,
      userName,
      email: row.user.email,
      phone: firstText(row.application?.phone, payload.phone) || null,
      avatarUrl: row.profile?.avatarUrl ?? null,
      membershipCategory: row.membership.type,
      status: row.membership.status.toLowerCase(),
      certificateNumber: row.certificate?.certificateNumber ?? null,
      certificateUrl: row.certificate?.certificateUrl ?? null,
      expiresAt: row.certificate?.expiresAt ?? null,
      applicationPayload: row.application?.applicationData ?? {},
      createdAt: row.membership.startedAt ?? row.membership.id,
      bio: row.profile?.bio ?? null,
      achievements: row.profile?.achievements ?? null,
      industryContribution: row.profile?.industryContribution ?? null,
      services: row.profile?.services ?? [],
      portfolioImages: row.profile?.workGalleryPhotos ?? [],
      specializations: row.profile?.specializations ?? [],
      specialization: (row.profile?.specializations ?? []).join(", ") || null,
      experienceYears: row.profile?.yearsExperience != null ? String(row.profile.yearsExperience) : null,
      education: row.profile?.credentials ?? null,
      instagramUrl: row.profile?.instagram ?? null,
      websiteUrl: row.profile?.website ?? null,
      country: row.profile?.country ?? null,
      state: row.profile?.state ?? null,
      city: row.profile?.city ?? null,
      hasDashboardAccess: Boolean(row.user.clerkId),
      cardName: row.membership.type || "Professional Membership",
    };
  });
}

async function listCards(req: any, res: any) {
  try {
    const db = requireDb();
    const isMailingPurpose = req.query?.purpose === "mailing";
    const { limit, offset } = getPaginationParams(
      req.query || {},
      isMailingPurpose ? ADMIN_CARD_MAILING_DEFAULT_LIMIT : ADMIN_CARD_LIST_DEFAULT_LIMIT,
      isMailingPurpose ? ADMIN_CARD_MAILING_MAX_LIMIT : ADMIN_CARD_LIST_MAX_LIMIT,
    );
    const queryText = trimValue(req.query?.q).toLowerCase();
    const rows = await buildAdminClientRows(db);
    const filtered = queryText
      ? rows.filter((row: any) =>
          [row.userName, row.email, row.membershipCategory, row.certificateNumber]
            .some((value) => String(value || "").toLowerCase().includes(queryText)))
      : rows;
    const paged = filtered.slice(offset, offset + limit);

    return res.json({
      items: paged,
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + paged.length < filtered.length,
      categories: uniqueStrings(filtered.map((row: any) => row.membershipCategory || "").filter(Boolean)),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to fetch cards:", error);
    return res.status(500).json({ error: "Failed to fetch cards" });
  }
}

cardsRouter.get("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const db = requireDb();
    const rows = await buildAdminClientRows(db);
    const client = rows.find((row: any) => row.id === id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.json(client);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to fetch card detail:", error);
    return res.status(500).json({ error: "Failed to fetch card detail" });
  }
});

cardsRouter.get("/", adminClerkMiddleware, requireAdminAccess, listCards);
