import type {
  ApplicationAudienceStatus,
  EmailLog,
  MailingAudienceKind,
  MailingAudienceSources,
  MailingDraft,
  MailingRecipient,
  MailingRecipientSource,
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
  includeTeamMembers: false,
  subject: "",
};

export const emptyApplicationStatusEmails: Record<ApplicationAudienceStatus, string[]> = {
  approved: [],
  pending: [],
  rejected: [],
};

function normalizeEmailList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

export function normalizeRecipients(items: MailingRecipientSource[]): MailingRecipient[] {
  return items
    .filter((item) => item.email)
    .map((item) => ({
      cardName: item.cardName,
      email: item.email.trim().toLowerCase(),
      id: item.id,
      membershipCategory: item.membershipCategory,
      teamMemberEmails: normalizeEmailList(item.teamMemberEmails),
      userName: item.userName,
    }));
}

/** Accounts that carry at least one mailable team seat. */
export function hasTeamMembers(recipient: MailingRecipient) {
  return recipient.teamMemberEmails.length > 0;
}

/** Every team seat on file, used by the "Team members" bulk audience. */
export function listAllTeamMemberEmails(recipients: MailingRecipient[]) {
  return Array.from(new Set(recipients.flatMap((recipient) => recipient.teamMemberEmails)));
}

/**
 * Team seats belonging to the given account emails. Audiences resolve to plain
 * emails, so owners are matched by email rather than by row id — that keeps the
 * expansion working for every audience kind, not just the member picker.
 */
export function collectTeamMemberEmails(
  recipients: MailingRecipient[],
  ownerEmails: Iterable<string>,
) {
  const teamsByOwnerEmail = new Map(
    recipients
      .filter(hasTeamMembers)
      .map((recipient) => [recipient.email, recipient.teamMemberEmails] as const),
  );

  const collected = new Set<string>();
  for (const ownerEmail of ownerEmails) {
    for (const email of teamsByOwnerEmail.get(ownerEmail) ?? []) {
      collected.add(email);
    }
  }

  return Array.from(collected);
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

/** Hand-picked people always win over the bulk audience, seats included. */
export function isMemberPickerActive(
  pickedMemberEmails: string[],
  pickedTeamMemberEmails: string[],
) {
  return pickedMemberEmails.length > 0 || pickedTeamMemberEmails.length > 0;
}

export type CampaignRecipients = {
  /** Account holders: picked members, or whatever the bulk audience resolved to. */
  accountEmails: string[];
  /** Team seats reached on top of the accounts, never double-counted. */
  teamEmails: string[];
  emails: string[];
};

export function buildCampaignRecipients(input: {
  audienceEmails: string[];
  draft: MailingDraft;
  pickedMemberEmails: string[];
  pickedTeamMemberEmails: string[];
  recipients: MailingRecipient[];
}): CampaignRecipients {
  const usesPicker = isMemberPickerActive(input.pickedMemberEmails, input.pickedTeamMemberEmails);
  const accountEmails = usesPicker
    ? normalizeEmailList([
        ...input.pickedMemberEmails,
        ...parseCustomEmails(input.draft.customEmails),
      ])
    : normalizeEmailList(input.audienceEmails);

  const accountSet = new Set(accountEmails);
  const teamEmails = normalizeEmailList([
    ...input.pickedTeamMemberEmails,
    ...(input.draft.includeTeamMembers
      ? collectTeamMemberEmails(input.recipients, accountEmails)
      : []),
  ]).filter((email) => !accountSet.has(email));

  return {
    accountEmails,
    emails: [...accountEmails, ...teamEmails],
    teamEmails,
  };
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
