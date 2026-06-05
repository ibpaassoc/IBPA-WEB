export type CanonicalMembershipInput = {
  id: string;
  userId: string;
  type: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startedAt?: Date | null;
  expiresAt?: Date | null;
};
