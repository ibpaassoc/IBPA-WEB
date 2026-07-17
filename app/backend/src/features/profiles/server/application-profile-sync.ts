import { requireDb } from "@/lib/db";
import type { CoreProfile } from "@/lib/schema";
import { findProfileByUserId, upsertCanonicalProfile } from "./profile.repository";

type DbClient = ReturnType<typeof requireDb>;

/**
 * The subset of an application/order record the profile mapper needs. Both the
 * canonical `coreApplications` row and the backfill script feed this shape in.
 */
export type ApplicationForProfileSync = {
  id?: string | null;
  type?: string | null;
  fullName?: string | null;
  phone?: string | null;
  packageName?: string | null;
  applicationData?: unknown;
};

/**
 * Candidate profile values derived from an application payload. Every scalar is a
 * trimmed string (possibly empty) and every list is a normalized array so the
 * fill logic can reason about "empty vs present" uniformly.
 */
export type ProfileFieldCandidates = {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  credentials: string;
  achievements: string;
  industryContribution: string;
  workGalleryPhotos: string[];
  specializations: string[];
  city: string;
  state: string;
  country: string;
  website: string;
  instagram: string;
  yearsExperience: number | null;
};

// Values commonly stored as filler by imports/UI defaults. When an existing
// profile field holds one of these we still treat it as empty and allow a fill.
const PLACEHOLDER_VALUES = new Set([
  "",
  "-",
  "--",
  "n/a",
  "na",
  "none",
  "not provided",
  "not specified",
  "unknown",
  "ibpa member",
]);

function asPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function joinNonEmpty(values: string[], separator: string): string {
  return values.map((value) => value.trim()).filter(Boolean).join(separator);
}

function parseYearsExperience(value: unknown): number | null {
  const parsed = Number.parseInt(textValue(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }
  const parts = trimmed.split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

/**
 * Light-touch URL normalization: add a scheme to bare domains so links are
 * clickable, but never rewrite links the user already qualified. Non-URL-looking
 * text (e.g. "see my instagram") is returned untouched.
 */
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Looks like a domain (has a dot, no spaces) -> assume https.
  if (/^[^\s]+\.[^\s]+$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Normalize Instagram values without destroying user content. Handles the common
 * "@handle" and bare-handle cases into a full profile URL, keeps existing URLs.
 */
function normalizeInstagram(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/instagram\.com/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }
  const handle = trimmed.replace(/^@/, "");
  // A plausible IG handle: letters, numbers, dots, underscores only.
  if (/^[A-Za-z0-9._]+$/.test(handle)) {
    return `https://instagram.com/${handle}`;
  }
  return trimmed;
}

function isEmptyOrPlaceholder(value: string | null | undefined): boolean {
  if (value == null) return true;
  return PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}

/**
 * Shared mapper: application/order payload -> profile field candidates.
 *
 * Only fields that map to real `coreProfiles` columns are produced. Private
 * application fields (date of birth, street address, citizenship, signature,
 * privacy/review consents, Stripe IDs) are intentionally NOT mapped so they
 * never leak into a public profile.
 */
export function mapApplicationPayloadToProfile(
  application: ApplicationForProfileSync,
): ProfileFieldCandidates {
  const payload = asPayload(application.applicationData);
  const nameFallback = splitFullName(textValue(application.fullName));

  const specializations = uniqueStrings([
    ...stringArray(payload.specialization),
    textValue(payload.specializationOther),
    ...stringArray(payload.brandProductCategories),
    textValue(payload.bizType),
    textValue(payload.brandType),
  ]);

  return {
    firstName: textValue(payload.firstName) || nameFallback.firstName,
    lastName: textValue(payload.lastName) || nameFallback.lastName,
    phone: textValue(payload.phone) || textValue(payload.brandContactPhone) || textValue(application.phone),
    bio:
      textValue(payload.professionalDesc)
      || textValue(payload.professionalBiography)
      || textValue(payload.businessDescription)
      || textValue(payload.brandDescription)
      || textValue(payload.whyJoin),
    credentials: joinNonEmpty(
      [
        textValue(payload.educationDesc),
        textValue(payload.professionalEducation),
        textValue(payload.additionalEducation),
        stringArray(payload.brandCertifications).join(", "),
      ],
      "\n\n",
    ),
    achievements:
      textValue(payload.achievementsDesc)
      || textValue(payload.professionalAchievements)
      || textValue(payload.businessAchievements)
      || textValue(payload.brandAchievements),
    industryContribution:
      textValue(payload.contributionDesc)
      || textValue(payload.businessIndustryContribution)
      || textValue(payload.brandIndustryContribution),
    workGalleryPhotos: uniqueStrings([
      ...stringArray(payload.portfolioImages),
      ...stringArray(payload.businessPortfolioImages),
    ]),
    specializations,
    city: textValue(payload.city) || textValue(payload.businessCity) || textValue(payload.brandCity),
    state: textValue(payload.state),
    country:
      textValue(payload.country)
      || textValue(payload.businessCountry)
      || textValue(payload.brandRegistrationCountry),
    website: normalizeUrl(
      textValue(payload.websiteLink)
      || textValue(payload.portfolioLink)
      || textValue(payload.businessWebsite)
      || textValue(payload.brandWebsite),
    ),
    instagram: normalizeInstagram(
      textValue(payload.instagramLink)
      || textValue(payload.businessInstagram)
      || textValue(payload.brandInstagram),
    ),
    yearsExperience: parseYearsExperience(payload.yearsExperience ?? payload.educatorYears),
  };
}

export type ProfileUpsertUpdate = Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  credentials: string;
  achievements: string;
  industryContribution: string;
  workGalleryPhotos: string[];
  specializations: string[];
  city: string;
  state: string;
  country: string;
  website: string;
  instagram: string;
  yearsExperience: number;
}>;

/**
 * Decide which profile columns to fill. A field is only filled when the payload
 * has a non-empty value AND the existing profile value is missing/empty/placeholder.
 * This never overwrites manually edited data and never blanks a field.
 */
export function computeProfileFill(
  existing: CoreProfile | null,
  candidates: ProfileFieldCandidates,
): { update: ProfileUpsertUpdate; filledFields: string[] } {
  const update: ProfileUpsertUpdate = {};
  const filledFields: string[] = [];

  const fillText = (
    key: keyof ProfileUpsertUpdate,
    candidate: string,
    current: string | null | undefined,
  ) => {
    if (candidate && isEmptyOrPlaceholder(current)) {
      (update as Record<string, unknown>)[key] = candidate;
      filledFields.push(key);
    }
  };

  fillText("firstName", candidates.firstName, existing?.firstName);
  fillText("lastName", candidates.lastName, existing?.lastName);
  fillText("phone", candidates.phone, existing?.phone);
  fillText("bio", candidates.bio, existing?.bio);
  fillText("credentials", candidates.credentials, existing?.credentials);
  fillText("achievements", candidates.achievements, existing?.achievements);
  fillText("industryContribution", candidates.industryContribution, existing?.industryContribution);
  fillText("city", candidates.city, existing?.city);
  fillText("state", candidates.state, existing?.state);
  fillText("country", candidates.country, existing?.country);
  fillText("website", candidates.website, existing?.website);
  fillText("instagram", candidates.instagram, existing?.instagram);

  // Arrays: only fill when the existing list is empty so we never clobber a
  // curated gallery / specialization set.
  if (candidates.specializations.length > 0 && (existing?.specializations?.length ?? 0) === 0) {
    update.specializations = candidates.specializations;
    filledFields.push("specializations");
  }
  if (candidates.workGalleryPhotos.length > 0 && (existing?.workGalleryPhotos?.length ?? 0) === 0) {
    update.workGalleryPhotos = candidates.workGalleryPhotos;
    filledFields.push("workGalleryPhotos");
  }

  // Numeric: only fill when the existing value is unset.
  if (candidates.yearsExperience != null && existing?.yearsExperience == null) {
    update.yearsExperience = candidates.yearsExperience;
    filledFields.push("yearsExperience");
  }

  return { update, filledFields };
}

export type ProfileSyncResult = {
  created: boolean;
  updated: boolean;
  filledFields: string[];
  error?: unknown;
};

/**
 * Populate (never overwrite) a user's profile from a paid/approved application
 * payload. Idempotent: re-running after the fields are filled is a no-op.
 *
 * Failures are logged with only non-sensitive identifiers and swallowed so a
 * profile-sync problem never blocks the surrounding payment/webhook flow.
 */
export async function syncProfileFromApplication(
  db: DbClient,
  params: { userId: string; application: ApplicationForProfileSync },
): Promise<ProfileSyncResult> {
  try {
    const existing = await findProfileByUserId(db, params.userId);
    const candidates = mapApplicationPayloadToProfile(params.application);
    const { update, filledFields } = computeProfileFill(existing, candidates);

    // Nothing to fill and a profile already exists -> leave it untouched.
    if (existing && filledFields.length === 0) {
      return { created: false, updated: false, filledFields: [] };
    }

    const { created } = await upsertCanonicalProfile(db, {
      userId: params.userId,
      ...update,
    });

    if (filledFields.length > 0) {
      console.log("[ProfileSync] Populated profile from application", {
        userId: params.userId,
        applicationId: params.application.id ?? null,
        created,
        filledFields,
      });
    }

    return { created, updated: !created, filledFields };
  } catch (error) {
    console.error("[ProfileSync] Failed to populate profile from application", {
      userId: params.userId,
      applicationId: params.application.id ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
    return { created: false, updated: false, filledFields: [], error };
  }
}
