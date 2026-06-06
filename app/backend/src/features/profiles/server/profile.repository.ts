import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreMemberships, coreProfiles, coreUsers } from "@/lib/schema";
import type { ProfileService, PublicProfileDirectoryRow } from "./profile.types";

type DbClient = ReturnType<typeof requireDb>;

export async function listCanonicalPublicMemberRows(db: DbClient): Promise<PublicProfileDirectoryRow[]> {
  return db
    .select({
      id: coreUsers.id,
      membershipType: coreMemberships.type,
      memberSince: coreMemberships.startedAt,
      email: coreUsers.email,
      role: coreUsers.role,
      firstName: coreProfiles.firstName,
      lastName: coreProfiles.lastName,
      phone: coreProfiles.phone,
      avatarUrl: coreProfiles.avatarUrl,
      bio: coreProfiles.bio,
      credentials: coreProfiles.credentials,
      achievements: coreProfiles.achievements,
      industryContribution: coreProfiles.industryContribution,
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

export async function upsertCanonicalProfile(db: DbClient, params: {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  credentials?: string | null;
  achievements?: string | null;
  industryContribution?: string | null;
  services?: ProfileService[] | null;
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
        firstName: params.firstName !== undefined ? params.firstName : existing.firstName,
        lastName: params.lastName !== undefined ? params.lastName : existing.lastName,
        phone: params.phone !== undefined ? params.phone : existing.phone,
        avatarUrl: params.avatarUrl !== undefined ? params.avatarUrl : existing.avatarUrl,
        bio: params.bio !== undefined ? params.bio : existing.bio,
        credentials: params.credentials !== undefined ? params.credentials : existing.credentials,
        achievements: params.achievements !== undefined ? params.achievements : existing.achievements,
        industryContribution: params.industryContribution !== undefined ? params.industryContribution : existing.industryContribution,
        services: params.services !== undefined ? params.services : existing.services ?? [],
        workGalleryPhotos: params.workGalleryPhotos !== undefined ? params.workGalleryPhotos : existing.workGalleryPhotos,
        specializations: params.specializations !== undefined ? params.specializations : existing.specializations,
        city: params.city !== undefined ? params.city : existing.city,
        state: params.state !== undefined ? params.state : existing.state,
        country: params.country !== undefined ? params.country : existing.country,
        website: params.website !== undefined ? params.website : existing.website,
        instagram: params.instagram !== undefined ? params.instagram : existing.instagram,
        yearsExperience: params.yearsExperience !== undefined ? params.yearsExperience : existing.yearsExperience,
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
      phone: params.phone ?? null,
      avatarUrl: params.avatarUrl ?? null,
      bio: params.bio ?? null,
      credentials: params.credentials ?? null,
      achievements: params.achievements ?? null,
      industryContribution: params.industryContribution ?? null,
      services: params.services ?? [],
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

export async function findProfileByUserId(db: DbClient, userId: string) {
  const [profile] = await db
    .select()
    .from(coreProfiles)
    .where(eq(coreProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function findOrCreateProfileByUserId(db: DbClient, userId: string) {
  const existing = await findProfileByUserId(db, userId);
  if (existing) {
    return existing;
  }

  const { record } = await upsertCanonicalProfile(db, { userId });
  return record;
}

export async function updateProfileServicesByUserId(
  db: DbClient,
  userId: string,
  services: ProfileService[],
) {
  const [profile] = await db
    .update(coreProfiles)
    .set({
      services,
      updatedAt: new Date(),
    })
    .where(eq(coreProfiles.userId, userId))
    .returning();

  return profile ?? null;
}
