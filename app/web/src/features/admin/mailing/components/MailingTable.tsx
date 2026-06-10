"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import { getEmailLogRecipientCount } from "../server/mailing.service";
import type { EmailLog } from "../types/mailing.types";

type MailingTableProps = {
  emails: EmailLog[];
  isLoading: boolean;
  onDelete: (email: EmailLog) => void;
  onOpen: (email: EmailLog) => void;
  selectedId?: string | null;
};

export function MailingTable({
  emails,
  isLoading,
  onDelete,
  onOpen,
  selectedId,
}: MailingTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <AdminEmptyState
        description="Sent campaigns will appear here."
        title="No email history"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "subject",
          label: "Subject",
          render: (email) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[#10203B]">{email.subject}</span>
              <span className="text-xs text-[#6C7F95]">{email.sender || "IBPA Support"}</span>
            </div>
          ),
        },
        {
          key: "recipients",
          label: "Recipients",
          render: (email) => (
            <span className="text-sm tabular-nums text-[#10203B]">
              {getEmailLogRecipientCount(email)}
            </span>
          ),
        },
        {
          key: "created",
          label: "Created",
          render: (email) => (
            <span className="text-xs text-[#6C7F95]">{formatAdminDateTime(email.createdAt)}</span>
          ),
        },
        {
          key: "sent",
          label: "Sent",
          render: (email) => (
            <span className="text-xs text-[#6C7F95]">
              {formatAdminDateTime(email.sentAt || email.createdAt)}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (email) => (
            <AdminStatusBadge tone="success">{email.status || "sent"}</AdminStatusBadge>
          ),
        },
        {
          key: "actions",
          label: "Actions",
          render: (email) => (
            <Button
              className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF5F5] hover:text-[#B42318]"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(email);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ),
        },
      ]}
      getRowKey={(email) => email.id}
      items={emails}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
