import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type { MailingDraft } from "../types/mailing.types";

type MailingPreviewProps = {
  draft: MailingDraft;
  recipientCount: number;
};

export function MailingPreview({ draft, recipientCount }: MailingPreviewProps) {
  return (
    <div className="flex flex-col gap-5 rounded-[24px] border border-[#D7E5F4] bg-white p-6 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <div className="flex flex-wrap gap-2">
        <AdminStatusBadge tone="info">
          {recipientCount} recipient{recipientCount === 1 ? "" : "s"}
        </AdminStatusBadge>
        <AdminStatusBadge tone="neutral">Draft preview</AdminStatusBadge>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">Subject</p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[#10203B]">
          {draft.subject || "Email subject"}
        </h3>
      </div>
      <div className="rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] p-5 text-sm leading-7 text-[#10203B]">
        {(draft.body || "Email body preview will appear here.").split("\n").map((line, index) => (
          <p key={`${line}-${index}`}>{line || " "}</p>
        ))}
      </div>
    </div>
  );
}
