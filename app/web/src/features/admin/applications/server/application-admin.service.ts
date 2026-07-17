import {
  applicationSectionTitles,
  formatApplicationValue,
  getApplicationFieldLabel,
} from "@/lib/application-fields";

import type {
  AdminApplicationPaymentStatus,
  AdminApplicationRecord,
  AdminApplicationStatusFilter,
  AdminApplicationKind,
  ApplicationFieldSection,
  ApplicationFileGroup,
  ApplicationQueueResponse,
  MemberApplicationDetail,
  OrderStatus,
  PartnerApplicationDetail,
  PartnerApplicationStatus,
  PartnerPaymentStatus,
} from "../types/application-admin.types";
import {
  listMemberApplications,
  listPartnerApplications,
} from "./application-admin.repository";

const MEMBER_STATUS_LABELS: Record<OrderStatus, string> = {
  approved: "Approved",
  paid: "Paid",
  pending: "Pending",
  rejected: "Rejected",
  review: "Additional review",
};

const MEMBER_STATUS_TONES: Record<OrderStatus, AdminApplicationRecord["statusTone"]> = {
  approved: "info",
  paid: "success",
  pending: "warning",
  rejected: "danger",
  review: "warning",
};

const PARTNER_STATUS_LABELS: Record<PartnerApplicationStatus, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
  SUBMITTED: "Submitted",
};

const PARTNER_STATUS_TONES: Record<PartnerApplicationStatus, AdminApplicationRecord["statusTone"]> = {
  APPROVED: "info",
  PENDING: "warning",
  REJECTED: "danger",
  SUBMITTED: "success",
};

function payloadOf(application: MemberApplicationDetail) {
  return application.applicationPayload && typeof application.applicationPayload === "object"
    ? (application.applicationPayload as Record<string, unknown>)
    : {};
}

export function getMemberPaymentStatus(application: MemberApplicationDetail): {
  status: AdminApplicationPaymentStatus;
  label: string;
  tone: AdminApplicationRecord["paymentStatusTone"];
} {
  if (application.status === "paid") {
    return { label: "Paid", status: "paid", tone: "success" };
  }

  if (application.status === "approved" || application.checkoutUrl || application.stripeSessionId) {
    return { label: "Payment pending", status: "pending", tone: "warning" };
  }

  return { label: "Not requested", status: "not_requested", tone: "neutral" };
}

export function getPartnerPaymentStatus(status: PartnerPaymentStatus): {
  status: AdminApplicationPaymentStatus;
  label: string;
  tone: AdminApplicationRecord["paymentStatusTone"];
} {
  switch (status) {
    case "PAID":
      return { label: "Paid", status: "paid", tone: "success" };
    case "FAILED":
      return { label: "Failed", status: "failed", tone: "danger" };
    case "PENDING":
      return { label: "Pending", status: "pending", tone: "warning" };
    case "UNPAID":
    default:
      return { label: "Not requested", status: "not_requested", tone: "neutral" };
  }
}

export function toMemberApplicationRecord(application: MemberApplicationDetail): AdminApplicationRecord {
  const payment = getMemberPaymentStatus(application);
  const payload = payloadOf(application);

  return {
    applicantEmail: application.email,
    applicantName: application.name || application.email,
    applicantType:
      application.applicantType ||
      (typeof payload.applicantType === "string" ? payload.applicantType : "Member"),
    id: application.id,
    kind: "member",
    membershipPackage: application.membershipCategory || "Not selected",
    paymentStatus: payment.status,
    paymentStatusLabel: payment.label,
    paymentStatusTone: payment.tone,
    raw: application,
    status: application.status,
    statusLabel: MEMBER_STATUS_LABELS[application.status],
    statusTone: MEMBER_STATUS_TONES[application.status],
    submittedAt: application.createdAt,
  };
}

export function toPartnerApplicationRecord(application: PartnerApplicationDetail): AdminApplicationRecord {
  const payment = getPartnerPaymentStatus(application.paymentStatus);

  return {
    applicantEmail: application.email,
    applicantName: application.name || application.email,
    applicantType: "Partner",
    id: application.id,
    kind: "partner",
    membershipPackage: application.requestedTier || "Partner",
    paymentStatus: payment.status,
    paymentStatusLabel: payment.label,
    paymentStatusTone: payment.tone,
    raw: application,
    status: application.status.toLowerCase(),
    statusLabel: PARTNER_STATUS_LABELS[application.status],
    statusTone: PARTNER_STATUS_TONES[application.status],
    submittedAt: application.createdAt,
  };
}

export async function listApplicationQueue(params: { q?: string } = {}): Promise<ApplicationQueueResponse> {
  const [members, partners] = await Promise.all([
    listMemberApplications({ limit: 100, q: params.q }),
    listPartnerApplications({ limit: 100, q: params.q }),
  ]);

  const records = [
    ...(Array.isArray(members.items) ? members.items.map(toMemberApplicationRecord) : []),
    ...(Array.isArray(partners.items) ? partners.items.map(toPartnerApplicationRecord) : []),
  ].sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());

  return {
    hasMoreMembers: Boolean(members.hasMore),
    hasMorePartners: Boolean(partners.hasMore),
    memberTotal: Number(members.total) || 0,
    partnerTotal: Number(partners.total) || 0,
    records,
  };
}

export function filterApplicationRecords(
  records: AdminApplicationRecord[],
  filters: {
    applicantType: "all" | AdminApplicationKind;
    paymentStatus: "all" | AdminApplicationPaymentStatus;
    status: AdminApplicationStatusFilter;
  },
) {
  return records.filter((record) => {
    if (filters.applicantType !== "all" && record.kind !== filters.applicantType) {
      return false;
    }

    if (filters.paymentStatus !== "all" && record.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    if (filters.status !== "all" && record.status !== filters.status) {
      return false;
    }

    return true;
  });
}

export function buildMemberApplicationSections(application: MemberApplicationDetail) {
  const payload = payloadOf(application);
  const membershipCategory = typeof payload.membershipCategory === "string"
    ? payload.membershipCategory
    : application.membershipCategory;

  if (membershipCategory === "Business") {
    return buildSections(payload, [
      { title: applicationSectionTitles.summary, fields: ["membershipCategory", "applicantType", "businessCurrentPosition", "yearsExperience"] },
      { title: "Applicant information", fields: ["firstName", "lastName", "preferredName", "dateOfBirth", "email", "phone", "country", "city"] },
      { title: "Professional information", fields: ["professionalBiography", "professionalExperience", "professionalEducation", "professionalAchievements"] },
      {
        title: "Business information",
        fields: [
          "bizName", "bizType", "bizTypeOther", "bizYear", "businessCountry", "businessCity", "businessAddress",
          "businessWebsite", "businessInstagram", "businessFacebook", "businessTikTok", "businessLinkedIn", "businessYouTube",
          "businessOtherSocial", "bizTeamSize", "businessDescription", "bizServices", "businessAchievements", "businessMission",
          "businessIndustryContribution",
        ],
      },
      {
        title: "Public presence",
        fields: [
          "businessMediaFeatured", "businessMediaDescription", "businessPublications", "businessSpeakingExperience",
          "businessJudgingExperience", "businessProfessionalMemberships",
        ],
      },
      { title: "Motivation", fields: ["whyJoin", "contributionDesc"] },
      { title: applicationSectionTitles.legal, fields: ["certifyTrue", "additionalDocumentationConsent", "agreeStandards", "understandReview", "privacyConsent"] },
    ]);
  }

  if (membershipCategory === "Brand") {
    return buildSections(payload, [
      { title: applicationSectionTitles.summary, fields: ["membershipCategory", "applicantType", "brandName", "brandType"] },
      {
        title: "Company information",
        fields: [
          "brandName", "brandType", "brandTypeOther", "brandYear", "brandRegistrationCountry", "brandCity", "brandAddress",
          "brandWebsite", "brandInstagram", "brandFacebook", "brandSocialWebsite", "brandTikTok", "brandLinkedIn", "brandYouTube",
          "brandPinterest", "brandOtherSocial", "brandPrimaryContact", "brandContactPosition", "brandContactPositionOther",
          "brandContactEmail", "brandContactPhone",
        ],
      },
      {
        title: "About the company",
        fields: [
          "brandDescription", "brandMission", "brandValues", "brandProductsServices", "brandProductCategories",
          "brandProductCategoryOther", "brandCatalogLinks", "brandOperatingCountries", "brandEmployeeCount",
        ],
      },
      {
        title: "Brand achievements",
        fields: [
          "brandAchievements", "brandCertifications", "brandCertificationOther", "brandPublicationsYesNo",
          "brandPublicationsDetails", "brandExhibitionsYesNo", "brandExhibitionsDetails", "brandIndustryContribution",
        ],
      },
      { title: "Cooperation with IBPA", fields: ["whyJoin", "brandCooperationMethods", "brandCooperationOther", "brandMemberBenefits", "brandMemberBenefitOther"] },
      { title: "Additional links", fields: ["brandAdditionalLinks"] },
      { title: applicationSectionTitles.legal, fields: ["certifyTrue", "additionalDocumentationConsent", "agreeStandards", "understandReview", "privacyConsent"] },
    ]);
  }

  const sections = [
    {
      fields: ["membershipCategory", "applicantType", "specialization", "specializationOther", "yearsExperience", "workSetting"],
      title: applicationSectionTitles.summary,
    },
    {
      fields: ["email", "phone", "dateOfBirth", "citizenship", "country", "city", "state", "zipCode", "streetAddress"],
      title: applicationSectionTitles.contact,
    },
    {
      fields: [
        "professionalDesc",
        "workingJurisdictions",
        "educationDesc",
        "hasLicense",
        "licenseNumber",
        "additionalEducation",
        "specialization",
        "specializationOther",
      ],
      title: applicationSectionTitles.professional,
    },
    {
      fields: [
        "studentSchool",
        "studentProgName",
        "studentStartDate",
        "studentEndDate",
        "studentMotivation",
        "educatorRole",
        "educatorSubjects",
        "educatorYears",
        "educatorFormat",
        "studentCount",
        "bizName",
        "bizType",
        "bizYear",
        "bizTeamSize",
        "bizServices",
        "brandName",
        "brandYear",
        "brandMarket",
        "brandType",
      ],
      title: applicationSectionTitles.category,
    },
    {
      fields: ["instagramLink", "websiteLink", "linkedinLink", "portfolioLink", "whyJoin", "contributionDesc"],
      title: applicationSectionTitles.links,
    },
    {
      fields: ["legalName", "signature", "certifyTrue", "understandReview", "agreeStandards", "privacyConsent"],
      title: applicationSectionTitles.legal,
    },
  ];

  return sections
    .map<ApplicationFieldSection>((section) => ({
      items: section.fields
        .map((field) => ({
          label: getApplicationFieldLabel(field),
          value: formatApplicationValue(field, payload[field]),
        }))
        .filter((item) => item.value),
      title: section.title,
    }))
    .filter((section) => section.items.length > 0);
}

function buildSections(
  payload: Record<string, unknown>,
  sections: Array<{ title: string; fields: string[] }>,
) {
  return sections
    .map<ApplicationFieldSection>((section) => ({
      items: section.fields
        .map((field) => ({
          label: getApplicationFieldLabel(field),
          value: formatApplicationValue(field, payload[field]),
        }))
        .filter((item) => item.value),
      title: section.title,
    }))
    .filter((section) => section.items.length > 0);
}

function fileListFromPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

export function getPortfolioImages(application: MemberApplicationDetail) {
  const payload = payloadOf(application);
  return [
    ...fileListFromPayload(payload, "portfolioImages"),
    ...fileListFromPayload(payload, "businessProfilePhotoFiles"),
    ...fileListFromPayload(payload, "businessPortfolioImages"),
  ];
}

export function getTrainerFileGroups(application: MemberApplicationDetail): ApplicationFileGroup[] {
  const payload = payloadOf(application);

  return [
    {
      files: fileListFromPayload(payload, "trainerEducationPlanFiles"),
      title: getApplicationFieldLabel("trainerEducationPlanFiles"),
    },
    {
      files: fileListFromPayload(payload, "trainerCertificateFiles"),
      title: getApplicationFieldLabel("trainerCertificateFiles"),
    },
    {
      files: fileListFromPayload(payload, "trainerExperienceProofFiles"),
      title: getApplicationFieldLabel("trainerExperienceProofFiles"),
    },
    ...[
      "businessProfessionalCertificationFiles",
      "businessSupportingDocumentFiles",
      "businessClientTestimonialFiles",
      "brandReviewFiles",
      "brandProductFiles",
      "brandAchievementDocumentFiles",
      "brandSupportingDocumentFiles",
    ].map((key) => ({
      files: fileListFromPayload(payload, key),
      title: getApplicationFieldLabel(key),
    })),
  ].filter((group) => group.files.length > 0);
}
