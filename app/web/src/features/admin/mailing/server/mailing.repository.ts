import type {
  AdminCardsResponse,
  AdminContentItem,
  AdminOrdersResponse,
  AdminPartnerApplicationsResponse,
} from "../../shared/types/admin.types";
import { requestJson } from "../../shared/utils/admin-request";
import type { ApplicationAudienceStatus, EmailLog } from "../types/mailing.types";

export async function listMailingRecipients() {
  return requestJson<AdminCardsResponse>(
    "/api/cards?purpose=mailing&limit=500",
    { cache: "no-store" },
    "Could not load mailing recipients.",
  );
}

function addEmail(target: Set<string>, email?: string | null) {
  if (!email) return;
  const normalized = email.trim().toLowerCase();
  if (normalized) {
    target.add(normalized);
  }
}

export async function listApplicationAudienceEmails() {
  const [memberApplications, partnerApplications] = await Promise.all([
    requestJson<AdminOrdersResponse>(
      "/api/orders?limit=500&offset=0",
      { cache: "no-store" },
      "Could not load member application audiences.",
    ),
    requestJson<AdminPartnerApplicationsResponse>(
      "/api/admin/partner-applications?limit=500&offset=0",
      { cache: "no-store" },
      "Could not load partner application audiences.",
    ),
  ]);

  const statusEmails: Record<ApplicationAudienceStatus, Set<string>> = {
    approved: new Set(),
    pending: new Set(),
    rejected: new Set(),
  };

  for (const application of memberApplications.items ?? []) {
    if (application.status === "rejected") {
      addEmail(statusEmails.rejected, application.email);
    } else if (application.status === "approved" || application.status === "paid") {
      addEmail(statusEmails.approved, application.email);
    } else {
      addEmail(statusEmails.pending, application.email);
    }
  }

  for (const application of partnerApplications.items ?? []) {
    if (application.status === "REJECTED") {
      addEmail(statusEmails.rejected, application.email);
    } else if (application.status === "APPROVED") {
      addEmail(statusEmails.approved, application.email);
    } else {
      addEmail(statusEmails.pending, application.email);
    }
  }

  return {
    approved: Array.from(statusEmails.approved),
    pending: Array.from(statusEmails.pending),
    rejected: Array.from(statusEmails.rejected),
  };
}

export async function listEventRegistrantAudienceEmails() {
  const content = await requestJson<{ items?: AdminContentItem[] }>(
    "/api/admin/content",
    { cache: "no-store" },
    "Could not load event audience.",
  );

  const events = (content.items ?? []).filter((item) => item.type === "events");
  const registrationResponses = await Promise.all(
    events.map((event) =>
      requestJson<{ items?: Array<{ email?: string | null }> }>(
        `/api/admin/events/${encodeURIComponent(event.id)}/registrations`,
        { cache: "no-store" },
        "Could not load event registrant audience.",
      ),
    ),
  );

  const emails = new Set<string>();
  for (const response of registrationResponses) {
    for (const registration of response.items ?? []) {
      addEmail(emails, registration.email);
    }
  }

  return Array.from(emails);
}

export async function listEmailHistory() {
  return requestJson<EmailLog[]>(
    "/api/admin/email-logs",
    { cache: "no-store" },
    "Could not load email history.",
  );
}

export async function deleteEmailHistoryItem(id: string) {
  return requestJson<{ success?: boolean }>(
    `/api/admin/email-logs?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Could not delete email history item.",
  );
}

export async function sendEmailCampaign(payload: {
  emails: string[];
  subject: string;
  html: string;
}) {
  return requestJson<{ success?: boolean; count?: number }>(
    "/api/admin/mailing",
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not send email campaign.",
  );
}
