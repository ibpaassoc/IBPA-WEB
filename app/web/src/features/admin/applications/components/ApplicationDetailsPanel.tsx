"use client";

import { FileText, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationSectionTitles } from "@/lib/application-fields";
import { membershipConfigs } from "@/lib/membership";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import {
  buildMemberApplicationSections,
  getPortfolioImages,
  getTrainerFileGroups,
} from "../server/application-admin.service";
import type {
  AdminApplicationRecord,
  ApplicationAdditionalFile,
  ApplicationFieldSection,
  MemberApplicationDetail,
  PartnerApplicationDetail,
} from "../types/application-admin.types";
import { ApplicationReviewActions } from "./ApplicationReviewActions";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

type ApplicationDetailsPanelProps = {
  record?: AdminApplicationRecord | null;
  memberApplication?: MemberApplicationDetail | null;
  partnerApplication?: PartnerApplicationDetail | null;
  additionalFiles: ApplicationAdditionalFile[];
  busyAction: string | null;
  isLoading: boolean;
  isLoadingFiles: boolean;
  selectedMembershipCategory: string;
  selectedPartnerTier: string;
  /** "card" = standalone card wrapper (default); "inline" = flat two-column layout for expandable rows */
  layout?: "card" | "inline";
  onApprove: () => void;
  onDelete: () => void;
  onDeleteAdditionalFile: (fileId: string) => void;
  onReject: () => void;
  onResendPaymentLink: () => void;
  onReview: () => void;
  onMembershipCategoryChange: (value: string) => void;
  onPartnerTierChange: (value: string) => void;
  onSaveMembershipCategory: () => void;
  onUploadAdditionalFile: (
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => void;
};

function FieldList({ sections }: { sections: ApplicationFieldSection[] }) {
  if (sections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        No submitted details were found for this section.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <div className="flex flex-col gap-3" key={section.title}>
          <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
          <dl className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <div className="rounded-lg bg-muted/30 p-3" key={`${section.title}-${item.label}`}>
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 break-words text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function FileLinks({ files }: { files: string[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">No files submitted.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <a
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          href={file}
          key={file}
          rel="noreferrer"
          target="_blank"
        >
          <FileText data-icon="inline-start" />
          <span className="truncate">{file.split("/").pop() || file}</span>
        </a>
      ))}
    </div>
  );
}

function AdditionalFiles({
  files,
  isLoading,
  onDelete,
}: {
  files: ApplicationAdditionalFile[];
  isLoading: boolean;
  onDelete: (fileId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">No admin-added documents yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <div className="flex items-center gap-2 rounded-lg border border-border p-2" key={file.id}>
          <a
            className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline"
            href={file.fileUrl}
            rel="noreferrer"
            target="_blank"
          >
            {file.fileName}
          </a>
          <Button onClick={() => onDelete(file.id)} size="sm" type="button" variant="ghost">
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}

export function ApplicationDetailsPanel({
  additionalFiles,
  busyAction,
  isLoading,
  isLoadingFiles,
  layout = "card",
  memberApplication,
  onApprove,
  onDelete,
  onDeleteAdditionalFile,
  onMembershipCategoryChange,
  onPartnerTierChange,
  onReject,
  onResendPaymentLink,
  onReview,
  onSaveMembershipCategory,
  onUploadAdditionalFile,
  partnerApplication,
  record,
  selectedMembershipCategory,
  selectedPartnerTier,
}: ApplicationDetailsPanelProps) {
  if (!record) {
    if (layout === "inline") return null;
    return (
      <AdminSectionCard
        description="Choose an application from the table to inspect submitted data, files, payment state, and review actions."
        title="Application review"
      >
        <AdminEmptyState
          description="The details panel stays independent from profile review."
          icon={UploadCloud}
          title="No application selected"
        />
      </AdminSectionCard>
    );
  }

  if (isLoading) {
    return (
      <AdminSectionCard title="Loading application">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </AdminSectionCard>
    );
  }

  const memberSections = memberApplication ? buildMemberApplicationSections(memberApplication) : [];
  const membershipSections = memberSections.filter((section) => section.title === applicationSectionTitles.summary);
  const personalSections = memberSections.filter(
    (section) =>
      section.title === applicationSectionTitles.contact ||
      section.title === applicationSectionTitles.legal,
  );
  const professionalSections = memberSections.filter(
    (section) => !membershipSections.includes(section) && !personalSections.includes(section),
  );

  const actions = (
    <ApplicationReviewActions
      busyAction={busyAction}
      memberApplication={memberApplication}
      onApprove={onApprove}
      onDelete={onDelete}
      onReject={onReject}
      onResendPaymentLink={onResendPaymentLink}
      onReview={onReview}
      partnerApplication={partnerApplication}
      record={record}
    />
  );

  const memberContent = record.kind === "member" && memberApplication ? (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Personal information</h3>
        <FieldList sections={personalSections} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Professional information</h3>
        <FieldList sections={professionalSections} />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Uploaded files</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Portfolio images</p>
            <FileLinks files={getPortfolioImages(memberApplication)} />
          </div>
          {getTrainerFileGroups(memberApplication).map((group) => (
            <div className="flex flex-col gap-2" key={group.title}>
              <p className="text-xs font-medium text-muted-foreground">{group.title}</p>
              <FileLinks files={group.files} />
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Admin-added documents</p>
            <AdditionalFiles files={additionalFiles} isLoading={isLoadingFiles} onDelete={onDeleteAdditionalFile} />
          </div>
          <AdminUploadZone
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            buttonText="Choose files"
            endpoint="applicationAdditionalFileUploader"
            helperText="JPG, PNG, WEBP, PDF, DOC, DOCX. Multiple files supported."
            label="Upload supporting documents"
            multiple
            onError={(message) => toast.error(message)}
            onUploaded={onUploadAdditionalFile}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Membership</h3>
        <FieldList sections={membershipSections} />
        <FieldGroup>
          <Field>
            <FieldLabel>Membership package</FieldLabel>
            <Select onValueChange={onMembershipCategoryChange} value={selectedMembershipCategory || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select membership package" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {membershipConfigs.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.title}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <Button disabled={busyAction === "membership"} onClick={onSaveMembershipCategory} type="button" variant="outline">
          {busyAction === "membership" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          Save membership package
        </Button>
        {memberApplication.certificateNumber ? (
          <AdminStatusBadge tone="success">Certificate {memberApplication.certificateNumber}</AdminStatusBadge>
        ) : null}
      </section>
    </div>
  ) : null;

  const partnerContent = record.kind === "partner" && partnerApplication ? (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Contact</h3>
        <FieldList sections={[{ title: "Applicant", items: [
          { label: "Name", value: partnerApplication.name },
          { label: "Email", value: partnerApplication.email },
          { label: "Phone", value: partnerApplication.phone || "Not provided" },
        ]}]} />
      </section>
      <Separator />
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Request</h3>
        <FieldList sections={[{ title: "Partner request", items: [
          { label: "Requested tier", value: partnerApplication.requestedTier || "Not selected" },
          { label: "Message", value: partnerApplication.message || "Not provided" },
        ]}]} />
      </section>
      <Separator />
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Partner tier</h3>
        <FieldGroup>
          <Field>
            <FieldLabel>Tier</FieldLabel>
            <Select onValueChange={onPartnerTierChange} value={selectedPartnerTier}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select partner tier" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {["Associate", "Community", "Premier"].map((tier) => (
                    <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </section>
      <Separator />
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Payment</h3>
        <FieldList sections={[{ title: "Payment", items: [
          { label: "Status", value: partnerApplication.paymentStatus },
          { label: "Partner order", value: partnerApplication.partnerOrderId || "Not generated" },
          { label: "Stripe session", value: partnerApplication.stripeCheckoutSessionId || "Not generated" },
          { label: "Stripe invoice", value: partnerApplication.stripeInvoiceId || "Not generated" },
        ]}]} />
      </section>
    </div>
  ) : null;

  if (layout === "inline") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-4 overflow-auto">
          {memberContent}
          {partnerContent}
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-semibold text-muted-foreground">Actions</p>
          {actions}
        </div>
      </div>
    );
  }

  return (
    <AdminSectionCard
      description={`${record.kind === "member" ? "Member" : "Partner"} application submitted ${formatAdminDateTime(record.submittedAt)}`}
      title={record.applicantName}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ApplicationStatusBadge record={record} />
        <ApplicationStatusBadge record={record} type="payment" />
        <AdminStatusBadge tone="neutral">{record.applicantEmail}</AdminStatusBadge>
      </div>
      <Separator />
      {memberContent}
      {partnerContent}
      <Separator />
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Review actions</h3>
        {actions}
      </section>
    </AdminSectionCard>
  );
}
