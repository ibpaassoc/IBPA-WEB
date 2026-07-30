import type { ProfileRecordData, ProfileService } from "@/lib/profile-record";
import type { ContentImageMetadata } from "@/lib/content-image";

export interface Certificate {
  certNumber: string;
  orderEmail: string;
  orderName: string;
  accountType?: string | null;
  phone?: string | null;
  membershipCategory?: string | null;
  applicantType?: string | null;
  status: string;
  certificateUrl?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ExternalCertificate {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

// Admin-uploaded additional certificate shown in the applicant's dashboard.
// Distinct from the primary membership certificate (no CERT-... number,
// verification status, or expiry) and from the member's own uploads.
export interface AdminCertificate {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistoryEntry {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt?: string | null;
}

export type DashboardAccessType =
  | "member"
  | "partner_owner"
  | "partner_team_member";

export type TeamMemberAccessInfo = {
  id?: string;
  teamMemberId: string;
  fullName?: string;
  email?: string;
  role: string;
  licenseNumber: string;
  status: string;
  ownerMemberId: string;
  partnerBusinessName: string;
  partnerBusinessEmail: string;
};

export type PartnerInvitedMember = {
  id: string;
  teamMemberId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
};

export type PartnerTeamSummary = {
  includedSeats: number;
  includedUsed: number;
  includedRemaining: number;
  usedSeats: number;
  remainingSeats: number;
  totalAllowedSeats: number;
  additionalUsed: number;
  paidAdditionalSeats: number;
  pendingSeatExtensionSeats: number;
  pendingSeatExtensionRequests: number;
  additionalSeatPrice: number;
  canInvite: boolean;
  inviteDisabledReason: string | null;
  invitedMembers: PartnerInvitedMember[];
};

export type DashboardProfileData = ProfileRecordData & {
  certificatesSummary?: string | null;
  type?: string | null;
  accountType?: string | null;
  applicationType?: string | null;
  orderType?: string | null;
  membershipStatus?: string | null;
  paymentStatus?: string | null;
  certificateStatus?: string | null;
  partnerTeamSummary?: PartnerTeamSummary | null;
  dashboardAccessType?: DashboardAccessType | null;
  teamMember?: TeamMemberAccessInfo;
  orderId?: string | null;
};

export type DashboardMeta = {
  accountType?: string | null;
  applicationType?: string | null;
  orderType?: string | null;
  membershipStatus?: string | null;
  paymentStatus?: string | null;
  certificateStatus?: string | null;
  partnerTeam?: PartnerTeamSummary | null;
};

export type TabType =
  | "dashboard"
  | "profile"
  | "certificates"
  | "billing"
  | "events"
  | "directory"
  | "support"
  | "accountSettings"
  | "notifications"
  | "teamMembers";

export type DashboardContentItem = {
  id: string;
  type: "news" | "events";
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  imageMetadata?: ContentImageMetadata | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  createdAt: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
  eventAddress?: string | null;
  price?: string | number | null;
  isRegistered?: boolean;
  registrationStatus?: string | null;
  registrationId?: string | null;
  registrationSource?: string | null;
};

export type SupportMode = "question" | "idea" | "problem";

