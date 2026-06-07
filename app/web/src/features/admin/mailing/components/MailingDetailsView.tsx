import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import { getEmailLogRecipientCount } from "../server/mailing.service";
import type { EmailLog } from "../types/mailing.types";

type MailingDetailsViewProps = {
  email?: EmailLog | null;
};

export function MailingDetailsView({ email }: MailingDetailsViewProps) {
  if (!email) {
    return (
      <AdminSectionCard title="Email details">
        <AdminEmptyState
          description="Select a history row to inspect recipients, content, and delivery metadata."
          title="No email selected"
        />
      </AdminSectionCard>
    );
  }

  const recipients = email.recipients?.length ? email.recipients : email.to.split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <AdminSectionCard title="Email details">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="success">{email.status || "sent"}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{getEmailLogRecipientCount(email)} recipients</AdminStatusBadge>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Subject</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{email.subject}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Created</p>
            <p className="mt-1 text-sm text-foreground">{formatAdminDateTime(email.createdAt)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Sent</p>
            <p className="mt-1 text-sm text-foreground">{formatAdminDateTime(email.sentAt || email.createdAt)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Sender</p>
            <p className="mt-1 text-sm text-foreground">{email.sender || "IBPA Support"}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Campaign</p>
            <p className="mt-1 text-sm text-foreground">{email.relatedCampaign || email.id}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Recipients</p>
          <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-border p-3 text-sm text-muted-foreground">
            {recipients.join(", ") || "No recipients recorded"}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Content</p>
          <div
            className="mt-2 rounded-lg border border-border bg-background p-4 text-sm leading-6 text-foreground"
            dangerouslySetInnerHTML={{ __html: email.content || "" }}
          />
        </div>
      </div>
    </AdminSectionCard>
  );
}
