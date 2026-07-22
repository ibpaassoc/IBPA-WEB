import { requestJson } from "../../shared/utils/admin-request";
import type { AdminCertificateRecord } from "../types/members-admin.types";

type AdminCertificateListResponse = {
  items?: AdminCertificateRecord[];
};

type AdminCertificateMutationResponse = {
  success?: boolean;
  item?: AdminCertificateRecord;
};

export type AdminCertificateFilePayload = {
  fileUrl: string;
  fileKey?: string | null;
  fileName?: string | null;
  fileType?: string | null;
};

function ordersBase(orderId: string) {
  return `/api/admin/orders/${encodeURIComponent(orderId)}/admin-certificates`;
}

export async function listAdminCertificates(orderId: string) {
  const data = await requestJson<AdminCertificateListResponse>(
    ordersBase(orderId),
    { cache: "no-store" },
    "Could not load additional certificates.",
  );
  return Array.isArray(data.items) ? data.items : [];
}

export async function createAdminCertificate(
  orderId: string,
  payload: { title: string } & AdminCertificateFilePayload,
) {
  return requestJson<AdminCertificateMutationResponse>(
    ordersBase(orderId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Could not save the additional certificate.",
  );
}

export async function updateAdminCertificateTitle(
  orderId: string,
  certificateId: string,
  title: string,
) {
  return requestJson<AdminCertificateMutationResponse>(
    `${ordersBase(orderId)}/${encodeURIComponent(certificateId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    },
    "Could not update the certificate.",
  );
}

export async function replaceAdminCertificateFile(
  orderId: string,
  certificateId: string,
  payload: AdminCertificateFilePayload,
) {
  return requestJson<AdminCertificateMutationResponse>(
    `${ordersBase(orderId)}/${encodeURIComponent(certificateId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Could not replace the certificate file.",
  );
}

export async function deleteAdminCertificate(orderId: string, certificateId: string) {
  return requestJson<{ success?: boolean; id?: string }>(
    `${ordersBase(orderId)}/${encodeURIComponent(certificateId)}`,
    { method: "DELETE" },
    "Could not delete the certificate.",
  );
}
