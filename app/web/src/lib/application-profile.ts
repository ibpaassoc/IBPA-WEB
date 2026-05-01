export type MembershipCategory = "Specialist" | "Student" | "Professional" | "Trainer" | "Business" | "Brand" | null | undefined;

export type ApplicationPayload = Record<string, unknown> | null | undefined;

export type CombinedProfileData = {
  imageUrl?: string | null;
  bio?: string | null;
  specialization?: string | null;
  experienceYears?: string | null;
  education?: string | null;
  instagramUrl?: string | null;
  country?: string | null;
  city?: string | null;
  membershipCategory?: MembershipCategory;
  applicantType?: string | null;
  orderId?: string | null;
  applicationPayload?: ApplicationPayload;
};

type SnapshotItem = {
  label: string;
  value: string;
};

export type EditableField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
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

export function getApplicationPayload(profile: CombinedProfileData) {
  return (profile.applicationPayload && typeof profile.applicationPayload === "object"
    ? profile.applicationPayload
    : {}) as Record<string, unknown>;
}

export function getMasterRole(profile: CombinedProfileData) {
  const payload = getApplicationPayload(profile);

  return (
    textValue(payload.specialization) ||
    textValue(payload.currentPosition) ||
    textValue(profile.specialization) ||
    textValue(payload.bizType) ||
    textValue(payload.brandType) ||
    textValue(payload.educatorRole) ||
    "Not specified"
  );
}

export function getLocation(profile: CombinedProfileData) {
  const payload = getApplicationPayload(profile);
  const city = textValue(payload.city) || textValue(profile.city);
  const country = textValue(payload.country) || textValue(profile.country);

  if (city && country) return `${city}, ${country}`;
  return city || country || "Location pending";
}

export function getProfileBadges(profile: CombinedProfileData, status: string, membershipLabel: string) {
  const payload = getApplicationPayload(profile);
  const role = getMasterRole(profile);
  const years = textValue(payload.yearsExperience) || textValue(profile.experienceYears);

  return [
    membershipLabel.replace(" Membership", ""),
    years ? `${years} experience` : role,
    status === "paid" ? "Certificate Active" : status === "approved" ? "Awaiting Payment" : "Under Review",
  ];
}

export function getSnapshotItems(profile: CombinedProfileData): SnapshotItem[] {
  const payload = getApplicationPayload(profile);
  const membership = profile.membershipCategory;

  const sharedExperience = textValue(payload.yearsExperience) || textValue(profile.experienceYears) || "Not provided";
  const sharedEducation = textValue(payload.educationDesc) || textValue(profile.education) || "Not provided";

  switch (membership) {
    case "Specialist":
    case "Student":
      return [
        { label: "Experience", value: sharedExperience },
        {
          label: "Education",
          value: [textValue(payload.studentSchool), textValue(payload.studentProgName)].filter(Boolean).join(" • ") || sharedEducation,
        },
        { label: "Program End", value: textValue(payload.studentEndDate) || "Not provided" },
        { label: "Goal", value: textValue(payload.studentMotivation) || "Not provided" },
      ];
    case "Professional":
      return [
        { label: "Experience", value: sharedExperience },
        { label: "Education", value: sharedEducation },
        {
          label: "Achievements",
          value:
            textValue(payload.achievementsDesc) ||
            [textValue(payload.competitionName), textValue(payload.competitionYear), textValue(payload.competitionResult)].filter(Boolean).join(" • ") ||
            textValue(payload.publicationsLinks) ||
            "Not provided",
        },
        {
          label: "Industry",
          value:
            textValue(payload.contributionDesc) ||
            (textValue(payload.professionalCommunityYesNo) ? `Community: ${textValue(payload.professionalCommunityYesNo)}` : "") ||
            "Not provided",
        },
      ];
    case "Trainer":
      return [
        { label: "Experience", value: sharedExperience },
        { label: "Education", value: textValue(payload.educatorSubjects) || sharedEducation },
        {
          label: "Achievements",
          value:
            textValue(payload.achievementsDesc) ||
            [textValue(payload.competitionName), textValue(payload.competitionYear), textValue(payload.competitionResult)].filter(Boolean).join(" • ") ||
            textValue(payload.publicationsLinks) ||
            textValue(payload.studentCount) ||
            "Not provided",
        },
        {
          label: "Industry",
          value:
            textValue(payload.contributionDesc) ||
            (textValue(payload.professionalCommunityYesNo) ? `Community: ${textValue(payload.professionalCommunityYesNo)}` : "") ||
            "Not provided",
        },
      ];
    case "Business":
      return [
        { label: "Experience", value: sharedExperience },
        { label: "Education", value: textValue(payload.bizType) || "Business profile" },
        {
          label: "Achievements",
          value:
            textValue(payload.achievementsDesc) ||
            [textValue(payload.competitionName), textValue(payload.competitionYear), textValue(payload.competitionResult)].filter(Boolean).join(" • ") ||
            textValue(payload.publicationsLinks) ||
            textValue(payload.bizTeamSize) ||
            textValue(payload.bizYear) ||
            "Not provided",
        },
        {
          label: "Industry",
          value:
            textValue(payload.contributionDesc) ||
            (textValue(payload.otherOrganizationName) ? textValue(payload.otherOrganizationName) : "") ||
            "Not provided",
        },
      ];
    case "Brand":
      return [
        { label: "Experience", value: sharedExperience },
        { label: "Education", value: textValue(payload.brandType) || "Brand profile" },
        { label: "Certificates", value: textValue(payload.brandMarket) || "Market information listed" },
        { label: "Achievements", value: textValue(payload.brandYear) || "Not provided" },
      ];
    default:
      return [
        { label: "Experience", value: sharedExperience },
        { label: "Education", value: sharedEducation },
        { label: "Certificates", value: textValue(payload.specialization) || "Not provided" },
        { label: "Achievements", value: textValue(payload.contributionDesc) || "Not provided" },
      ];
  }
}

export function getEditableFields(membership: MembershipCategory): EditableField[] {
  const shared: EditableField[] = [
    { key: "phone", label: "Phone", placeholder: "Your phone number" },
    { key: "country", label: "Country", placeholder: "Country" },
    { key: "city", label: "City", placeholder: "City" },
    { key: "currentPosition", label: "Professional Role", placeholder: "Role / title" },
    { key: "yearsExperience", label: "Experience", placeholder: "e.g. 6 years" },
    { key: "instagramLink", label: "Instagram", placeholder: "https://instagram.com/..." },
    { key: "whyJoin", label: "Why IBPA", type: "textarea", placeholder: "Why do you want to be part of IBPA?" },
    { key: "contributionDesc", label: "Industry Contribution", type: "textarea", placeholder: "How do you contribute to the beauty industry?" },
  ];

  const byCategory: Record<string, EditableField[]> = {
    Specialist: [
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "studentSchool", label: "School", placeholder: "Your school" },
      { key: "studentProgName", label: "Program", placeholder: "Program name" },
      { key: "studentEndDate", label: "Graduation Date", type: "date" },
      { key: "studentMotivation", label: "Specialist Motivation", type: "textarea" },
    ],
    Professional: [
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "professionalDesc", label: "Professional Summary", type: "textarea" },
      { key: "specialization", label: "Specialization", placeholder: "Brows, lashes, esthetician..." },
      { key: "workingJurisdictions", label: "Jurisdictions / License", placeholder: "States, countries, licenses" },
      { key: "portfolioLink", label: "Portfolio", placeholder: "https://..." },
      { key: "achievementsYesNo", label: "Professional Achievements", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "achievementsDesc", label: "Achievements Details", type: "textarea", placeholder: "Awards, competitions, talks, publications..." },
      { key: "competitionsYesNo", label: "Competition Participation", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "competitionName", label: "Competition Name", placeholder: "Event name" },
      { key: "competitionYear", label: "Competition Year", placeholder: "2024" },
      { key: "competitionResult", label: "Competition Result", placeholder: "Winner, finalist..." },
      { key: "speakerEducatorJudge", label: "Speaker / Educator / Judge", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "publicationsYesNo", label: "Publications / Media", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "publicationsLinks", label: "Publication Links", type: "textarea", placeholder: "Paste links here" },
    ],
    Trainer: [
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "professionalDesc", label: "Professional Summary", type: "textarea" },
      { key: "educatorRole", label: "Educator Role", placeholder: "Lead educator" },
      { key: "educatorSubjects", label: "Subjects", type: "textarea" },
      { key: "educatorYears", label: "Teaching Experience", placeholder: "e.g. 5 years" },
      { key: "educatorFormat", label: "Teaching Format", placeholder: "Online / Offline / Both" },
      { key: "studentCount", label: "Student Count", placeholder: "Approximate student count" },
      { key: "websiteLink", label: "Website", placeholder: "https://..." },
      { key: "achievementsYesNo", label: "Professional Achievements", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "achievementsDesc", label: "Achievements Details", type: "textarea", placeholder: "Awards, competitions, talks, publications..." },
      { key: "competitionsYesNo", label: "Competition Participation", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "competitionName", label: "Competition Name", placeholder: "Event name" },
      { key: "competitionYear", label: "Competition Year", placeholder: "2024" },
      { key: "competitionResult", label: "Competition Result", placeholder: "Winner, finalist..." },
      { key: "speakerEducatorJudge", label: "Speaker / Educator / Judge", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "publicationsYesNo", label: "Publications / Media", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "publicationsLinks", label: "Publication Links", type: "textarea", placeholder: "Paste links here" },
    ],
    Business: [
      { key: "bizName", label: "Business Name", placeholder: "Studio or salon name" },
      { key: "bizType", label: "Business Type", placeholder: "Salon, academy..." },
      { key: "bizYear", label: "Established", placeholder: "Year established" },
      { key: "bizTeamSize", label: "Team Size", placeholder: "Number of team members" },
      { key: "bizServices", label: "Services", type: "textarea" },
      { key: "websiteLink", label: "Website", placeholder: "https://..." },
      { key: "achievementsYesNo", label: "Professional Achievements", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "achievementsDesc", label: "Achievements Details", type: "textarea", placeholder: "Awards, competitions, talks, publications..." },
      { key: "competitionsYesNo", label: "Competition Participation", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "competitionName", label: "Competition Name", placeholder: "Event name" },
      { key: "competitionYear", label: "Competition Year", placeholder: "2024" },
      { key: "competitionResult", label: "Competition Result", placeholder: "Winner, finalist..." },
      { key: "speakerEducatorJudge", label: "Speaker / Educator / Judge", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "publicationsYesNo", label: "Publications / Media", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
      { key: "publicationsLinks", label: "Publication Links", type: "textarea", placeholder: "Paste links here" },
    ],
    Brand: [
      { key: "brandName", label: "Brand Name", placeholder: "Brand or company name" },
      { key: "brandType", label: "Brand Type", placeholder: "Product category" },
      { key: "brandYear", label: "Launch Year", placeholder: "Year" },
      { key: "brandMarket", label: "Market", type: "textarea" },
      { key: "websiteLink", label: "Website", placeholder: "https://..." },
    ],
  };

  const categoryKey = membership === "Student" ? "Specialist" : membership || "";
  return [...shared, ...(byCategory[categoryKey] || [])];
}

export function buildEditablePayload(form: Record<string, string>, membership: MembershipCategory) {
  const payload: Record<string, string> = {};
  for (const field of getEditableFields(membership)) {
    payload[field.key] = form[field.key] || "";
  }
  return payload;
}
