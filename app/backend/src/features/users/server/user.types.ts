import type { UserRole } from "@/lib/permissions";

export type EnsureCanonicalUserInput = {
  clerkId?: string | null;
  email: string;
  role: UserRole;
  status?: string;
};
