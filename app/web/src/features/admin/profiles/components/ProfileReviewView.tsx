"use client";

import { ExternalLink, FileText, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate, formatNullableText } from "../../shared/utils/admin-formatters";
import {
  getProfileLocation,
  getProfileMedia,
  getProfileServices,
} from "../server/profile-admin.service";
import type { AdminProfileRecord } from "../types/profile-admin.types";
import { ProfileMediaGallery } from "./ProfileMediaGallery";
import { ProfileSummaryCard } from "./ProfileSummaryCard";

type ProfileReviewViewProps = {
  profile?: AdminProfileRecord | null;
  isLoading: boolean;
  pendingCertificateUrl: string | null;
  busyAction: string | null;
  onCertificateUploaded: (url: string) => void;
  onDelete: () => void;
  onRemoveCertificate: () => void;
  onResendCertificate: () => void;
  onSaveCertificate: () => void;
};

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div className="rounded-lg bg-muted/30 p-3" key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileReviewView({
  busyAction,
  isLoading,
  onCertificateUploaded,
  onDelete,
  onRemoveCertificate,
  onResendCertificate,
  onSaveCertificate,
  pendingCertificateUrl,
  profile,
}: ProfileReviewViewProps) {
  if (!profile) {
    return (
      <AdminSectionCard
        description="Open a profile to review public information, certificates, media, services, and completion."
        title="Profile review"
      >
        <AdminEmptyState
          description="Profile review is intentionally separate from application review."
          title="No profile selected"
        />
      </AdminSectionCard>
    );
  }

  if (isLoading) {
    return (
      <AdminSectionCard title="Loading profile">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </AdminSectionCard>
    );
  }

  const services = getProfileServices(profile);
  const media = getProfileMedia(profile);
  const previewHref = profile.userId ? `/profile-preview/${profile.userId}` : null;

  return (
    <AdminSectionCard title="Profile review">
      <ProfileSummaryCard profile={profile} />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Personal information</h3>
        <InfoGrid
          items={[
            { label: "Name", value: profile.userName },
            { label: "Email", value: profile.email },
            { label: "Phone", value: formatNullableText(profile.phone) },
            { label: "Location", value: getProfileLocation(profile) },
          ]}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Professional information</h3>
        <InfoGrid
          items={[
            { label: "Specialization", value: formatNullableText(profile.specialization) },
            { label: "Experience", value: formatNullableText(profile.experienceYears) },
            { label: "Education", value: formatNullableText(profile.education) },
            { label: "Instagram", value: formatNullableText(profile.instagramUrl) },
            { label: "Website", value: formatNullableText(profile.websiteUrl) },
          ]}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Biography</h3>
        <p className="rounded-lg bg-muted/30 p-4 text-sm leading-6 text-foreground">
          {formatNullableText(profile.bio, "No biography has been added yet.")}
        </p>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Services</h3>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services listed yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((service) => (
              <div className="rounded-lg border border-border p-3" key={service.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{service.title}</p>
                  <AdminStatusBadge tone="neutral">{service.price || "Price not listed"}</AdminStatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Photos</h3>
        <ProfileMediaGallery images={media} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Certificates and files</h3>
        <InfoGrid
          items={[
            { label: "Certificate number", value: profile.certificateNumber || "Not issued" },
            { label: "Issued", value: formatAdminDate(profile.createdAt) },
            { label: "Expires", value: formatAdminDate(profile.expiresAt) },
          ]}
        />
        {profile.certificateUrl ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <a href={profile.certificateUrl} rel="noreferrer" target="_blank">
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
        ) : null}
        {!profile.certificateUrl ? (
          <div className="flex flex-col gap-3">
            <AdminUploadZone
              accept=".pdf,application/pdf"
              buttonText="Choose file"
              endpoint="certificateUploader"
              helperText="The uploaded file is saved only after confirmation."
              label="Upload certificate PDF"
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
                  {busyAction === "save" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : null}
                  Confirm certificate
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Public profile preview</h3>
        {previewHref && profile.hasDashboardAccess ? (
          <Button asChild type="button" variant="outline">
            <a href={previewHref} rel="noreferrer" target="_blank">
              <ExternalLink data-icon="inline-start" />
              View public profile
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            This member needs a linked dashboard profile before the public preview is available.
          </p>
        )}
      </section>

      <Separator />

      <Button disabled={Boolean(busyAction)} onClick={onDelete} type="button" variant="ghost">
        {busyAction === "delete" ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <Trash2 data-icon="inline-start" />
        )}
        Delete membership record
      </Button>
    </AdminSectionCard>
  );
}
