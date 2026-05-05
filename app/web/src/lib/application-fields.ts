import { getMembershipCategory, membershipConfigById } from "@/lib/membership";

export const applicationFieldLabels = {
  portfolioImages: "Portfolio images",
  trainerEducationPlanFiles: "Education Plan / Methodology",
  trainerCertificateFiles: "Certificate",
  trainerExperienceProofFiles: "Proof of educator experience",
  membershipCategory: "Membership category",
  applicantType: "Applicant type",
  firstName: "First name",
  lastName: "Last name",
  dateOfBirth: "Date of birth",
  email: "Email",
  phone: "Phone",
  citizenship: "Citizenship",
  streetAddress: "Address",
  city: "City",
  state: "State / Region",
  zipCode: "ZIP / Postal code",
  country: "Country",
  yearsExperience: "Years of experience",
  professionalDesc: "Professional description",
  workSetting: "Work setting",
  placeOfWork: "Place of work",
  workingJurisdictions: "Working jurisdictions",
  educationDesc: "Professional training and qualifications",
  schoolName: "Key educational program / lead educator",
  educationDates: "Education dates",
  hasLicense: "Professional license",
  licenseNumber: "License number",
  additionalEducation: "Additional professional qualifications",
  specialization: "Subcategory / Specialization",
  specializationOther: "Other specialization",
  studentSchool: "School / Academy",
  studentProgName: "Program name",
  studentStartDate: "Start date",
  studentEndDate: "Expected graduation",
  studentMotivation: "Specialist motivation",
  educatorRole: "Educator role",
  educatorSubjects: "Subjects taught",
  educatorYears: "Teaching years",
  educatorFormat: "Training format",
  studentCount: "Approximate student count",
  bizName: "Business name",
  bizType: "Business type",
  bizYear: "Year established",
  bizTeamSize: "Team size",
  bizServices: "Main services",
  brandName: "Brand / company name",
  brandYear: "Year established",
  brandMarket: "Market / geography",
  brandType: "Brand type",
  achievementsYesNo: "Professional achievements",
  achievementsDesc: "Describe your achievements",
  competitionsYesNo: "Competition participation",
  competitionName: "Competition name",
  competitionYear: "Competition year",
  competitionResult: "Competition result",
  speakerEducatorJudge: "Speaker / educator / judge",
  publicationsYesNo: "Publications and media",
  publicationsLinks: "Publication links",
  professionalCommunityYesNo: "Professional community participation",
  otherOrganizationsYesNo: "Other professional organizations",
  otherOrganizationName: "Organization name",
  otherOrganizationStatus: "Membership status",
  otherOrganizationYears: "Membership years",
  instagramLink: "Instagram",
  websiteLink: "Website",
  linkedinLink: "LinkedIn",
  portfolioLink: "Portfolio",
  whyJoin: "Why IBPA",
  contributionDesc: "Industry contribution",
  legalName: "Full legal name",
  signature: "Electronic signature",
  certifyTrue: "Information is accurate",
  understandReview: "Understands review process",
  agreeStandards: "Agrees to professional standards",
  privacyConsent: "Personal data processing consent",
} as const;

export type ApplicationFieldKey = keyof typeof applicationFieldLabels;

const applicationValueLabels: Partial<Record<ApplicationFieldKey, Record<string, string>>> = {
  membershipCategory: {
    Specialist: "Specialist",
    Student: "Specialist",
    Professional: "Professional",
    Trainer: "Trainer / Educator",
    Business: "Business Owner",
    Brand: "Brand Member",
  },
  applicantType: {
    Individual: "Individual",
    Business: "Business",
    School: "School",
    Brand: "Brand",
  },
  hasLicense: {
    Yes: "Yes, licensed",
    No: "No, not licensed",
    "Not required": "Not required in my jurisdiction",
  },
  yearsExperience: {
    "<1": "Less than 1 year",
    "1-2": "1-2 years",
    "3-5": "3-5 years",
    "5-10": "5-10 years",
    "10+": "10+ years",
  },
  workSetting: {
    Independent: "Independent",
    "Salon / Studio": "Salon / Studio",
    "Academy / School": "Academy / School",
    "Brand / Company": "Brand / Company",
    Other: "Other",
  },
  educatorFormat: {
    Offline: "Offline",
    Online: "Online",
    Both: "Both",
  },
  achievementsYesNo: {
    Yes: "Yes",
    No: "No",
  },
  competitionsYesNo: {
    Yes: "Yes",
    No: "No",
  },
  speakerEducatorJudge: {
    Yes: "Yes",
    No: "No",
  },
  publicationsYesNo: {
    Yes: "Yes",
    No: "No",
  },
  professionalCommunityYesNo: {
    Yes: "Yes",
    No: "No",
  },
  otherOrganizationsYesNo: {
    Yes: "Yes",
    No: "No",
  },
};

export const applicationSectionTitles = {
  summary: "Summary",
  contact: "Contact details",
  professional: "Professional experience",
  category: "Category details",
  links: "Links and motivation",
  legal: "Legal agreement",
} as const;

export function getApplicationFieldLabel(key: string) {
  return applicationFieldLabels[key as ApplicationFieldKey] ?? humanizeKey(key);
}

export function formatApplicationValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatApplicationValue(key, item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (key === "membershipCategory") {
      const category = getMembershipCategory(trimmed);
      return category ? membershipConfigById[category].title : formatMappedValue(key, trimmed);
    }

    return formatMappedValue(key, trimmed);
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([entryKey, entryValue]) => {
        const formatted = formatApplicationValue(entryKey, entryValue);
        return formatted ? `${getApplicationFieldLabel(entryKey)}: ${formatted}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }

  return String(value);
}

function formatMappedValue(key: string, value: string) {
  return applicationValueLabels[key as ApplicationFieldKey]?.[value] ?? value;
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}
