import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type { MailingDraft } from "../types/mailing.types";

type MailingPreviewProps = {
  draft: MailingDraft;
  recipientCount: number;
};

export function MailingPreview({ draft, recipientCount }: MailingPreviewProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap gap-2">
        <AdminStatusBadge tone="info">{recipientCount} recipients</AdminStatusBadge>
        <AdminStatusBadge tone="neutral">Draft preview</AdminStatusBadge>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Subject</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">
          {draft.subject || "Email subject"}
        </h3>
      </div>
      <div className="rounded-lg bg-background p-4 text-sm leading-6 text-foreground">
        {(draft.body || "Email body preview will appear here.").split("\n").map((line, index) => (
          <p key={`${line}-${index}`}>{line || "\u00a0"}</p>
        ))}
      </div>
    </div>
  );
}
