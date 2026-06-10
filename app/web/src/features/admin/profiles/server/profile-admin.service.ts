import type { AdminClient } from "../../shared/types/admin.types";
import type { AdminProfileRecord, ProfileServiceItem } from "../types/profile-admin.types";

const PROFILE_COMPLETION_FIELDS: Array<keyof AdminClient> = [
  "bio",
  "specialization",
  "experienceYears",
  "education",
  "city",
  "country",
  "avatarUrl",
];

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

export function getProfileCompletion(profile: AdminClient) {
  const completed = PROFILE_COMPLETION_FIELDS.filter((field) => hasValue(profile[field])).length;
  const mediaComplete = hasValue(profile.portfolioImages);
  const serviceComplete = hasValue(profile.services);
  const total = PROFILE_COMPLETION_FIELDS.length + 2;
  const score = Math.round(((completed + (mediaComplete ? 1 : 0) + (serviceComplete ? 1 : 0)) / total) * 100);

  return {
    label: score >= 80 ? "Complete" : "Needs work",
    score,
  };
}

export function toProfileRecord(profile: AdminClient): AdminProfileRecord {
  const completion = getProfileCompletion(profile);

  return {
    ...profile,
    completionLabel: completion.label,
    completionScore: completion.score,
    statusTone: completion.score >= 80 ? "success" : "warning",
  };
}

export function filterProfileRecords(
  profiles: AdminProfileRecord[],
  filters: { completion: "all" | "complete" | "needs_work"; membership: "all" | string },
) {
  return profiles.filter((profile) => {
    if (filters.membership !== "all" && profile.membershipCategory !== filters.membership) {
      return false;
    }

    if (filters.completion === "complete" && profile.completionScore < 80) {
      return false;
    }

    if (filters.completion === "needs_work" && profile.completionScore >= 80) {
      return false;
    }

    return true;
  });
}

export function getProfileServices(profile?: AdminClient | null): ProfileServiceItem[] {
  return Array.isArray(profile?.services) ? profile.services : [];
}

export function getProfileMedia(profile?: AdminClient | null) {
  return Array.isArray(profile?.portfolioImages) ? profile.portfolioImages : [];
}

export function getProfileLocation(profile: AdminClient) {
  return [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Not provided";
}
