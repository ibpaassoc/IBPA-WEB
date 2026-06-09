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
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
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
              <Avatar className="size-9 border border-[#D7E5F4]">
                <AvatarImage src={certificate.avatarUrl || undefined} />
                <AvatarFallback className="bg-[#EEF6FF] text-xs font-semibold text-[#1F5D8F]">
                  {initialsFromName(certificate.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-semibold text-[#10203B]">{certificate.userName}</span>
                <span className="truncate text-xs text-[#6C7F95]">{certificate.email}</span>
              </div>
            </div>
          ),
        },
        {
          key: "category",
          label: "Category",
          render: (certificate) => (
            <span className="text-sm text-[#10203B]">
              {certificate.cardName || certificate.membershipCategory || "Member"}
            </span>
          ),
        },
        {
          key: "number",
          label: "Certificate number",
          render: (certificate) => (
            <span className="text-sm tabular-nums text-[#10203B]">
              {certificate.certificateNumber || "Not assigned"}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (certificate) => (
            <AdminStatusBadge tone={certificate.statusTone}>{certificate.statusLabel}</AdminStatusBadge>
          ),
        },
        {
          key: "expires",
          label: "Expires",
          render: (certificate) => (
            <span className="text-xs text-[#6C7F95]">{formatAdminDate(certificate.expiresAt)}</span>
          ),
        },
      ]}
      getRowKey={(certificate) => certificate.id}
      items={certificates}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
