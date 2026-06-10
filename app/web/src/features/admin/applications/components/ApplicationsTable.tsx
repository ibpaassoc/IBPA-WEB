"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type {
  AdminApplicationRecord,
} from "../types/application-admin.types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

type ApplicationsTableProps = {
  applications: AdminApplicationRecord[];
  isLoading: boolean;
  onOpen: (application: AdminApplicationRecord) => void;
  selectedId?: string | null;
};

export function ApplicationsTable({
  applications,
  isLoading,
  onOpen,
  selectedId,
}: ApplicationsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <AdminEmptyState
        description="Try a different search term or loosen one of the filters."
        title="No applications found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "applicant",
          label: "Applicant",
          render: (application) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[#10203B]">{application.applicantName}</span>
              <span className="text-xs text-[#6C7F95]">{application.applicantEmail}</span>
            </div>
          ),
        },
        {
          key: "type",
          label: "Applicant type",
          render: (application) => (
            <AdminStatusBadge tone="neutral">{application.applicantType}</AdminStatusBadge>
          ),
        },
        {
          key: "package",
          label: "Membership package",
          render: (application) => (
            <span className="text-sm text-[#10203B]">{application.membershipPackage}</span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (application) => <ApplicationStatusBadge record={application} />,
        },
        {
          key: "payment",
          label: "Payment",
          render: (application) => <ApplicationStatusBadge record={application} type="payment" />,
        },
        {
          key: "submitted",
          label: "Submitted",
          render: (application) => (
            <span className="text-xs text-[#6C7F95]">{formatAdminDate(application.submittedAt)}</span>
          ),
        },
      ]}
      getRowKey={(application) => `${application.kind}:${application.id}`}
      items={applications}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
