"use client";

import { Award, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord } from "../types/members-admin.types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
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
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      {/* Info */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-full"
            style={{
              background: member.hasCertificate
                ? "color-mix(in srgb, var(--color-emerald-500) 12%, transparent)"
                : "color-mix(in srgb, var(--foreground) 6%, transparent)",
            }}
          >
            <Award
              className="size-5"
              style={{
                color: member.hasCertificate ? "var(--color-emerald-600)" : "var(--muted-foreground)",
              }}
            />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {member.hasCertificate ? "Certificate issued" : "No certificate on file"}
            </p>
            {member.certificateNumber ? (
              <p className="text-xs text-muted-foreground">#{member.certificateNumber}</p>
            ) : null}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            label="Status"
            value={member.certStatusLabel}
          />
          <InfoRow
            label="Certificate number"
            value={member.certificateNumber || "Not assigned"}
          />
          <InfoRow
            label="Expiry"
            value={formatAdminDate(member.expiresAt)}
          />
          <InfoRow
            label="Membership"
            value={member.cardName || member.membershipCategory || "Uncategorized"}
          />
        </dl>

        {member.certificateUrl ? (
          <>
            <Separator />
            <a
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              href={member.certificateUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              View certificate PDF
            </a>
          </>
        ) : null}

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">
            {member.hasCertificate ? "Replace certificate" : "Issue certificate"}
          </p>
          <AdminUploadZone
            accept=".pdf,application/pdf"
            buttonText="Choose PDF"
            endpoint="certificateUploader"
            helperText="Upload a signed PDF certificate."
            label="Certificate file"
            onError={(message) => toast.error(message)}
            onUploaded={(url, metadata) => {
              onIssueCertificate(url, metadata);
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p className="text-xs font-semibold text-muted-foreground">Certificate actions</p>
        <div className="flex flex-col gap-2">
          {member.hasCertificate ? (
            <>
              <Button
                disabled={busyAction === "resend"}
                onClick={onResendCertificate}
                size="sm"
                type="button"
                variant="outline"
              >
                {busyAction === "resend" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                Resend certificate email
              </Button>
              <Button
                disabled={busyAction === "remove_cert"}
                onClick={onRemoveCertificate}
                size="sm"
                type="button"
                variant="outline"
              >
                {busyAction === "remove_cert" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                Remove certificate
              </Button>
            </>
          ) : (
            <AdminStatusBadge tone="neutral">
              Upload a PDF above to issue a certificate
            </AdminStatusBadge>
          )}
        </div>
      </div>
    </div>
  );
}
