import { and, desc, eq, sql } from "drizzle-orm";
import { clerkClient } from "@/services/clerk";
import { requireDb } from "@/lib/db";
import { coreMemberships, coreProfiles, coreUsers, orders, users } from "@/lib/schema";
import type { CanonicalPublicMemberRow, DashboardProfileSaveInput, LegacyPublicMemberRow } from "./profile.types";

type DbClient = ReturnType<typeof requireDb>;

export async function listCanonicalPublicMemberRows(db: DbClient): Promise<CanonicalPublicMemberRow[]> {
  return db
    .select({
      id: coreUsers.id,
      membershipType: coreMemberships.type,
      memberSince: coreMemberships.startedAt,
      email: coreUsers.email,
      role: coreUsers.role,
      firstName: coreProfiles.firstName,
      lastName: coreProfiles.lastName,
      avatarUrl: coreProfiles.avatarUrl,
      bio: coreProfiles.bio,
      credentials: coreProfiles.credentials,
      services: coreProfiles.services,
      workGalleryPhotos: coreProfiles.workGalleryPhotos,
      specializations: coreProfiles.specializations,
      city: coreProfiles.city,
      state: coreProfiles.state,
      country: coreProfiles.country,
      website: coreProfiles.website,
      instagram: coreProfiles.instagram,
      yearsExperience: coreProfiles.yearsExperience,
      createdAt: coreProfiles.createdAt,
    })
    .from(coreMemberships)
    .innerJoin(coreUsers, eq(coreMemberships.userId, coreUsers.id))
    .leftJoin(coreProfiles, eq(coreProfiles.userId, coreUsers.id))
    .where(eq(coreMemberships.status, "ACTIVE"))
    .orderBy(desc(coreMemberships.startedAt), desc(coreProfiles.createdAt));
}

export async function listLegacyPublicMemberRows(db: DbClient): Promise<LegacyPublicMemberRow[]> {
  return db
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
}

export async function hydrateLegacyMemberImage(db: DbClient, record: LegacyPublicMemberRow) {
  if (record.imageUrl || !record.clerkId) {
    return record;
  }

  try {
    const clerkUser = await clerkClient.users.getUser(record.clerkId);
    const imageUrl = clerkUser.imageUrl || null;

    if (!imageUrl) {
      return record;
    }

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
  } catch {
    return record;
  }
}

export async function saveLegacyDashboardProfile(db: DbClient, params: DashboardProfileSaveInput) {
  const [existingUser] = await db.select().from(users).where(eq(users.clerkId, params.clerkUserId));

  const nextApplicationPayload =
    params.applicationPayload && typeof params.applicationPayload === "object"
      ? params.applicationPayload
      : {};

  if (params.legacyOrder) {
    await db
      .update(orders)
      .set({
        phone: typeof nextApplicationPayload.phone === "string" ? nextApplicationPayload.phone : params.legacyOrder.phone ?? null,
        applicationPayload: nextApplicationPayload,
      })
      .where(eq(orders.id, params.legacyOrder.id));
  }

  if (existingUser) {
    await db
      .update(users)
      .set({
        imageUrl: params.imageUrl ?? existingUser.imageUrl,
        bio: params.bio ?? existingUser.bio,
        specialization: params.specialization ?? existingUser.specialization,
        experienceYears: params.experienceYears ?? existingUser.experienceYears,
        education: params.education ?? existingUser.education,
        instagramUrl: params.instagramUrl ?? existingUser.instagramUrl,
        country: params.country ?? existingUser.country,
        city: params.city ?? existingUser.city,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, params.clerkUserId));
  } else {
    await db.insert(users).values({
      clerkId: params.clerkUserId,
      email: params.email,
      firstName: params.firstName ?? "",
      lastName: params.lastName ?? "",
      imageUrl: params.imageUrl ?? null,
      bio: params.bio ?? null,
      specialization: params.specialization ?? null,
      experienceYears: params.experienceYears ?? null,
      education: params.education ?? null,
      instagramUrl: params.instagramUrl ?? null,
      country: params.country ?? null,
      city: params.city ?? null,
    });
  }

  return {
    existingUser: existingUser ?? null,
    nextApplicationPayload,
  };
}

export async function upsertCanonicalProfile(db: DbClient, params: {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  credentials?: string | null;
  services?: string | null;
  workGalleryPhotos?: string[];
  specializations?: string[];
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  instagram?: string | null;
  yearsExperience?: number | null;
}) {
  const [existing] = await db.select().from(coreProfiles).where(eq(coreProfiles.userId, params.userId)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreProfiles)
      .set({
        firstName: params.firstName ?? existing.firstName,
        lastName: params.lastName ?? existing.lastName,
        avatarUrl: params.avatarUrl ?? existing.avatarUrl,
        bio: params.bio ?? existing.bio,
        credentials: params.credentials ?? existing.credentials,
        services: params.services ?? existing.services,
        workGalleryPhotos: params.workGalleryPhotos ?? existing.workGalleryPhotos,
        specializations: params.specializations ?? existing.specializations,
        city: params.city ?? existing.city,
        state: params.state ?? existing.state,
        country: params.country ?? existing.country,
        website: params.website ?? existing.website,
        instagram: params.instagram ?? existing.instagram,
        yearsExperience: params.yearsExperience ?? existing.yearsExperience,
        updatedAt: new Date(),
      })
      .where(eq(coreProfiles.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreProfiles)
    .values({
      userId: params.userId,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      avatarUrl: params.avatarUrl ?? null,
      bio: params.bio ?? null,
      credentials: params.credentials ?? null,
      services: params.services ?? null,
      workGalleryPhotos: params.workGalleryPhotos ?? [],
      specializations: params.specializations ?? [],
      city: params.city ?? null,
      state: params.state ?? null,
      country: params.country ?? null,
      website: params.website ?? null,
      instagram: params.instagram ?? null,
      yearsExperience: params.yearsExperience ?? null,
    })
    .returning();

  return { record: created, created: true };
}
