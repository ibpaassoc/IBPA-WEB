import { requireDb } from "@/lib/db";
import type { User as LegacyUser } from "@/lib/schema";
import { resolveUserRole, ensureCanonicalUser } from "@/features/users/server/user.service";
import { hydrateLegacyMemberImage, listCanonicalPublicMemberRows, listLegacyPublicMemberRows, saveLegacyDashboardProfile, upsertCanonicalProfile } from "./profile.repository";
import type { CanonicalPublicMemberRow, DashboardProfileSaveInput, LegacyPublicMemberRow, PublicMemberDirectoryItem } from "./profile.types";

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

function mapLegacyRow(record: LegacyPublicMemberRow): PublicMemberDirectoryItem {
  const payload = asPayload(record.applicationPayload);
  const firstName = firstNonEmpty(record.firstName, payload.firstName, record.fullName.split(" ")[0]);
  const lastName = firstNonEmpty(record.lastName, payload.lastName);
  const applicationSpecializations = stringArray(payload.specialization);
  const specializationOther = firstNonEmpty(payload.specializationOther);
  const profileSpecialization = firstNonEmpty(record.specialization);
  const businessSpecialization = firstNonEmpty(payload.bizType, payload.brandType);
  const specializations = uniqueStrings([
    ...applicationSpecializations,
    ...(specializationOther ? [specializationOther] : []),
    ...(applicationSpecializations.length === 0 && profileSpecialization ? [profileSpecialization] : []),
    ...(applicationSpecializations.length === 0 && !profileSpecialization && businessSpecialization ? [businessSpecialization] : []),
  ]);
  const achievementSummary = firstNonEmpty(
    payload.achievementsDesc,
    joinTruthy([payload.competitionName, payload.competitionYear, payload.competitionResult]),
    payload.publicationsLinks,
  );
  const contributionSummary = firstNonEmpty(
    payload.contributionDesc,
    payload.professionalCommunityYesNo === "Yes" ? "Active in a professional community" : "",
    joinTruthy([payload.otherOrganizationName, payload.otherOrganizationStatus, payload.otherOrganizationYears]),
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
    title: specializations.join(", ") || "IBPA Member",
    specializations,
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
  if (canonicalRows.length > 0) {
    return canonicalRows.map(mapCanonicalRow);
  }

  const legacyRows = await listLegacyPublicMemberRows(db);
  const hydratedRows = await Promise.all(legacyRows.map((row) => hydrateLegacyMemberImage(db, row)));
  const uniqueMembers = new Map<string, PublicMemberDirectoryItem>();

  for (const row of hydratedRows) {
    const key = row.email.trim().toLowerCase();
    if (!uniqueMembers.has(key)) {
      uniqueMembers.set(key, mapLegacyRow(row));
    }
  }

  return Array.from(uniqueMembers.values());
}

export async function saveDashboardProfile(db: DbClient, input: DashboardProfileSaveInput) {
  const savedLegacy = await saveLegacyDashboardProfile(db, input);

  const { record: canonicalUser } = await ensureCanonicalUser(db, {
    clerkId: input.clerkUserId,
    email: input.email,
    role: resolveUserRole({
      accountType: input.legacyOrder?.accountType,
      applicantType: input.legacyOrder?.applicantType,
    }),
    status: "ACTIVE",
  });

  const payload = savedLegacy.nextApplicationPayload;
  const specializations = uniqueStrings([
    textValue(input.specialization),
    ...stringArray(payload.specialization),
    textValue(payload.specializationOther),
  ]);

  await upsertCanonicalProfile(db, {
    userId: canonicalUser.id,
    firstName: input.firstName ?? savedLegacy.existingUser?.firstName ?? null,
    lastName: input.lastName ?? savedLegacy.existingUser?.lastName ?? null,
    avatarUrl: input.imageUrl ?? savedLegacy.existingUser?.imageUrl ?? null,
    bio: input.bio ?? savedLegacy.existingUser?.bio ?? null,
    credentials: input.education ?? savedLegacy.existingUser?.education ?? null,
    services: textValue(payload.bizServices) || null,
    workGalleryPhotos: stringArray(payload.portfolioImages),
    specializations,
    city: input.city ?? savedLegacy.existingUser?.city ?? null,
    country: input.country ?? savedLegacy.existingUser?.country ?? null,
    website: textValue(payload.websiteLink) || null,
    instagram: input.instagramUrl ?? savedLegacy.existingUser?.instagramUrl ?? null,
    yearsExperience: parseYearsExperience(input.experienceYears ?? payload.yearsExperience ?? savedLegacy.existingUser?.experienceYears),
  });

  return {
    nextApplicationPayload: savedLegacy.nextApplicationPayload,
  };
}

export async function syncLegacyUserProfile(db: DbClient, params: {
  canonicalUserId: string;
  legacyUser: LegacyUser;
  applicationPayload?: unknown;
}) {
  const payload = asPayload(params.applicationPayload);

  return upsertCanonicalProfile(db, {
    userId: params.canonicalUserId,
    firstName: params.legacyUser.firstName ?? null,
    lastName: params.legacyUser.lastName ?? null,
    avatarUrl: params.legacyUser.imageUrl ?? null,
    bio: params.legacyUser.bio ?? null,
    credentials: params.legacyUser.education ?? null,
    services: textValue(payload.bizServices) || null,
    workGalleryPhotos: stringArray(payload.portfolioImages),
    specializations: uniqueStrings([
      textValue(params.legacyUser.specialization),
      ...stringArray(payload.specialization),
      textValue(payload.specializationOther),
    ]),
    city: params.legacyUser.city ?? null,
    country: params.legacyUser.country ?? null,
    website: textValue(payload.websiteLink) || null,
    instagram: params.legacyUser.instagramUrl ?? null,
    yearsExperience: parseYearsExperience(params.legacyUser.experienceYears),
  });
}
