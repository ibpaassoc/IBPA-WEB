"use client";

import { Award, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";

import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord } from "../types/members-admin.types";
import { AdminAdditionalCertificates } from "./AdminAdditionalCertificates";

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

type Props = {
  member: AdminMemberRecord;
  busyAction: string | null;
  onIssueCertificate: (url: string, metadata?: { fileKey?: string | null }) => void;
  onResendCertificate: () => void;
  onRemoveCertificate: () => void;
};

export function MemberCertificateTab({
  busyAction,
  member,
  onIssueCertificate,
  onRemoveCertificate,
  onResendCertificate,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Left: read-only info */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
          <span
            className={`flex size-11 items-center justify-center rounded-2xl ${
              member.hasCertificate
                ? "bg-[#E4F6EC] text-[#197A52]"
                : "bg-[#EEF6FF] text-[#1F5D8F]"
            }`}
          >
            <Award className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#10203B]">
              {member.hasCertificate ? "Certificate issued" : "No certificate on file"}
            </p>
            {member.certificateNumber ? (
              <p className="text-xs text-[#6C7F95]">#{member.certificateNumber}</p>
            ) : null}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Status" value={member.certStatusLabel} />
          <InfoRow
            label="Certificate number"
            value={member.certificateNumber || "Not assigned"}
          />
          <InfoRow label="Expiry" value={formatAdminDate(member.expiresAt)} />
          <InfoRow
            label="Membership"
            value={member.cardName || member.membershipCategory || "Uncategorized"}
          />
        </dl>

        {member.certificateUrl ? (
          <a
            className="flex items-center gap-2 rounded-2xl border border-[#D7E5F4] bg-white px-4 py-3 text-sm font-medium text-[#1F5D8F] transition-colors hover:bg-[#EEF6FF]"
            href={member.certificateUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-4 shrink-0" />
            View certificate PDF
          </a>
        ) : null}
      </div>

      {/* Right: action rail */}
      <aside className="flex flex-col gap-3">
        <section className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            Certificate actions
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <AdminUploadZone
              accept=".pdf,application/pdf"
              buttonText={member.hasCertificate ? "Replace PDF" : "Upload PDF"}
              endpoint="certificateUploader"
              helperText="Signed PDF only."
              label={member.hasCertificate ? "Replace certificate" : "Issue certificate"}
              onError={(message) => toast.error(message)}
              onUploaded={(url, metadata) => {
                onIssueCertificate(url, metadata);
              }}
            />
            {member.hasCertificate ? (
              <Button
                className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
                disabled={busyAction === "resend"}
                onClick={onResendCertificate}
                type="button"
                variant="outline"
              >
                {busyAction === "resend" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                Resend certificate email
              </Button>
            ) : null}
          </div>
        </section>

        {member.hasCertificate ? (
          <section className="rounded-[22px] border border-[#F2C7C7] bg-[#FFF5F5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B42318]">
              Danger zone
            </p>
            <Button
              className="mt-3 h-10 w-full rounded-2xl"
              disabled={busyAction === "remove_cert"}
              onClick={onRemoveCertificate}
              type="button"
              variant="destructive"
            >
              {busyAction === "remove_cert" ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : null}
              Remove certificate
            </Button>
          </section>
        ) : null}
      </aside>
    </div>

      <AdminAdditionalCertificates orderId={member.id} />
    </div>
  );
}
