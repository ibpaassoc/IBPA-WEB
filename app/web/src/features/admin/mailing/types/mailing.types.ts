import type { AdminClient } from "../../shared/types/admin.types";

export type MailingAudienceKind =
  | "all_users"
  | "members"
  | "partners"
  | "team_members"
  | "event_registrants"
  | "application_pending"
  | "application_approved"
  | "application_rejected"
  | "membership_category"
  | "membership_type"
  | "custom";

export type ApplicationAudienceStatus = "pending" | "approved" | "rejected";

export type MailingDraft = {
  subject: string;
  body: string;
  audienceKind: MailingAudienceKind;
  audienceValue: string;
  customEmails: string;
};

export type MailingTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export type MailingRecipient = Pick<AdminClient, "id" | "email" | "userName" | "membershipCategory" | "cardName">;

export type MailingAudienceSources = {
  applicationStatusEmails: Record<ApplicationAudienceStatus, string[]>;
  eventRegistrantEmails: string[];
  recipients: MailingRecipient[];
  teamMemberEmails: string[];
};

export type EmailLog = {
  id: string;
  to: string;
  recipients?: string[];
  recipientCount?: number;
  subject: string;
  content?: string;
  status?: string;
  sender?: string;
  createdAt: string;
  sentAt?: string;
  relatedCampaign?: string;
};
