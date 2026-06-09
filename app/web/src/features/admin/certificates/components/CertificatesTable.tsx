"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminCertificateRecord } from "../types/certificate-admin.types";

type CertificatesTableProps = {
  certificates: AdminCertificateRecord[];
  isLoading: boolean;
  onOpen: (certificate: AdminCertificateRecord) => void;
  selectedId?: string | null;
};

export function CertificatesTable({
  certificates,
  isLoading,
  onOpen,
  selectedId,
}: CertificatesTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <AdminEmptyState
        description="Try another search or filter."
        title="No certificate records found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "holder",
          label: "Holder",
          render: (certificate) => (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={certificate.avatarUrl || undefined} />
                <AvatarFallback>{initialsFromName(certificate.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{certificate.userName}</span>
                <span className="truncate text-xs text-muted-foreground">{certificate.email}</span>
              </div>
            </div>
          ),
        },
        {
          key: "category",
          label: "Category",
          render: (certificate) => certificate.cardName || certificate.membershipCategory || "Member",
        },
        {
          key: "number",
          label: "Certificate number",
          render: (certificate) => certificate.certificateNumber || "Not assigned",
        },
        {
          key: "status",
          label: "Status",
          render: (certificate) => <AdminStatusBadge tone={certificate.statusTone}>{certificate.statusLabel}</AdminStatusBadge>,
        },
        {
          key: "expires",
          label: "Expires",
          render: (certificate) => formatAdminDate(certificate.expiresAt),
        },
      ]}
      getRowKey={(certificate) => certificate.id}
      items={certificates}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
