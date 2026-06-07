import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type { AdminApplicationRecord } from "../types/application-admin.types";

export function ApplicationStatusBadge({
  record,
  type = "application",
}: {
  record: AdminApplicationRecord;
  type?: "application" | "payment";
}) {
  if (type === "payment") {
    return (
      <AdminStatusBadge tone={record.paymentStatusTone}>
        {record.paymentStatusLabel}
      </AdminStatusBadge>
    );
  }

  return (
    <AdminStatusBadge tone={record.statusTone}>
      {record.statusLabel}
    </AdminStatusBadge>
  );
}
