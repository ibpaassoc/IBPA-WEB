"use client";

import { ExternalLink, FileText, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AdminSectionCard>
    );
  }

  const isBusy = Boolean(busyAction);

  return (
    <AdminSectionCard title="Certificate management">
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border border-[#D7E5F4]">
              <AvatarImage src={certificate.avatarUrl || undefined} />
              <AvatarFallback className="bg-[#EEF6FF] text-sm font-semibold text-[#1F5D8F]">
                {initialsFromName(certificate.userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-[#10203B]">{certificate.userName}</h3>
              <p className="truncate text-sm text-[#6C7F95]">{certificate.email}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminStatusBadge tone="info">
              {certificate.cardName || certificate.membershipCategory || "Member"}
            </AdminStatusBadge>
            <AdminStatusBadge tone={certificate.statusTone}>{certificate.statusLabel}</AdminStatusBadge>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#10203B]">Certificate details</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Certificate number" value={certificate.certificateNumber || "Not assigned"} />
            <InfoRow label="Issued" value={formatAdminDate(certificate.createdAt)} />
            <InfoRow label="Expires" value={formatAdminDate(certificate.expiresAt)} />
          </dl>
        </section>

        {certificate.certificateUrl ? (
          <div className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
              Primary actions
            </p>
            <div className="flex flex-col gap-2">
              <Button
                asChild
                className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
                type="button"
                variant="outline"
              >
                <a href={certificate.certificateUrl} rel="noreferrer" target="_blank">
                  <FileText data-icon="inline-start" />
                  Open certificate
                </a>
              </Button>
              <Button
                className="h-10 rounded-2xl bg-[#1F5D8F] text-white hover:bg-[#10203B]"
                disabled={isBusy}
                onClick={onResendCertificate}
                type="button"
              >
                {busyAction === "resend" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Mail data-icon="inline-start" />
                )}
                Resend PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
              Issue certificate
            </p>
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
              <div className="mt-3 rounded-2xl border border-[#D7E5F4] bg-white p-3 text-sm">
                <p className="font-medium text-[#10203B]">Pending certificate upload</p>
                <p className="mt-1 break-all text-xs text-[#6C7F95]">{pendingCertificateUrl}</p>
                <Button
                  className="mt-3 h-10 w-full rounded-2xl bg-[#1F5D8F] text-white hover:bg-[#10203B]"
                  disabled={busyAction === "save"}
                  onClick={onSaveCertificate}
                  type="button"
                >
                  {busyAction === "save" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : null}
                  Confirm certificate
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <div className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            Secondary
          </p>
          <Button
            asChild
            className="h-10 w-full rounded-2xl text-[#1F5D8F] hover:bg-[#EEF6FF]"
            type="button"
            variant="ghost"
          >
            <a href={`/admin/profiles?q=${encodeURIComponent(certificate.email)}`}>
              <ExternalLink data-icon="inline-start" />
              View full profile
            </a>
          </Button>
        </div>

        {certificate.certificateUrl ? (
          <div className="rounded-[22px] border border-[#F2C7C7] bg-[#FFF5F5] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#B42318]">
              Danger zone
            </p>
            <Button
              className="h-10 w-full rounded-2xl"
              disabled={isBusy}
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
        ) : null}
      </div>
    </AdminSectionCard>
  );
}
