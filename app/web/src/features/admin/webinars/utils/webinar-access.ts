import type {
  MembershipCategory,
  WebinarAccessSettings,
} from "../types/webinar.types";

export type MembershipCategoryOption = {
  value: MembershipCategory;
  applicantType: string;
};

/** Categories whose applicant type is Individual (e.g. Specialist, Professional). */
export function individualCategories(options: MembershipCategoryOption[]) {
  return options
    .filter((option) => option.applicantType === "Individual")
    .map((option) => option.value);
}

/** One-line description of who can watch, used in the header and dialog. */
export function describeAccess(
  access: Pick<WebinarAccessSettings, "audience" | "membershipTypes" | "allowTeamMembers">,
  options: MembershipCategoryOption[],
) {
  let audience: string;
  if (access.audience === "ALL_MEMBERS") {
    audience = "All members";
  } else if (access.audience === "INDIVIDUALS") {
    const individuals = individualCategories(options);
    audience = individuals.length
      ? `Individuals only (${individuals.join(", ")})`
      : "Individuals only";
  } else {
    audience = access.membershipTypes.length
      ? access.membershipTypes.join(", ")
      : "No membership types selected";
  }
  return `${audience} · Team members ${access.allowTeamMembers ? "allowed" : "not allowed"}`;
}
