export const MEMBERSHIP_ANNUAL_AMOUNTS = {
  Specialist: 4900,
  Professional: 19900,
  Trainer: 39900,
  Business: 59900,
  Brand: 129900,
} as const;

export type MembershipCategory = keyof typeof MEMBERSHIP_ANNUAL_AMOUNTS;

export const MEMBERSHIP_APPLICANT_TYPES: Record<MembershipCategory, string> = {
  Specialist: "Individual",
  Professional: "Individual",
  Trainer: "School",
  Business: "Business",
  Brand: "Brand",
};

export type MembershipChangeDetails = {
  previousMembershipId: string;
  previousApplicationId: string | null;
  fromCategory: MembershipCategory;
  toCategory: MembershipCategory;
  oldAmount: number;
  newAmount: number;
  balanceDue: number;
  reason: string;
  submittedAt: string;
};

export function normalizeMembershipCategory(value: unknown): MembershipCategory | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (
    Object.keys(MEMBERSHIP_ANNUAL_AMOUNTS) as MembershipCategory[]
  ).find((category) => category.toLowerCase() === normalized) ?? null;
}

export function getMembershipAmount(category: unknown) {
  const normalized = normalizeMembershipCategory(category);
  return normalized ? MEMBERSHIP_ANNUAL_AMOUNTS[normalized] : null;
}

export function calculateMembershipBalance(fromCategory: unknown, toCategory: unknown) {
  const oldAmount = getMembershipAmount(fromCategory);
  const newAmount = getMembershipAmount(toCategory);
  if (oldAmount == null || newAmount == null) return null;

  return {
    oldAmount,
    newAmount,
    balanceDue: Math.max(newAmount - oldAmount, 0),
  };
}

export function getMembershipChangeDetails(value: unknown): MembershipChangeDetails | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  const fromCategory = normalizeMembershipCategory(payload.fromCategory);
  const toCategory = normalizeMembershipCategory(payload.toCategory);
  const previousMembershipId = typeof payload.previousMembershipId === "string"
    ? payload.previousMembershipId
    : "";

  if (!fromCategory || !toCategory || !previousMembershipId) return null;

  const balance = calculateMembershipBalance(fromCategory, toCategory);
  if (!balance) return null;

  return {
    previousMembershipId,
    previousApplicationId:
      typeof payload.previousApplicationId === "string" ? payload.previousApplicationId : null,
    fromCategory,
    toCategory,
    oldAmount: balance.oldAmount,
    newAmount: balance.newAmount,
    balanceDue: balance.balanceDue,
    reason: typeof payload.reason === "string" ? payload.reason : "",
    submittedAt: typeof payload.submittedAt === "string" ? payload.submittedAt : "",
  };
}

export function isMembershipChangeApplicationData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return payload.applicationKind === "MEMBERSHIP_CHANGE"
    && getMembershipChangeDetails(payload.membershipChange) !== null;
}
