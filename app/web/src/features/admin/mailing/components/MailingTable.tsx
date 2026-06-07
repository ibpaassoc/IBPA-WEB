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
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
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
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{email.subject}</span>
              <span className="text-xs text-muted-foreground">{email.sender || "IBPA Support"}</span>
            </div>
          ),
        },
        {
          key: "recipients",
          label: "Recipients",
          render: (email) => getEmailLogRecipientCount(email),
        },
        {
          key: "created",
          label: "Created",
          render: (email) => formatAdminDateTime(email.createdAt),
        },
        {
          key: "sent",
          label: "Sent",
          render: (email) => formatAdminDateTime(email.sentAt || email.createdAt),
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
              onClick={(event) => {
                event.stopPropagation();
                onDelete(email);
              }}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 data-icon="inline-start" />
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
