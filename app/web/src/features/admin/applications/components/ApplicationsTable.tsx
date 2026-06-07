"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
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
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
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
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{application.applicantName}</span>
              <span className="text-xs text-muted-foreground">{application.applicantEmail}</span>
            </div>
          ),
        },
        {
          key: "type",
          label: "Applicant type",
          render: (application) => (
            <Badge variant="secondary" className="rounded-full">
              {application.applicantType}
            </Badge>
          ),
        },
        {
          key: "package",
          label: "Membership package",
          render: (application) => application.membershipPackage,
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
          render: (application) => formatAdminDate(application.submittedAt),
        },
      ]}
      getRowKey={(application) => `${application.kind}:${application.id}`}
      items={applications}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
