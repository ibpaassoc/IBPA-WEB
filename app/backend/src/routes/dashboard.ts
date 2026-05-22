import { Router } from "express";
import { requireDb, orders, certificates, users, dashboardNotifications, teamMembers, teamSeatExtensions } from "../lib/db";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { clerkMiddleware, getAuth, clerkOptions, clerkClient } from "../services/clerk";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";

export const dashboardRouter = Router();
export const cardsRouter = Router();

const ADMIN_CARD_LIST_DEFAULT_LIMIT = 20;
const ADMIN_CARD_MAILING_DEFAULT_LIMIT = 100;
const ADMIN_CARD_LIST_MAX_LIMIT = 50;
const ADMIN_CARD_MAILING_MAX_LIMIT = 200;
const PARTNER_INCLUDED_TEAM_SEATS = 5;
const ADDITIONAL_TEAM_SEAT_PRICE = 100;
const MAX_TEAM_SEATS = 60;

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

function getCardSearchCondition(q: unknown) {
  if (typeof q !== "string" || !q.trim()) {
    return undefined;
  }

  const term = `%${q.trim()}%`;
  return sql`(${orders.name} ilike ${term} or ${orders.email} ilike ${term} or ${certificates.certNumber} ilike ${term} or ${orders.membershipCategory} ilike ${term})`;
}

function combineConditions(...conditions: any[]) {
  const active = conditions.filter(Boolean);
  return active.length > 0 ? and(...active) : undefined;
}

const EDITABLE_APPLICATION_FIELDS = [
  "phone",
  "dateOfBirth",
  "country",
  "city",
  "citizenship",
  "yearsExperience",
  "educationDesc",
  "professionalDesc",
  "specialization",
  "workingJurisdictions",
  "instagramLink",
  "portfolioLink",
  "websiteLink",
  "whyJoin",
  "contributionDesc",
  "studentSchool",
  "studentProgName",
  "studentEndDate",
  "studentMotivation",
  "educatorRole",
  "educatorSubjects",
  "educatorYears",
  "educatorFormat",
  "studentCount",
  "bizName",
  "bizType",
  "bizYear",
  "bizTeamSize",
  "bizServices",
  "achievementsYesNo",
  "achievementsDesc",
  "competitionsYesNo",
  "competitionName",
  "competitionYear",
  "competitionResult",
  "speakerEducatorJudge",
  "publicationsYesNo",
  "publicationsLinks",
  "professionalCommunityYesNo",
  "otherOrganizationsYesNo",
  "otherOrganizationName",
  "otherOrganizationStatus",
  "otherOrganizationYears",
  "brandName",
  "brandYear",
  "brandMarket",
  "brandType",
];

function pickEditableApplicationFields(source: Record<string, unknown>) {
  const next: Record<string, unknown> = {};

  for (const key of EDITABLE_APPLICATION_FIELDS) {
    if (key in source) {
      next[key] = source[key];
    }
  }

  return next;
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

const isDevEnvironment = process.env.NODE_ENV !== "production";

function dashboardDebugLog(label: string, data: Record<string, unknown>) {
  if (!isDevEnvironment) {
    return;
  }

  console.debug(`[Dashboard Debug] ${label}`, data);
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
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

function getApplicationDataSources(order: typeof orders.$inferSelect | null | undefined) {
  const payload = getOrderPayloadRecord(order) || {};
  const nested = [
    asRecord(payload.form_data),
    asRecord(payload.formData),
    asRecord(payload.details),
    asRecord(payload.profile),
    asRecord(payload.application),
    asRecord(payload.data),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  return [payload, ...nested];
}

function getApplicationField(
  order: typeof orders.$inferSelect | null | undefined,
  ...keys: string[]
) {
  const sources = getApplicationDataSources(order);

  for (const source of sources) {
    for (const key of keys) {
      if (!(key in source)) {
        continue;
      }

      const value = source[key];
      const normalized = textValue(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  return "";
}

function splitFullName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function ensureUserRecord(
  clerkUserId: string,
  primaryEmail: string | null | undefined,
  clerkUser: any,
) {
  if (!primaryEmail) {
    return;
  }

  const db = requireDb();
  const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));

  if (existing) {
    await db
      .update(users)
      .set({
        // Preserve historical email linkage when available for legacy dashboard matching.
        email: existing.email || primaryEmail,
        firstName: clerkUser.firstName || existing.firstName || "",
        lastName: clerkUser.lastName || existing.lastName || "",
        imageUrl: clerkUser.imageUrl || existing.imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUserId));
    return;
  }

  await db.insert(users).values({
    clerkId: clerkUserId,
    email: primaryEmail,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    imageUrl: clerkUser.imageUrl || null,
  });
}

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
  paidOrders: typeof orders.$inferSelect[];
  latestPaidOrder: typeof orders.$inferSelect | null;
  teamMember: typeof teamMembers.$inferSelect | null;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeAccountTypeValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function isPartnerLikeValue(value: unknown) {
  const normalized = normalizeAccountTypeValue(value);
  return normalized === "partner" || normalized.includes("partner");
}

function getOrderPayloadRecord(order: typeof orders.$inferSelect | null | undefined) {
  if (!order?.applicationPayload || typeof order.applicationPayload !== "object" || Array.isArray(order.applicationPayload)) {
    return null;
  }

  return order.applicationPayload as Record<string, unknown>;
}

function resolveOrderAccountType(order: typeof orders.$inferSelect | null | undefined): "partner" | "member" {
  if (!order) {
    return "member";
  }

  const payload = getOrderPayloadRecord(order);
  const candidates = [
    order.accountType,
    payload?.accountType,
    payload?.applicationType,
    payload?.type,
    order.applicantType,
    order.membershipCategory,
  ];

  if (candidates.some((value) => isPartnerLikeValue(value))) {
    return "partner";
  }

  return "member";
}

function trimValue(value: unknown, max = 255) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalTrimmedValue(value: unknown, max = 500) {
  const next = trimValue(value, max);
  return next.length > 0 ? next : null;
}

async function getPartnerOwnerMemberId(db: ReturnType<typeof requireDb>, ownerOrderId: string) {
  const partnerOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "paid"), sql`lower(${orders.accountType}) = 'partner'`))
    .orderBy(asc(orders.createdAt), asc(orders.id));

  const ownerIndex = partnerOrders.findIndex((record: { id: string }) => record.id === ownerOrderId);
  const normalizedIndex = ownerIndex >= 0 ? ownerIndex + 1 : partnerOrders.length + 1;
  return `IBPA-BO-${String(normalizedIndex).padStart(3, "0")}`;
}

async function requireDashboardAccess(clerkUserId: string): Promise<DashboardAccessContext | null> {
  const db = requireDb();
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail =
    clerkUser.emailAddresses.find((email: any) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    null;
  const [storedUser] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));
  const storedApplicationEmail = normalizeEmail(storedUser?.email);
  const primaryEmailNormalized = normalizeEmail(primaryEmail);
  const candidateEmails = Array.from(
    new Set([primaryEmailNormalized, storedApplicationEmail].filter((value) => value.length > 0)),
  );

  const paidByLinkedCertificate = await db
    .select({ order: orders })
    .from(certificates)
    .innerJoin(orders, eq(certificates.orderId, orders.id))
    .where(and(eq(certificates.clerkUserId, clerkUserId), eq(orders.status, "paid")))
    .orderBy(desc(orders.createdAt));

  const paidByEmailBatches =
    candidateEmails.length > 0
      ? await Promise.all(
          candidateEmails.map((email) =>
            db
              .select()
              .from(orders)
              .where(and(sql`lower(${orders.email}) = lower(${email})`, eq(orders.status, "paid")))
              .orderBy(desc(orders.createdAt)),
          ),
        )
      : [];
  const paidByEmail = paidByEmailBatches.flat();

  const paidOrdersMap = new Map<string, typeof orders.$inferSelect>();

  for (const row of paidByLinkedCertificate) {
    paidOrdersMap.set(row.order.id, row.order);
  }

  for (const order of paidByEmail) {
    paidOrdersMap.set(order.id, order);
  }

  const paidOrders = Array.from(paidOrdersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (paidOrders.length > 0) {
    const paidOrderIds = paidOrders.map((order) => order.id);
    const paidCertificates = await db
      .select({
        id: certificates.id,
        existingClerkUserId: certificates.clerkUserId,
      })
      .from(certificates)
      .where(inArray(certificates.orderId, paidOrderIds));

    const needsLinking = paidCertificates.filter(
      (certificate: { id: string; existingClerkUserId: string | null }) =>
        !certificate.existingClerkUserId || certificate.existingClerkUserId !== clerkUserId,
    );

    if (needsLinking.length > 0) {
      for (const certificate of needsLinking) {
        await db
          .update(certificates)
          .set({ clerkUserId })
          .where(eq(certificates.id, certificate.id));
      }
    }
  }

  await ensureUserRecord(clerkUserId, primaryEmail, clerkUser);

  if (paidOrders.length > 0) {
    const latestPaidOrder = paidOrders[0] || null;
    const accessType: DashboardAccessType = resolveOrderAccountType(latestPaidOrder) === "partner" ? "partner_owner" : "member";
    const mappedOrderEmail = normalizeEmail(latestPaidOrder?.email);

    dashboardDebugLog("access_match_owner", {
      clerkUserId,
      primaryEmail: primaryEmailNormalized || null,
      storedApplicationEmail: storedApplicationEmail || null,
      matchedOrderId: latestPaidOrder?.id || null,
      matchedOrderEmail: mappedOrderEmail || null,
      matchedAccountType: latestPaidOrder?.accountType || null,
      accessType,
      matchCandidates: candidateEmails,
      paidOrderCount: paidOrders.length,
    });

    return {
      db,
      clerkUser,
      primaryEmail,
      accessType,
      paidOrders,
      latestPaidOrder,
      teamMember: null,
    };
  }

  const teamLookupEmail = primaryEmailNormalized || storedApplicationEmail;
  if (!teamLookupEmail) {
    dashboardDebugLog("access_denied_no_primary_email", {
      clerkUserId,
      storedApplicationEmail: storedApplicationEmail || null,
      matchCandidates: candidateEmails,
    });
    return null;
  }

  const [teamMemberRecord] = await db
    .select()
    .from(teamMembers)
    .innerJoin(orders, eq(teamMembers.ownerOrderId, orders.id))
    .where(
      and(
        sql`lower(${teamMembers.emailNormalized}) = lower(${teamLookupEmail})`,
        inArray(teamMembers.status, ["invited", "active"]),
        eq(orders.status, "paid"),
        sql`lower(${orders.accountType}) = 'partner'`,
      ),
    )
    .orderBy(desc(teamMembers.createdAt));

  if (!teamMemberRecord) {
    dashboardDebugLog("access_denied_no_match", {
      clerkUserId,
      primaryEmail: primaryEmailNormalized || null,
      storedApplicationEmail: storedApplicationEmail || null,
      matchCandidates: candidateEmails,
      paidOrderCount: paidOrders.length,
    });
    return null;
  }

  dashboardDebugLog("access_match_team_member", {
    clerkUserId,
    primaryEmail: primaryEmailNormalized || null,
    storedApplicationEmail: storedApplicationEmail || null,
    matchedOrderId: teamMemberRecord.orders?.id || null,
    matchedAccountType: teamMemberRecord.orders?.accountType || null,
    teamMemberId: teamMemberRecord.team_members?.teamMemberId || null,
    matchCandidates: candidateEmails,
  });

  return {
    db,
    clerkUser,
    primaryEmail,
    accessType: "partner_team_member",
    paidOrders: [],
    latestPaidOrder: teamMemberRecord.orders,
    teamMember: teamMemberRecord.team_members,
  };
}

async function getPartnerTeamSnapshot(db: ReturnType<typeof requireDb>, partnerOrderId: string) {
  const [records, seatExtensions] = await Promise.all([
    db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.ownerOrderId, partnerOrderId))
      .orderBy(asc(teamMembers.seatNumber), asc(teamMembers.createdAt)),
    db
      .select()
      .from(teamSeatExtensions)
      .where(eq(teamSeatExtensions.partnerOrderId, partnerOrderId))
      .orderBy(desc(teamSeatExtensions.createdAt)),
  ]);

  const activeMembers = records.filter((member: any) => member.status !== "removed");
  const includedUsed = activeMembers.filter((member: any) => member.seatKind === "included").length;
  const additionalUsed = activeMembers.filter((member: any) => member.seatKind === "additional").length;
  const paidAdditionalSeats = seatExtensions
    .filter((item: any) => item.status === "active")
    .reduce((sum: number, item: any) => sum + Number(item.seatsRequested || 0), 0);
  const pendingSeatExtensionSeats = seatExtensions
    .filter((item: any) => item.status === "payment_required")
    .reduce((sum: number, item: any) => sum + Number(item.seatsRequested || 0), 0);
  const includedRemaining = Math.max(PARTNER_INCLUDED_TEAM_SEATS - includedUsed, 0);
  const totalAllowedSeats = PARTNER_INCLUDED_TEAM_SEATS + paidAdditionalSeats;
  const usedSeats = activeMembers.length;
  const remainingSeats = Math.max(totalAllowedSeats - usedSeats, 0);
  const canInvite = usedSeats < totalAllowedSeats;

  return {
    records,
    summary: {
      includedSeats: PARTNER_INCLUDED_TEAM_SEATS,
      includedUsed,
      includedRemaining,
      usedSeats,
      remainingSeats,
      totalAllowedSeats,
      additionalUsed,
      paidAdditionalSeats,
      pendingSeatExtensionSeats,
      pendingSeatExtensionRequests: seatExtensions.filter((item: any) => item.status === "payment_required").length,
      additionalSeatPrice: ADDITIONAL_TEAM_SEAT_PRICE,
      canInvite,
      inviteDisabledReason: canInvite
        ? null
        : "You have used all included team seats. Add more seats to invite additional members.",
    },
  };
}

function buildNormalizedApplicationPayload(order: typeof orders.$inferSelect | null | undefined) {
  const raw = getOrderPayloadRecord(order) || {};
  const normalized: Record<string, unknown> = { ...raw };

  const fieldMap: Record<string, string[]> = {
    firstName: ["firstName", "first_name", "givenName", "given_name"],
    lastName: ["lastName", "last_name", "familyName", "family_name"],
    fullName: ["fullName", "full_name", "name"],
    email: ["email"],
    phone: ["phone", "phoneNumber", "phone_number"],
    specialization: ["specialization", "specializationOther", "professionalDesc", "bizType", "brandType"],
    city: ["city"],
    state: ["state", "region", "province"],
    country: ["country"],
    yearsExperience: ["yearsExperience", "experience", "educatorYears"],
    educationDesc: ["educationDesc", "education", "studentSchool", "studentProgName"],
    achievementsDesc: ["achievementsDesc", "competitionResult", "publicationsLinks", "contributionDesc"],
    certificates: ["trainerCertificateFiles", "certificates", "licenseNumber"],
    licenseNumber: ["licenseNumber", "license", "workingJurisdictions"],
  };

  for (const [targetField, sourceKeys] of Object.entries(fieldMap)) {
    const existing = textValue(normalized[targetField]);
    if (existing) {
      continue;
    }

    const next = getApplicationField(order, ...sourceKeys);
    if (next) {
      normalized[targetField] = next;
    }
  }

  return normalized;
}

function buildOwnerDashboardProfile(
  order: typeof orders.$inferSelect | null | undefined,
  userProfile: typeof users.$inferSelect | null | undefined,
) {
  const fallbackName = firstText(order?.name, getApplicationField(order, "fullName", "full_name", "name"));
  const splitName = splitFullName(fallbackName);

  const mapped = {
    firstName: firstText(
      getApplicationField(order, "firstName", "first_name", "givenName", "given_name"),
      userProfile?.firstName,
      splitName.firstName,
    ),
    lastName: firstText(
      getApplicationField(order, "lastName", "last_name", "familyName", "family_name"),
      userProfile?.lastName,
      splitName.lastName,
    ),
    fullName: fallbackName,
    email: firstText(order?.email, getApplicationField(order, "email"), userProfile?.email),
    phone: firstText(order?.phone, getApplicationField(order, "phone", "phoneNumber", "phone_number")),
    specialization: firstText(
      getApplicationField(order, "specialization", "specializationOther", "professionalDesc", "bizType", "brandType"),
      userProfile?.specialization,
    ),
    city: firstText(getApplicationField(order, "city"), userProfile?.city),
    state: firstText(getApplicationField(order, "state", "region", "province")),
    country: firstText(getApplicationField(order, "country"), userProfile?.country),
    experienceYears: firstText(
      getApplicationField(order, "yearsExperience", "experience", "educatorYears"),
      userProfile?.experienceYears,
    ),
    education: firstText(
      getApplicationField(order, "educationDesc", "education", "studentSchool", "studentProgName"),
      userProfile?.education,
    ),
    certificatesSummary: firstText(getApplicationField(order, "trainerCertificateFiles", "certificates", "licenseNumber")),
    achievements: firstText(
      getApplicationField(order, "achievementsDesc", "competitionResult", "publicationsLinks", "contributionDesc"),
    ),
  };

  const mappedFields = Object.entries(mapped)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([field]) => field);

  return { mapped, mappedFields };
}

// 1. Dashboard User Fetching (Protected)
dashboardRouter.get("/me", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;

  console.log(`[Dashboard /me] Request received. clerkUserId: ${clerkUserId || "NONE"}`);

  if (!clerkUserId) {
    console.warn(`[Dashboard /me] No clerkUserId found. Auth state:`, JSON.stringify(auth));
    return res.status(401).json({ error: "Unauthorized: Clerk user ID not found in token" });
  }

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, primaryEmail, accessType, teamMember, latestPaidOrder } = access;
    const resolvedAccountType = resolveOrderAccountType(latestPaidOrder);
    const membershipStatus = latestPaidOrder?.status || "pending";
    const paymentStatus = latestPaidOrder?.status === "paid" ? "paid" : "pending";
    console.log(`[Dashboard /me] Dashboard access granted. email: ${primaryEmail} type: ${accessType}`);

    if (accessType === "partner_team_member" && teamMember && latestPaidOrder) {
      dashboardDebugLog("me_map_team_member", {
        clerkUserId,
        clerkPrimaryEmail: normalizeEmail(primaryEmail),
        matchedOrderId: latestPaidOrder.id,
        matchedAccountType: latestPaidOrder.accountType || null,
        mappedFields: ["teamMember", "membershipStatus", "paymentStatus"],
      });

      return res.json({
        certificates: [],
        accountType: "partner",
        applicationType: latestPaidOrder.applicantType || "Partner Team Member",
        orderType: latestPaidOrder.accountType || "partner",
        membershipStatus,
        paymentStatus,
        certificateStatus: "not_available_for_team_member",
        dashboardAccess: {
          type: accessType,
          accountType: "partner",
          partnerOrderId: latestPaidOrder.id,
          partnerName: latestPaidOrder.name,
          partnerEmail: latestPaidOrder.email,
          ownerMemberId: teamMember.ownerMemberId,
          teamMemberId: teamMember.teamMemberId,
          teamMemberStatus: teamMember.status,
          role: teamMember.role,
          licenseNumber: teamMember.license,
        },
      });
    }

    // 4. Now fetch all linked paid certificates
    const userCertificates = await db.select({
      certNumber: certificates.certNumber,
      orderEmail: orders.email,
      orderName: orders.name,
      accountType: orders.accountType,
      phone: orders.phone,
      membershipCategory: orders.membershipCategory,
      applicantType: orders.applicantType,
      status: orders.status,
      certificateUrl: certificates.certificateUrl,
      expiresAt: certificates.expiresAt,
      applicationPayload: orders.applicationPayload,
      createdAt: orders.createdAt,
    })
    .from(certificates)
    .innerJoin(orders, eq(certificates.orderId, orders.id))
    .where(and(eq(certificates.clerkUserId, clerkUserId), eq(orders.status, "paid")));

    let partnerTeam: null | {
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
      invitedMembers: Array<{
        id: string;
        teamMemberId: string;
        fullName: string;
        email: string;
        role: string;
        status: string;
      }>;
    } = null;

    if (accessType === "partner_owner" && latestPaidOrder) {
      const snapshot = await getPartnerTeamSnapshot(db, latestPaidOrder.id);
      const invitedMembers = snapshot.records
        .filter((item: any) => item.status !== "removed")
        .map((item: any) => ({
          id: item.id,
          teamMemberId: item.teamMemberId,
          fullName: item.fullName,
          email: item.email,
          role: item.role,
          status: item.status,
        }));

      partnerTeam = {
        ...snapshot.summary,
        invitedMembers,
      };
    }

    console.log(`[Dashboard /me] Returning ${userCertificates.length} certificates for ${clerkUserId}`);
    dashboardDebugLog("me_map_owner", {
      clerkUserId,
      clerkPrimaryEmail: normalizeEmail(primaryEmail),
      matchedOrderId: latestPaidOrder?.id || null,
      matchedAccountType: latestPaidOrder?.accountType || null,
      certificateCount: userCertificates.length,
      mappedFields: [
        "accountType",
        "applicationType",
        "orderType",
        "membershipStatus",
        "paymentStatus",
        "certificateStatus",
      ],
    });
    res.json({
      certificates: userCertificates,
      accountType: resolvedAccountType,
      applicationType: latestPaidOrder?.applicantType || null,
      orderType: latestPaidOrder?.accountType || null,
      membershipStatus,
      paymentStatus,
      certificateStatus: userCertificates.length > 0 ? "issued" : "pending",
      partnerTeam,
      dashboardAccess: {
        type: accessType,
        accountType: resolvedAccountType,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Dashboard /me] CRITICAL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// 2. Dashboard Extended Profile Fetching
dashboardRouter.get("/profile", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, latestPaidOrder, accessType, teamMember, primaryEmail } = access;
    const resolvedAccountType = resolveOrderAccountType(latestPaidOrder);
    const membershipStatus = latestPaidOrder?.status || "pending";
    const paymentStatus = latestPaidOrder?.status === "paid" ? "paid" : "pending";
    const [userProfile] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));
    const [latestCertificate] =
      latestPaidOrder
        ? await db
            .select({
              id: certificates.id,
              certNumber: certificates.certNumber,
              expiresAt: certificates.expiresAt,
              createdAt: certificates.createdAt,
            })
            .from(certificates)
            .where(eq(certificates.orderId, latestPaidOrder.id))
            .orderBy(desc(certificates.createdAt))
            .limit(1)
        : [null];

    const ownerApplicationPayload = buildNormalizedApplicationPayload(latestPaidOrder);
    const ownerProfileMapping = buildOwnerDashboardProfile(latestPaidOrder, userProfile || null);

    const partnerTeamSnapshot =
      accessType === "partner_owner" && latestPaidOrder
        ? await getPartnerTeamSnapshot(db, latestPaidOrder.id)
        : null;

    if (accessType === "partner_team_member" && teamMember && latestPaidOrder) {
      dashboardDebugLog("profile_map_team_member", {
        clerkUserId,
        clerkPrimaryEmail: normalizeEmail(primaryEmail),
        matchedOrderId: latestPaidOrder.id,
        matchedAccountType: latestPaidOrder.accountType || null,
        mappedFields: ["teamMember", "membershipStatus", "paymentStatus"],
      });

      return res.json({
        profile: {
          ...(userProfile || {}),
          applicationPayload: {},
          type: "partner",
          accountType: "partner",
          applicationType: latestPaidOrder.applicantType || "Partner Team Member",
          orderType: latestPaidOrder.accountType || "partner",
          membershipStatus,
          paymentStatus,
          certificateStatus: "not_available_for_team_member",
          membershipCategory: latestPaidOrder.membershipCategory || null,
          applicantType: "Partner Team Member",
          orderId: latestPaidOrder.id,
          dashboardAccessType: accessType,
          teamMember: {
            id: teamMember.id,
            teamMemberId: teamMember.teamMemberId,
            fullName: teamMember.fullName,
            email: teamMember.email,
            role: teamMember.role,
            licenseNumber: teamMember.license,
            status: teamMember.status,
            portfolioLink: teamMember.portfolioLink,
            ownerMemberId: teamMember.ownerMemberId,
            partnerBusinessName: latestPaidOrder.name,
            partnerBusinessEmail: latestPaidOrder.email,
          },
        },
      });
    }

    res.json({
      profile: {
        ...(userProfile || {}),
        applicationPayload: ownerApplicationPayload,
        firstName: ownerProfileMapping.mapped.firstName || userProfile?.firstName || null,
        lastName: ownerProfileMapping.mapped.lastName || userProfile?.lastName || null,
        fullName: ownerProfileMapping.mapped.fullName || latestPaidOrder?.name || null,
        email: ownerProfileMapping.mapped.email || latestPaidOrder?.email || userProfile?.email || null,
        phone: ownerProfileMapping.mapped.phone || latestPaidOrder?.phone || null,
        specialization: ownerProfileMapping.mapped.specialization || userProfile?.specialization || null,
        city: ownerProfileMapping.mapped.city || userProfile?.city || null,
        state: ownerProfileMapping.mapped.state || null,
        country: ownerProfileMapping.mapped.country || userProfile?.country || null,
        experienceYears: ownerProfileMapping.mapped.experienceYears || userProfile?.experienceYears || null,
        education: ownerProfileMapping.mapped.education || userProfile?.education || null,
        certificatesSummary: ownerProfileMapping.mapped.certificatesSummary || null,
        achievements: ownerProfileMapping.mapped.achievements || null,
        type: resolvedAccountType,
        accountType: resolvedAccountType,
        applicationType: latestPaidOrder?.applicantType || null,
        orderType: latestPaidOrder?.accountType || null,
        membershipStatus,
        paymentStatus,
        certificateStatus: latestCertificate?.certNumber ? "issued" : "pending",
        membershipCategory: latestPaidOrder?.membershipCategory || null,
        applicantType: latestPaidOrder?.applicantType || null,
        orderId: latestPaidOrder?.id || null,
        dashboardAccessType: accessType,
        partnerTeamSummary:
          partnerTeamSnapshot
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
      },
    });

    dashboardDebugLog("profile_map_owner", {
      clerkUserId,
      clerkPrimaryEmail: normalizeEmail(primaryEmail),
      matchedOrderId: latestPaidOrder?.id || null,
      matchedAccountType: latestPaidOrder?.accountType || null,
      mappedFields: ownerProfileMapping.mappedFields,
    });
  } catch (error) {
    console.error("[Dashboard /profile GET] Error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

dashboardRouter.get("/notifications", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, primaryEmail } = access;
    const records = await db
      .select()
      .from(dashboardNotifications)
      .where(sql`lower(${dashboardNotifications.email}) = lower(${primaryEmail})`)
      .orderBy(desc(dashboardNotifications.createdAt));

    res.json({
      notifications: records.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        timestamp: item.createdAt,
        unread: !item.readAt,
        ctaLabel: item.ctaLabel,
        ctaUrl: item.ctaUrl,
      })),
    });
  } catch (error) {
    console.error("[Dashboard /notifications GET] Error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

dashboardRouter.patch("/notifications", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, primaryEmail } = access;
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((item: unknown): item is string => typeof item === "string" && item.length > 0)
      : [];

    const whereClause = ids.length > 0
      ? and(
          sql`lower(${dashboardNotifications.email}) = lower(${primaryEmail})`,
          inArray(dashboardNotifications.id, ids),
          isNull(dashboardNotifications.readAt),
        )
      : and(
          sql`lower(${dashboardNotifications.email}) = lower(${primaryEmail})`,
          isNull(dashboardNotifications.readAt),
        );

    const updated = await db
      .update(dashboardNotifications)
      .set({ readAt: new Date() })
      .where(whereClause)
      .returning({ id: dashboardNotifications.id });

    res.json({ success: true, updatedIds: updated.map((item: { id: string }) => item.id) });
  } catch (error) {
    console.error("[Dashboard /notifications PATCH] Error:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

dashboardRouter.get("/team-members", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, latestPaidOrder, accessType } = access;
    if (!latestPaidOrder || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const ownerMemberId = await getPartnerOwnerMemberId(db, latestPaidOrder.id);
    const { records, summary } = await getPartnerTeamSnapshot(db, latestPaidOrder.id);

    res.json({
      ownerMemberId,
      ...summary,
      partnerBusinessName: latestPaidOrder.name,
      partnerBusinessEmail: latestPaidOrder.email,
      members: records.map((item: any) => ({
        id: item.id,
        teamMemberId: item.teamMemberId,
        fullName: item.fullName,
        email: item.email,
        role: item.role,
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
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

dashboardRouter.post("/team-members", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, latestPaidOrder, accessType } = access;
    if (!latestPaidOrder || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const fullName = trimValue(req.body?.fullName);
    const email = trimValue(req.body?.email);
    const emailNormalized = normalizeEmail(req.body?.email);
    const role = trimValue(req.body?.role, 120);
    const portfolioLink = optionalTrimmedValue(req.body?.portfolioLink, 500);
    const licenseNumber = trimValue(req.body?.licenseNumber ?? req.body?.license, 120);
    const affiliationConfirmed = req.body?.affiliationConfirmed === true;

    if (!fullName) {
      return res.status(400).json({ error: "Full name is required." });
    }

    if (!email || !emailNormalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    if (!role) {
      return res.status(400).json({ error: "Position / role is required." });
    }

    if (!licenseNumber) {
      return res.status(400).json({ error: "License number is required." });
    }

    if (!affiliationConfirmed) {
      return res.status(400).json({
        error: "Affiliation confirmation is required before adding a team member.",
      });
    }

    const { records: existingMembers, summary } = await getPartnerTeamSnapshot(db, latestPaidOrder.id);
    const nonRemovedMembers = existingMembers.filter((member: any) => member.status !== "removed");

    if (nonRemovedMembers.length >= MAX_TEAM_SEATS) {
      return res.status(400).json({
        error: `Maximum team size is ${MAX_TEAM_SEATS} seats for this release.`,
      });
    }

    if (nonRemovedMembers.some((member: { emailNormalized: string }) => member.emailNormalized === emailNormalized)) {
      return res.status(400).json({
        error: "This email is already assigned to an active team seat in your partner account.",
      });
    }

    if (!summary.canInvite) {
      return res.status(400).json({
        error: "You have used all included team seats. Add more seats to invite additional members.",
        code: "SEAT_LIMIT_REACHED",
      });
    }

    const seatNumber =
      existingMembers.reduce((max: number, item: any) => Math.max(max, Number(item.seatNumber || 0)), 0) + 1;
    const seatKind = summary.includedUsed < PARTNER_INCLUDED_TEAM_SEATS ? "included" : "additional";
    const billingStatus = seatKind === "included" ? "included" : "paid";
    const accessStatus = "active";
    const ownerMemberId = await getPartnerOwnerMemberId(db, latestPaidOrder.id);
    const teamMemberId = `${ownerMemberId}-T${seatNumber}`;

    const [created] = await db
      .insert(teamMembers)
      .values({
        ownerOrderId: latestPaidOrder.id,
        ownerClerkUserId: clerkUserId,
        ownerMemberId,
        teamMemberId,
        fullName,
        email,
        emailNormalized,
        role,
        portfolioLink,
        license: licenseNumber,
        affiliationConfirmed,
        status: "invited",
        seatNumber,
        seatKind,
        billingStatus,
        accessStatus,
        registrationStatus: "not_registered",
        ticketCode: null,
        attendanceStatus: "not_marked",
      })
      .returning();

    return res.status(201).json({
      ownerMemberId,
      additionalSeatPrice: ADDITIONAL_TEAM_SEAT_PRICE,
      member: {
        id: created.id,
        teamMemberId: created.teamMemberId,
        fullName: created.fullName,
        email: created.email,
        role: created.role,
        portfolioLink: created.portfolioLink,
        licenseNumber: created.license,
        status: created.status,
        seatNumber: created.seatNumber,
        seatKind: created.seatKind,
        billingStatus: created.billingStatus,
        accessStatus: created.accessStatus,
        registrationStatus: created.registrationStatus,
        ticketCode: created.ticketCode,
        attendanceStatus: created.attendanceStatus,
        createdAt: created.createdAt,
      },
      note: seatKind === "additional" ? "Additional team seat is active." : "Team educational seat is active.",
    });
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.includes("team_members_team_member_id_uidx")) {
      return res.status(400).json({ error: "Team member ID conflict. Please retry." });
    }
    console.error("[Dashboard /team-members POST] Error:", error);
    res.status(500).json({ error: "Failed to add team member" });
  }
});

dashboardRouter.post("/team-members/extend-seats", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, latestPaidOrder, accessType } = access;
    if (!latestPaidOrder || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const seatsRequested = Math.max(1, Math.min(Number(req.body?.seatsRequested) || 1, 20));
    const [request] = await db
      .insert(teamSeatExtensions)
      .values({
        partnerOrderId: latestPaidOrder.id,
        ownerClerkUserId: clerkUserId,
        seatsRequested,
        status: "payment_required",
      })
      .returning();

    res.status(201).json({
      requestId: request.id,
      seatsRequested: request.seatsRequested,
      status: request.status,
      note: "Seat extension request created. Payment integration is pending.",
    });
  } catch (error) {
    console.error("[Dashboard /team-members/extend-seats POST] Error:", error);
    res.status(500).json({ error: "Failed to request seat extension" });
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
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, latestPaidOrder, accessType } = access;
    if (!latestPaidOrder || accessType !== "partner_owner") {
      return res.status(403).json(PARTNER_OWNER_ONLY_ERROR);
    }

    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.ownerOrderId, latestPaidOrder.id)));

    if (!member || member.status === "removed") {
      return res.status(404).json({ error: "Team member not found." });
    }

    await db
      .update(teamMembers)
      .set({
        status: "removed",
        accessStatus: "removed",
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, memberId));

    res.json({ success: true, id: memberId });
  } catch (error) {
    console.error("[Dashboard /team-members DELETE] Error:", error);
    res.status(500).json({ error: "Failed to remove team member" });
  }
});

// 3. Dashboard Extended Profile Updating
dashboardRouter.patch("/profile", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requireDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, clerkUser, primaryEmail, latestPaidOrder, accessType } = access;
    if (accessType === "partner_team_member") {
      return res.status(403).json({
        error: "Team member profiles are managed by the partner owner.",
        code: "TEAM_MEMBER_EDIT_DISABLED",
      });
    }
    const email = primaryEmail || latestPaidOrder?.email || "";
    const {
      imageUrl,
      bio,
      specialization,
      experienceYears,
      education,
      instagramUrl,
      country,
      city,
      applicationPayload,
    } = req.body;
    
    const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));

    const existingPayload =
      latestPaidOrder?.applicationPayload && typeof latestPaidOrder.applicationPayload === "object"
        ? (latestPaidOrder.applicationPayload as Record<string, unknown>)
        : {};

    const nextApplicationPayload = {
      ...existingPayload,
      ...pickEditableApplicationFields(
        applicationPayload && typeof applicationPayload === "object" ? applicationPayload as Record<string, unknown> : {},
      ),
    };
    const nextSpecialization = textValue(nextApplicationPayload.specialization);

    if (latestPaidOrder) {
      await db
        .update(orders)
        .set({
          phone: (nextApplicationPayload.phone as string) || latestPaidOrder.phone || null,
          applicationPayload: nextApplicationPayload,
        })
        .where(eq(orders.id, latestPaidOrder.id));
    }
    
    if (existing) {
      await db.update(users).set({
        imageUrl: imageUrl ?? existing.imageUrl,
        bio,
        specialization: specialization || nextSpecialization || existing.specialization,
        experienceYears: experienceYears || (nextApplicationPayload.yearsExperience as string) || existing.experienceYears,
        education: education || (nextApplicationPayload.educationDesc as string) || existing.education,
        instagramUrl: instagramUrl || (nextApplicationPayload.instagramLink as string) || existing.instagramUrl,
        country: country || (nextApplicationPayload.country as string) || existing.country,
        city: city || (nextApplicationPayload.city as string) || existing.city,
        updatedAt: new Date()
      }).where(eq(users.clerkId, clerkUserId));
    } else {
      await db.insert(users).values({
        clerkId: clerkUserId,
        email,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        imageUrl: imageUrl ?? null,
        bio,
        specialization: specialization || nextSpecialization || null,
        experienceYears: experienceYears || (nextApplicationPayload.yearsExperience as string) || null,
        education: education || (nextApplicationPayload.educationDesc as string) || null,
        instagramUrl: instagramUrl || (nextApplicationPayload.instagramLink as string) || null,
        country: country || (nextApplicationPayload.country as string) || null,
        city: city || (nextApplicationPayload.city as string) || null,
      });
    }

    res.json({ success: true, applicationPayload: nextApplicationPayload });
  } catch (error) {
    console.error("[Dashboard /profile PATCH] Error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

async function listCards(req: any, res: any) {
  try {
    const db = requireDb();
    const isMailingPurpose = req.query?.purpose === "mailing";
    const { limit, offset } = getPaginationParams(
      req.query || {},
      isMailingPurpose ? ADMIN_CARD_MAILING_DEFAULT_LIMIT : ADMIN_CARD_LIST_DEFAULT_LIMIT,
      isMailingPurpose ? ADMIN_CARD_MAILING_MAX_LIMIT : ADMIN_CARD_LIST_MAX_LIMIT,
    );
    const searchCondition = getCardSearchCondition(req.query?.q);
    const baseCondition = combineConditions(eq(orders.status, "paid"), searchCondition);

    const listSelection = isMailingPurpose
      ? {
          id: orders.id,
          userName: orders.name,
          email: orders.email,
          membershipCategory: orders.membershipCategory,
          status: orders.status,
          createdAt: orders.createdAt,
        }
      : {
          id: orders.id,
          userName: orders.name,
          email: orders.email,
          phone: orders.phone,
          membershipCategory: orders.membershipCategory,
          status: orders.status,
          certificateNumber: certificates.certNumber,
          certificateUrl: certificates.certificateUrl,
          expiresAt: certificates.expiresAt,
          createdAt: orders.createdAt,
          bio: users.bio,
          specialization: users.specialization,
          experienceYears: users.experienceYears,
          education: users.education,
          instagramUrl: users.instagramUrl,
          country: users.country,
          city: users.city,
          hasDashboardAccess: sql<boolean>`${certificates.clerkUserId} is not null`,
        };

    const itemsQuery = db.select(listSelection)
      .from(orders)
      .leftJoin(certificates, eq(orders.id, certificates.orderId))
      .leftJoin(users, eq(certificates.clerkUserId, users.clerkId))
      .where(baseCondition)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .leftJoin(certificates, eq(orders.id, certificates.orderId))
      .where(baseCondition);

    const categoryRowsQuery = db
      .select({ membershipCategory: orders.membershipCategory })
      .from(orders)
      .where(eq(orders.status, "paid"))
      .groupBy(orders.membershipCategory);

    const [items, countRows, categoryRows] = await Promise.all([
      itemsQuery,
      countQuery,
      categoryRowsQuery,
    ]);

    const mapped = items.map((c: any) => ({
      ...c,
      cardName: c.membershipCategory || "Professional Membership"
    }));

    const total = countToNumber(countRows[0]?.count);
    res.json({
      items: mapped,
      total,
      limit,
      offset,
      hasMore: offset + mapped.length < total,
      categories: categoryRows
        .map((row: any) => row.membershipCategory)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to fetch cards:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
}

cardsRouter.get("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const db = requireDb();
    const [client] = await db.select({
      id: orders.id,
      userName: orders.name,
      email: orders.email,
      phone: orders.phone,
      membershipCategory: orders.membershipCategory,
      status: orders.status,
      certificateNumber: certificates.certNumber,
      certificateUrl: certificates.certificateUrl,
      expiresAt: certificates.expiresAt,
      applicationPayload: orders.applicationPayload,
      createdAt: orders.createdAt,
      bio: users.bio,
      specialization: users.specialization,
      experienceYears: users.experienceYears,
      education: users.education,
      instagramUrl: users.instagramUrl,
      country: users.country,
      city: users.city,
      hasDashboardAccess: sql<boolean>`${certificates.clerkUserId} is not null`,
    })
    .from(orders)
    .leftJoin(certificates, eq(orders.id, certificates.orderId))
    .leftJoin(users, eq(certificates.clerkUserId, users.clerkId))
    .where(and(eq(orders.status, "paid"), eq(orders.id, id)));

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({
      ...client,
      cardName: client.membershipCategory || "Professional Membership"
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to fetch card detail:", error);
    res.status(500).json({ error: "Failed to fetch card detail" });
  }
});

cardsRouter.get("/", adminClerkMiddleware, requireAdminAccess, listCards);
