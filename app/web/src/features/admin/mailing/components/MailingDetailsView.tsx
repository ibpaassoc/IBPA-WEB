import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import { getEmailLogRecipientCount } from "../server/mailing.service";
import type { EmailLog } from "../types/mailing.types";

type MailingDetailsViewProps = {
  email?: EmailLog | null;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-[#10203B]">{value}</dd>
    </div>
  );
}

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

  const recipients = email.recipients?.length
    ? email.recipients
    : email.to.split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <AdminSectionCard title="Email details">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="success">{email.status || "sent"}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">
            {getEmailLogRecipientCount(email)} recipients
          </AdminStatusBadge>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">Subject</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-[#10203B]">
            {email.subject}
          </h3>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Created" value={formatAdminDateTime(email.createdAt)} />
          <InfoRow label="Sent" value={formatAdminDateTime(email.sentAt || email.createdAt)} />
          <InfoRow label="Sender" value={email.sender || "IBPA Support"} />
          <InfoRow label="Campaign" value={email.relatedCampaign || email.id} />
        </dl>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            Recipients
          </p>
          <div className="mt-2 max-h-40 overflow-auto rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] p-4 text-sm text-[#55708D]">
            {recipients.join(", ") || "No recipients recorded"}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">Content</p>
          <div
            className="prose prose-sm mt-2 max-w-none rounded-[18px] border border-[#DCE7F5] bg-white p-5 text-sm leading-7 text-[#10203B]"
            dangerouslySetInnerHTML={{ __html: email.content || "" }}
          />
        </div>
      </div>
    </AdminSectionCard>
  );
}
