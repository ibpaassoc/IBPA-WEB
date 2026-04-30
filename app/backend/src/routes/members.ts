import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { orders, requireDb, users } from "../lib/db";
import { clerkClient } from "../services/clerk";

export const membersRouter = Router();

type MemberRecord = {
  orderId: string;
  fullName: string;
  email: string;
  clerkId: string | null;
  membershipCategory: string | null;
  applicantType: string | null;
  createdAt: Date;
  bio: string | null;
  specialization: string | null;
  experienceYears: string | null;
  education: string | null;
  instagramUrl: string | null;
  country: string | null;
  city: string | null;
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  applicationPayload: unknown;
};

function textValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : typeof item === "number" ? String(item) : ""))
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const normalized = textValue(value);
    if (normalized) return normalized;
  }
  return "";
}

function joinIfTruthy(values: unknown[], separator = " • ") {
  return values
    .map((value) => textValue(value))
    .filter(Boolean)
    .join(separator);
}

function toPublicMember(record: MemberRecord) {
  const payload = asPayload(record.applicationPayload);
  const firstName = firstNonEmpty(record.firstName, payload.firstName, record.fullName.split(" ")[0]);
  const lastName = firstNonEmpty(record.lastName, payload.lastName);
  const specialization = firstNonEmpty(
    payload.specialization,
    payload.currentPosition,
    record.specialization,
    payload.bizType,
    payload.brandType,
    payload.educatorRole,
  );
  const achievementSummary = firstNonEmpty(
    payload.achievementsDesc,
    joinIfTruthy([payload.competitionName, payload.competitionYear, payload.competitionResult]),
    payload.publicationsLinks,
  );
  const contributionSummary = firstNonEmpty(
    payload.contributionDesc,
    payload.professionalCommunityYesNo === "Yes" ? "Active in a professional community" : "",
    joinIfTruthy([payload.otherOrganizationName, payload.otherOrganizationStatus, payload.otherOrganizationYears]),
  );
  const description = firstNonEmpty(payload.professionalDesc, record.bio, achievementSummary, contributionSummary, payload.studentMotivation);
  const city = firstNonEmpty(payload.city, record.city);
  const country = firstNonEmpty(payload.country, record.country);
  const location = [city, country].filter(Boolean).join(", ");
  const experience = firstNonEmpty(payload.yearsExperience, record.experienceYears, payload.educatorYears);
  const websiteUrl = firstNonEmpty(payload.websiteLink, payload.portfolioLink);
  const portfolioImages = stringArray(payload.portfolioImages).slice(0, 10);
  const highlights = [
    firstNonEmpty(payload.workingJurisdictions),
    achievementSummary,
    contributionSummary,
    firstNonEmpty(payload.educatorSubjects, payload.bizServices, payload.brandMarket),
    firstNonEmpty(payload.educationDesc, record.education),
  ].filter(Boolean);

  return {
    id: record.orderId,
    fullName: record.fullName,
    firstName,
    lastName,
    membershipCategory: record.membershipCategory || "",
    applicantType: record.applicantType || "",
    title: specialization || "IBPA Member",
    description,
    experience,
    location,
    city,
    country,
    avatarUrl: record.imageUrl || null,
    instagramUrl: firstNonEmpty(payload.instagramLink, record.instagramUrl) || null,
    websiteUrl: websiteUrl || null,
    portfolioImages,
    highlights: highlights.slice(0, 3),
    memberSince: record.createdAt.toISOString(),
  };
}

async function hydrateMemberImage(record: MemberRecord) {
  if (record.imageUrl || !record.clerkId) {
    return record;
  }

  try {
    const clerkUser = await clerkClient.users.getUser(record.clerkId);
    const imageUrl = clerkUser.imageUrl || null;

    if (!imageUrl) {
      return record;
    }

    const db = requireDb();
    await db
      .update(users)
      .set({
        imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, record.clerkId));

    return {
      ...record,
      imageUrl,
    };
  } catch (error) {
    console.error(`[Members /public] Failed to hydrate image for Clerk user ${record.clerkId}:`, error);
    return record;
  }
}

membersRouter.get("/public", async (_req, res) => {
  try {
    const db = requireDb();
    const rawRecords = await db
      .select({
        orderId: orders.id,
        fullName: orders.name,
        email: orders.email,
        clerkId: users.clerkId,
        membershipCategory: orders.membershipCategory,
        applicantType: orders.applicantType,
        createdAt: orders.createdAt,
        bio: users.bio,
        specialization: users.specialization,
        experienceYears: users.experienceYears,
        education: users.education,
        instagramUrl: users.instagramUrl,
        country: users.country,
        city: users.city,
        imageUrl: users.imageUrl,
        firstName: users.firstName,
        lastName: users.lastName,
        applicationPayload: orders.applicationPayload,
      })
      .from(orders)
      .leftJoin(users, sql`lower(${orders.email}) = lower(${users.email})`)
      .where(eq(orders.status, "paid"))
      .orderBy(desc(orders.createdAt));

    const records = await Promise.all(rawRecords.map(hydrateMemberImage));

    const uniqueMembers = new Map<string, ReturnType<typeof toPublicMember>>();

    for (const record of records) {
      const key = record.email.trim().toLowerCase();
      if (!uniqueMembers.has(key)) {
        uniqueMembers.set(key, toPublicMember(record));
      }
    }

    res.json({ items: Array.from(uniqueMembers.values()) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Members /public] Error:", error);
    res.status(500).json({ error: "Failed to fetch public members" });
  }
});
