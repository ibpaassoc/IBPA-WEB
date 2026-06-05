import { requireDb } from "@/lib/db";
import type { SourceUserRecord } from "@/features/shared/server/source-records";
import { resolveUserRole, ensureCanonicalUser } from "@/features/users/server/user.service";
import { listCanonicalPublicMemberRows, upsertCanonicalProfile } from "./profile.repository";
import type { CanonicalPublicMemberRow, DashboardProfileSaveInput, PublicMemberDirectoryItem } from "./profile.types";

type DbClient = ReturnType<typeof requireDb>;

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
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

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const normalized = textValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function joinTruthy(values: unknown[], separator = " | ") {
  return values
    .map((value) => textValue(value))
    .filter(Boolean)
    .join(separator);
}

function parseYearsExperience(value: unknown) {
  const normalized = Number.parseInt(textValue(value), 10);
  return Number.isFinite(normalized) ? normalized : null;
}

function mapCanonicalRow(record: CanonicalPublicMemberRow): PublicMemberDirectoryItem {
  const firstName = textValue(record.firstName);
  const lastName = textValue(record.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || record.email;
  const city = textValue(record.city);
  const country = textValue(record.country);
  const location = [city, country].filter(Boolean).join(", ");
  const specializations = uniqueStrings(record.specializations ?? []);
  const highlights = uniqueStrings([
    textValue(record.credentials),
    textValue(record.services),
    textValue(record.state),
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

export async function saveDashboardProfile(db: DbClient, input: DashboardProfileSaveInput) {
  const { record: canonicalUser } = await ensureCanonicalUser(db, {
    clerkId: input.clerkUserId,
    email: input.email,
    role: resolveUserRole({ role: input.currentRole }),
    status: "ACTIVE",
  });

  const payload =
    input.applicationPayload && typeof input.applicationPayload === "object"
      ? input.applicationPayload
      : {};
  const specializations = uniqueStrings([
    textValue(input.specialization),
    ...stringArray(payload.specialization),
    textValue(payload.specializationOther),
  ]);

  await upsertCanonicalProfile(db, {
    userId: canonicalUser.id,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    avatarUrl: input.imageUrl ?? null,
    bio: input.bio ?? null,
    credentials: input.education ?? null,
    services: textValue(payload.bizServices) || null,
    workGalleryPhotos: stringArray(payload.portfolioImages),
    specializations,
    city: input.city ?? null,
    country: input.country ?? null,
    website: textValue(payload.websiteLink) || null,
    instagram: input.instagramUrl ?? null,
    yearsExperience: parseYearsExperience(input.experienceYears ?? payload.yearsExperience),
  });

  return {
    nextApplicationPayload: payload,
  };
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
    avatarUrl: params.sourceUser.imageUrl ?? null,
    bio: params.sourceUser.bio ?? null,
    credentials: params.sourceUser.education ?? null,
    services: textValue(payload.bizServices) || null,
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
