"use client";

import { UploadCloud } from "lucide-react";
import { motion } from "motion/react";

import { Skeleton } from "@/components/ui/skeleton";
import { applicationSectionTitles } from "@/lib/application-fields";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import { buildMemberApplicationSections } from "../server/application-admin.service";
import type {
  AdminApplicationRecord,
  ApplicationAdditionalFile,
  ApplicationFieldSection,
  MemberApplicationDetail,
  PartnerApplicationDetail,
} from "../types/application-admin.types";
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
    metadata?: {
      fileName?: string;
      fileKey?: string | null;
      fileType?: string;
    },
  ) => void;
};

function PanelCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <section className="rounded-[24px] border border-[#D9E4F2] bg-white/82 p-4 shadow-[0_14px_36px_rgba(15,35,70,0.07)] backdrop-blur-2xl">
      {title ? (
        <h3 className="mb-3 text-sm font-semibold tracking-[-0.01em] text-[#10203B]">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

function FieldList({ sections }: { sections: ApplicationFieldSection[] }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D9E4F2] bg-[#F7FAFE]/80 p-4 text-sm text-[#6B7C93]">
        No submitted details were found for this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div className="space-y-2.5" key={section.title}>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            {section.title}
          </h4>

          <dl className="grid gap-2.5 md:grid-cols-2">
            {section.items.map((item) => {
              const value = String(item.value ?? "").trim();
              const isLong = value.length > 160;

              return (
                <div
                  className={`rounded-2xl border border-[#E4ECF6] bg-[#F7FAFE]/82 px-3.5 py-3 ${
                    isLong ? "md:col-span-2" : ""
                  }`}
                  key={`${section.title}-${item.label}`}
                >
                  <dt className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8AA2BD]">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-5 text-[#10203B]">
                    {value || "Not provided"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function ApplicationDetailsPanel({
  isLoading,
  layout = "card",
  memberApplication,
  partnerApplication,
  record,
}: ApplicationDetailsPanelProps) {
  if (!record) {
    if (layout === "inline") return null;

    return (
      <AdminSectionCard title="Application review">
        <AdminEmptyState
          description="Choose an application from the queue to review submitted information."
          icon={UploadCloud}
          title="No application selected"
        />
      </AdminSectionCard>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-[280px] w-full rounded-[26px]" />
        <Skeleton className="h-[360px] w-full rounded-[26px]" />
      </div>
    );
  }

  const memberSections = memberApplication
    ? buildMemberApplicationSections(memberApplication)
    : [];

  const membershipSections = memberSections.filter(
    (section) => section.title === applicationSectionTitles.summary,
  );

  const personalSections = memberSections.filter(
    (section) =>
      section.title === applicationSectionTitles.contact ||
      section.title === applicationSectionTitles.legal,
  );

  const professionalSections = memberSections.filter(
    (section) =>
      !membershipSections.includes(section) &&
      !personalSections.includes(section),
  );

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <ApplicationStatusBadge record={record} />
      <ApplicationStatusBadge record={record} type="payment" />
      <AdminStatusBadge tone="neutral">{record.applicantEmail}</AdminStatusBadge>
      <AdminStatusBadge tone="neutral">
        Submitted {formatAdminDateTime(record.submittedAt)}
      </AdminStatusBadge>
    </div>
  );

  const memberContent =
    record.kind === "member" && memberApplication ? (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="space-y-5"
        initial={{ opacity: 0, x: 28 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <PanelCard title="Personal information">
          <FieldList sections={personalSections} />
        </PanelCard>

        <PanelCard title="Professional information">
          <FieldList sections={professionalSections} />
        </PanelCard>
      </motion.div>
    ) : null;

  const partnerContent =
    record.kind === "partner" && partnerApplication ? (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="space-y-5"
        initial={{ opacity: 0, x: 28 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <PanelCard title="Contact">
          <FieldList
            sections={[
              {
                title: "Applicant",
                items: [
                  { label: "Name", value: partnerApplication.name },
                  { label: "Email", value: partnerApplication.email },
                  {
                    label: "Phone",
                    value: partnerApplication.phone || "Not provided",
                  },
                ],
              },
            ]}
          />
        </PanelCard>

        <PanelCard title="Request">
          <FieldList
            sections={[
              {
                title: "Partner request",
                items: [
                  {
                    label: "Requested tier",
                    value:
                      partnerApplication.requestedTier || "Not selected",
                  },
                  {
                    label: "Message",
                    value: partnerApplication.message || "Not provided",
                  },
                ],
              },
            ]}
          />
        </PanelCard>

        <PanelCard title="Payment">
          <FieldList
            sections={[
              {
                title: "Payment",
                items: [
                  { label: "Status", value: partnerApplication.paymentStatus },
                  {
                    label: "Partner order",
                    value:
                      partnerApplication.partnerOrderId || "Not generated",
                  },
                  {
                    label: "Stripe session",
                    value:
                      partnerApplication.stripeCheckoutSessionId ||
                      "Not generated",
                  },
                  {
                    label: "Stripe invoice",
                    value:
                      partnerApplication.stripeInvoiceId || "Not generated",
                  },
                ],
              },
            ]}
          />
        </PanelCard>
      </motion.div>
    ) : null;

  const content = (
    <div className="space-y-5">
      {header}
      {memberContent}
      {partnerContent}
    </div>
  );

  if (layout === "inline") {
    return content;
  }

  return (
    <AdminSectionCard
      description={`${
        record.kind === "member" ? "Member" : "Partner"
      } application submitted ${formatAdminDateTime(record.submittedAt)}`}
      title={record.applicantName}
    >
      {content}
    </AdminSectionCard>
  );
}
