export type CanonicalApplicationInput = {
  id: string;
  userId?: string | null;
  type: "MEMBER" | "PARTNER" | "TEAM_MEMBER";
  packageName?: string | null;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAYMENT_SENT" | "PAID";
  fullName: string;
  email: string;
  phone?: string | null;
  paymentLink?: string | null;
  applicationData: Record<string, unknown>;
  applicationFiles: Array<Record<string, unknown>>;
  approvedAt?: Date | null;
  createdAt?: Date;
};
