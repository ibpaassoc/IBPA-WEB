import { requireDb } from "@/lib/db";
import type { SourceUserRecord } from "@/features/shared/server/source-records";
import { resolveUserRole, ensureCanonicalUser } from "@/features/users/server/user.service";
import { findCanonicalUserByClerkId } from "@/features/users/server/user.repository";
import type { UserRole } from "@/lib/permissions";
import {
  findOrCreateProfileByUserId,
  findProfileByUserId,
  listCanonicalPublicMemberRows,
  updateProfileServicesByUserId,
  upsertCanonicalProfile,
} from "./profile.repository";
import type {
  ProfileService,
  ProfileRecordUpsertInput,
  PublicMemberDirectoryItem,
  PublicProfileDirectoryRow,
} from "./profile.types";

type DbClient = ReturnType<typeof requireDb>;

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function optionalText(value: unknown) {
  const normalized = textValue(value);
  return normalized || null;
}

function normalizeServiceText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

function parseYearsExperience(value: unknown) {
  const normalized = Number.parseInt(textValue(value), 10);
  return Number.isFinite(normalized) ? normalized : null;
}

function createServiceId() {
  return `svc_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeProfileServices(input: unknown): ProfileService[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = normalizeServiceText(record.title);

      if (!title) {
        return null;
      }

      return {
        id: normalizeServiceText(record.id) || createServiceId(),
        title,
        description: normalizeServiceText(record.description),
        price: normalizeServiceText(record.price),
      } satisfies ProfileService;
    })
    .filter((service): service is ProfileService => service !== null);
}

function mapCanonicalRow(record: PublicProfileDirectoryRow): PublicMemberDirectoryItem {
  const firstName = textValue(record.firstName);
  const lastName = textValue(record.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "IBPA Member";
  const city = textValue(record.city);
  const country = textValue(record.country);
  const location = [city, country].filter(Boolean).join(", ");
  const specializations = uniqueStrings(record.specializations ?? []);
  const highlights = uniqueStrings([
    textValue(record.credentials),
    textValue(record.achievements),
    textValue(record.industryContribution),
  ]).slice(0, 3);

  return {
    id: record.id,
    fullName,
    firstName,
    lastName,
    membershipCategory: record.membershipType,
    applicantType: record.role,
    title: specializations.join(", ") || "IBPA Member",
    specializations,
    description: textValue(record.bio),
    experience: record.yearsExperience != null ? String(record.yearsExperience) : "",
    location,
    city,
    country,
    avatarUrl: record.avatarUrl,
    instagramUrl: textValue(record.instagram) || null,
    websiteUrl: textValue(record.website) || null,
    portfolioImages: record.workGalleryPhotos ?? [],
    highlights,
    memberSince: (record.memberSince ?? record.createdAt).toISOString(),
  };
}

export async function listPublicProfiles(db: DbClient) {
  const canonicalRows = await listCanonicalPublicMemberRows(db);
  return canonicalRows.map(mapCanonicalRow);
}

export async function saveOwnedProfileRecord(db: DbClient, input: ProfileRecordUpsertInput) {
  const { record: canonicalUser } = await ensureCanonicalUser(db, {
    clerkId: input.clerkUserId,
    email: input.email,
    role: resolveUserRole({ role: input.currentRole }),
    status: "ACTIVE",
  });

  const specializations = uniqueStrings([
    ...(Array.isArray(input.specializations) ? input.specializations : []),
  ]);
  const websiteUrl = optionalText(input.websiteUrl);
  const instagramUrl = optionalText(input.instagramUrl);
  const country = optionalText(input.country);
  const state = optionalText(input.state);
  const city = optionalText(input.city);
  const yearsExperience = textValue(input.experienceYears);
  const education = optionalText(input.education);
  const portfolioImages = Array.isArray(input.portfolioImages)
    ? uniqueStrings(input.portfolioImages)
    : [];

  const { record } = await upsertCanonicalProfile(db, {
    userId: canonicalUser.id,
    firstName: optionalText(input.firstName),
    lastName: optionalText(input.lastName),
    phone: optionalText(input.phone),
    avatarUrl: optionalText(input.imageUrl),
    bio: optionalText(input.bio),
    credentials: education,
    achievements: optionalText(input.achievements),
    industryContribution: optionalText(input.industryContribution),
    workGalleryPhotos: portfolioImages,
    specializations,
    city,
    state,
    country,
    website: websiteUrl,
    instagram: instagramUrl,
    yearsExperience: parseYearsExperience(yearsExperience),
  });

  return {
    profile: record,
  };
}

export async function ensureOwnedProfileRecord(db: DbClient, params: {
  clerkUserId: string;
  email: string;
  currentRole?: UserRole | null;
}) {
  const { record: canonicalUser } = await ensureCanonicalUser(db, {
    clerkId: params.clerkUserId,
    email: params.email,
    role: resolveUserRole({ role: params.currentRole }),
    status: "ACTIVE",
  });

  return findOrCreateProfileByUserId(db, canonicalUser.id);
}

export async function saveProfileServices(input: {
  clerkUserId: string;
  services: ProfileService[];
}) {
  const db = requireDb();
  const canonicalUser = await findCanonicalUserByClerkId(db, input.clerkUserId);

  if (!canonicalUser) {
    throw new Error("User not found for the authenticated Clerk account.");
  }

  const profile = await findProfileByUserId(db, canonicalUser.id);
  if (!profile) {
    throw new Error("Profile not found for the authenticated user.");
  }

  const services = normalizeProfileServices(input.services);

  const updated = await updateProfileServicesByUserId(db, canonicalUser.id, services);

  if (!updated) {
    throw new Error("Unable to update profile services.");
  }

  return { services: updated.services ?? [] };
}

export async function importSourceUserProfile(db: DbClient, params: {
  canonicalUserId: string;
  sourceUser: SourceUserRecord;
  applicationPayload?: unknown;
}) {
  const payload = asPayload(params.applicationPayload);

  return upsertCanonicalProfile(db, {
    userId: params.canonicalUserId,
    firstName: params.sourceUser.firstName ?? null,
    lastName: params.sourceUser.lastName ?? null,
    phone: textValue(payload.phone) || null,
    avatarUrl: params.sourceUser.imageUrl ?? null,
    bio: params.sourceUser.bio ?? null,
    credentials: params.sourceUser.education ?? null,
    achievements: textValue(payload.achievementsDesc) || null,
    industryContribution: textValue(payload.contributionDesc) || null,
    workGalleryPhotos: stringArray(payload.portfolioImages),
    specializations: uniqueStrings([
      textValue(params.sourceUser.specialization),
      ...stringArray(payload.specialization),
      textValue(payload.specializationOther),
    ]),
    city: params.sourceUser.city ?? null,
    country: params.sourceUser.country ?? null,
    website: textValue(payload.websiteLink) || null,
    instagram: params.sourceUser.instagramUrl ?? null,
    yearsExperience: parseYearsExperience(params.sourceUser.experienceYears),
  });
}
