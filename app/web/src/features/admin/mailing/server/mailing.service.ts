import type { AdminClient } from "../../shared/types/admin.types";
import type {
  ApplicationAudienceStatus,
  EmailLog,
  MailingAudienceKind,
  MailingAudienceSources,
  MailingDraft,
  MailingRecipient,
  MailingTemplate,
} from "../types/mailing.types";

export const mailingTemplates: MailingTemplate[] = [
  {
    body: "Hello,\n\nWe have an important IBPA update to share with you.\n\nThank you for being part of our professional community.",
    id: "general-update",
    name: "General update",
    subject: "Important IBPA update",
  },
  {
    body: "Hello,\n\nA new IBPA event is available for registration. Please review the details and reserve your spot if it fits your schedule.\n\nBest,\nIBPA",
    id: "event-invite",
    name: "Event invitation",
    subject: "You are invited to a new IBPA event",
  },
  {
    body: "Hello,\n\nWe are following up with a membership reminder from IBPA. Please review your dashboard for any pending actions.\n\nBest,\nIBPA",
    id: "membership-reminder",
    name: "Membership reminder",
    subject: "IBPA membership reminder",
  },
];

export const emptyMailingDraft: MailingDraft = {
  audienceKind: "all_users",
  audienceValue: "",
  body: "",
  customEmails: "",
  subject: "",
};

export const emptyApplicationStatusEmails: Record<ApplicationAudienceStatus, string[]> = {
  approved: [],
  pending: [],
  rejected: [],
};

export function normalizeRecipients(items: AdminClient[]): MailingRecipient[] {
  return items
    .filter((item) => item.email)
    .map((item) => ({
      cardName: item.cardName,
      email: item.email.trim().toLowerCase(),
      id: item.id,
      membershipCategory: item.membershipCategory,
      userName: item.userName,
    }));
}

export function parseCustomEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export function resolveAudienceEmails(
  sources: MailingAudienceSources,
  draft: MailingDraft,
) {
  const byKind = (kind: MailingAudienceKind) => {
    switch (kind) {
      case "members":
        return sources.recipients
          .filter((recipient) => !String(recipient.cardName || "").toLowerCase().includes("partner"))
          .map((recipient) => recipient.email);
      case "partners":
        return sources.recipients
          .filter((recipient) => String(recipient.cardName || "").toLowerCase().includes("partner"))
          .map((recipient) => recipient.email);
      case "membership_category":
        return sources.recipients
          .filter((recipient) => recipient.membershipCategory === draft.audienceValue)
          .map((recipient) => recipient.email);
      case "membership_type":
        return sources.recipients
          .filter((recipient) => recipient.cardName === draft.audienceValue)
          .map((recipient) => recipient.email);
      case "team_members":
        return sources.teamMemberEmails;
      case "event_registrants":
        return sources.eventRegistrantEmails;
      case "application_pending":
        return sources.applicationStatusEmails.pending;
      case "application_approved":
        return sources.applicationStatusEmails.approved;
      case "application_rejected":
        return sources.applicationStatusEmails.rejected;
      case "custom":
        return [];
      default:
        return sources.recipients.map((recipient) => recipient.email);
    }
  };

  const selected = draft.audienceKind === "custom"
    ? parseCustomEmails(draft.customEmails)
    : byKind(draft.audienceKind);

  return Array.from(new Set(selected));
}

export function renderEmailHtml(body: string) {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">${escaped.replace(/\n/g, "<br>")}</div>`;
}

export function applyTemplate(draft: MailingDraft, template: MailingTemplate): MailingDraft {
  return {
    ...draft,
    body: template.body,
    subject: template.subject,
  };
}

export function getEmailLogRecipientCount(log: EmailLog) {
  return log.recipientCount ?? log.recipients?.length ?? (log.to ? log.to.split(",").filter(Boolean).length : 0);
}
