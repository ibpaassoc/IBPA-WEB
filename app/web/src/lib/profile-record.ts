export type MembershipCategory =
  | "Specialist"
  | "Student"
  | "Professional"
  | "Trainer"
  | "Business"
  | "Brand"
  | "Partner"
  | null
  | undefined;

export type ProfileService = {
  id: string;
  title: string;
  description: string;
  price: string;
};

export type ProfileRecordData = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  achievements?: string | null;
  industryContribution?: string | null;
  specialization?: string | null;
  specializations?: string[] | null;
  experienceYears?: string | null;
  education?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  membershipCategory?: MembershipCategory;
  applicantType?: string | null;
  orderId?: string | null;
  services?: ProfileService[] | null;
  portfolioImages?: string[] | null;
};

export type ProfileSnapshotItem = {
  label: string;
  value: string;
};

function textValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

export function getProfileSpecializationDisplay(profile: ProfileRecordData) {
  const canonicalSpecializations = Array.isArray(profile.specializations)
    ? profile.specializations.filter(Boolean).join(", ")
    : "";

  return canonicalSpecializations || textValue(profile.specialization) || "Not specified";
}

export function getProfileLocation(profile: ProfileRecordData) {
  const city = textValue(profile.city);
  const country = textValue(profile.country);

  if (city && country) return `${city}, ${country}`;
  return city || country || "Location pending";
}

export function getProfileSnapshotItems(profile: ProfileRecordData): ProfileSnapshotItem[] {
  return [
    {
      label: "Experience",
      value: textValue(profile.experienceYears) || "Not provided",
    },
    {
      label: "Education",
      value: textValue(profile.education) || "Not provided",
    },
    {
      label: "Achievements",
      value: textValue(profile.achievements) || "Not provided",
    },
    {
      label: "Industry",
      value:
        textValue(profile.industryContribution) ||
        getProfileSpecializationDisplay(profile),
    },
  ];
}
