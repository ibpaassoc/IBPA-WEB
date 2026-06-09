"use client";

import { ExternalLink, FileText, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminCertificateRecord } from "../types/certificate-admin.types";

type CertificateActionPanelProps = {
  busyAction: string | null;
  certificate: AdminCertificateRecord | null;
  isLoading: boolean;
  onCertificateUploaded: (url: string) => void;
  onRemoveCertificate: () => void;
  onResendCertificate: () => void;
  onSaveCertificate: () => void;
  pendingCertificateUrl: string | null;
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

export function CertificateActionPanel({
  busyAction,
  certificate,
  isLoading,
  onCertificateUploaded,
  onRemoveCertificate,
  onResendCertificate,
  onSaveCertificate,
  pendingCertificateUrl,
}: CertificateActionPanelProps) {
  if (!certificate) {
    return (
      <AdminSectionCard
        description="Open a record to issue, resend, or remove a member's certificate."
        title="Certificate management"
      >
        <AdminEmptyState
          description="Select a member from the list to manage their certificate."
          title="No record selected"
        />
      </AdminSectionCard>
    );
  }

  if (isLoading) {
    return (
      <AdminSectionCard title="Loading certificate">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </AdminSectionCard>
    );
  }

  return (
    <AdminSectionCard title="Certificate management">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={certificate.avatarUrl || undefined} />
            <AvatarFallback>{initialsFromName(certificate.userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">{certificate.userName}</h3>
            <p className="truncate text-sm text-muted-foreground">{certificate.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="info">{certificate.cardName || certificate.membershipCategory || "Member"}</AdminStatusBadge>
          <AdminStatusBadge tone={certificate.statusTone}>{certificate.statusLabel}</AdminStatusBadge>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Certificate details</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Certificate number" value={certificate.certificateNumber || "Not assigned"} />
          <InfoRow label="Issued" value={formatAdminDate(certificate.createdAt)} />
          <InfoRow label="Expires" value={formatAdminDate(certificate.expiresAt)} />
        </dl>
      </section>

      <Separator />

      {certificate.certificateUrl ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <a href={certificate.certificateUrl} rel="noreferrer" target="_blank">
              <FileText data-icon="inline-start" />
              Open certificate
            </a>
          </Button>
          <Button
            disabled={Boolean(busyAction)}
            onClick={onResendCertificate}
            type="button"
            variant="secondary"
          >
            {busyAction === "resend" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Mail data-icon="inline-start" />
            )}
            Resend PDF
          </Button>
          <Button
            disabled={Boolean(busyAction)}
            onClick={onRemoveCertificate}
            type="button"
            variant="destructive"
          >
            {busyAction === "remove" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Trash2 data-icon="inline-start" />
            )}
            Remove PDF
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AdminUploadZone
            accept=".pdf,application/pdf"
            buttonText="Choose file"
            endpoint="certificateUploader"
            helperText="The uploaded file is saved only after confirmation."
            label="Issue certificate (PDF)"
            onError={(message) => toast.error(`Upload failed: ${message}`)}
            onUploaded={onCertificateUploaded}
          />
          {pendingCertificateUrl ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">Pending certificate upload</p>
              <p className="mt-1 break-all text-muted-foreground">{pendingCertificateUrl}</p>
              <Button
                className="mt-3"
                disabled={busyAction === "save"}
                onClick={onSaveCertificate}
                type="button"
              >
                {busyAction === "save" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                Confirm certificate
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <Separator />

      <Button asChild type="button" variant="ghost">
        <a href={`/admin/profiles?q=${encodeURIComponent(certificate.email)}`}>
          <ExternalLink data-icon="inline-start" />
          View full profile
        </a>
      </Button>
    </AdminSectionCard>
  );
}
