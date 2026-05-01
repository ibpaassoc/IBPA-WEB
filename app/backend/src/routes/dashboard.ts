import { Router } from "express";
import { requireDb, orders, certificates, users, dashboardNotifications } from "../lib/db";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { clerkMiddleware, getAuth, clerkOptions, clerkClient } from "../services/clerk";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";

export const dashboardRouter = Router();
export const cardsRouter = Router();

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
        email: primaryEmail,
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

async function requirePaidDashboardAccess(clerkUserId: string) {
  const db = requireDb();
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail =
    clerkUser.emailAddresses.find((email: any) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    null;

  const paidByLinkedCertificate = await db
    .select({ order: orders })
    .from(certificates)
    .innerJoin(orders, eq(certificates.orderId, orders.id))
    .where(and(eq(certificates.clerkUserId, clerkUserId), eq(orders.status, "paid")))
    .orderBy(desc(orders.createdAt));

  const paidByEmail = primaryEmail
    ? await db
        .select()
        .from(orders)
        .where(and(sql`lower(${orders.email}) = lower(${primaryEmail})`, eq(orders.status, "paid")))
        .orderBy(desc(orders.createdAt))
    : [];

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

  if (paidOrders.length === 0) {
    return null;
  }

  if (primaryEmail) {
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

  return {
    db,
    clerkUser,
    primaryEmail,
    paidOrders,
    latestPaidOrder: paidOrders[0] || null,
  };
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
    const access = await requirePaidDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, primaryEmail } = access;
    console.log(`[Dashboard /me] Paid dashboard access granted. email: ${primaryEmail}`);

    // 4. Now fetch all linked paid certificates
    const userCertificates = await db.select({
      certNumber: certificates.certNumber,
      orderEmail: orders.email,
      orderName: orders.name,
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

    console.log(`[Dashboard /me] Returning ${userCertificates.length} certificates for ${clerkUserId}`);
    res.json({ certificates: userCertificates });
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
    const access = await requirePaidDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, latestPaidOrder } = access;
    const [userProfile] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));

    const applicationPayload =
      latestPaidOrder?.applicationPayload && typeof latestPaidOrder.applicationPayload === "object"
        ? (latestPaidOrder.applicationPayload as Record<string, unknown>)
        : {};

    res.json({
      profile: {
        ...(userProfile || {}),
        applicationPayload,
        membershipCategory: latestPaidOrder?.membershipCategory || null,
        applicantType: latestPaidOrder?.applicantType || null,
        orderId: latestPaidOrder?.id || null,
      },
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
    const access = await requirePaidDashboardAccess(clerkUserId);
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
    const access = await requirePaidDashboardAccess(clerkUserId);
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

// 3. Dashboard Extended Profile Updating
dashboardRouter.patch("/profile", clerkMiddleware(clerkOptions), async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const access = await requirePaidDashboardAccess(clerkUserId);
    if (!access) {
      return res.status(403).json(DASHBOARD_ACCESS_ERROR);
    }

    const { db, clerkUser, primaryEmail, latestPaidOrder } = access;
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
    const allCerts = await db.select({
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
    .where(eq(orders.status, 'paid')); 

    // Add a default cardName if missing
    const mpped = allCerts.map((c: any) => ({
      ...c,
      cardName: c.membershipCategory || "Professional Membership"
    }));

    res.json(mpped);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to fetch cards:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
}

cardsRouter.get("/", adminClerkMiddleware, requireAdminAccess, listCards);
