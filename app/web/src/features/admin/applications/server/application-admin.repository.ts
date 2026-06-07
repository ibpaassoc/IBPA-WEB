import type {
  AdminOrder,
  AdminOrdersResponse,
  AdminPartnerApplication,
  AdminPartnerApplicationsResponse,
  ApplicationAdditionalFile,
  OrderStatus,
} from "../types/application-admin.types";

type ListParams = {
  limit?: number;
  offset?: number;
  q?: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  const data = await parseJson<{ error?: string; details?: string }>(response.clone());
  if (data?.error) return data.error;
  if (data?.details) return data.details;

  const text = await response.clone().text().catch(() => "");
  return text.trim() || fallback;
}

async function requestJson<T>(url: string, init?: RequestInit, fallback = "Request failed.") {
  const response = await fetch(url, init);
  const data = await parseJson<T | { error?: string; details?: string }>(response);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }

  return data as T;
}

function buildListQuery(params: ListParams) {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 100),
    offset: String(params.offset ?? 0),
  });

  if (params.q?.trim()) {
    query.set("q", params.q.trim());
  }

  return query.toString();
}

export async function listMemberApplications(params: ListParams = {}) {
  return requestJson<AdminOrdersResponse>(
    `/api/orders?${buildListQuery(params)}`,
    { cache: "no-store" },
    "Could not load member applications.",
  );
}

export async function getMemberApplication(id: string) {
  return requestJson<AdminOrder>(
    `/api/admin/orders/${encodeURIComponent(id)}`,
    { cache: "no-store" },
    "Could not load member application.",
  );
}

export async function listPartnerApplications(params: ListParams = {}) {
  return requestJson<AdminPartnerApplicationsResponse>(
    `/api/admin/partner-applications?${buildListQuery(params)}`,
    { cache: "no-store" },
    "Could not load partner applications.",
  );
}

export async function getPartnerApplication(id: string) {
  return requestJson<AdminPartnerApplication>(
    `/api/admin/partner-applications/${encodeURIComponent(id)}`,
    { cache: "no-store" },
    "Could not load partner application.",
  );
}

export async function approveMemberApplication(orderId: string) {
  return requestJson<{ certificateNumber?: string; checkoutUrl?: string | null }>(
    "/api/admin/approve",
    {
      body: JSON.stringify({ orderId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not approve application.",
  );
}

export async function rejectMemberApplication(orderId: string) {
  return requestJson<{ ok?: boolean }>(
    "/api/admin/reject",
    {
      body: JSON.stringify({ orderId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not reject application.",
  );
}

export async function moveMemberApplicationToReview(orderId: string) {
  return requestJson<{ ok?: boolean }>(
    "/api/admin/review",
    {
      body: JSON.stringify({ orderId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not move application to review.",
  );
}

export async function updateMemberApplication(
  orderId: string,
  payload: { membershipCategory?: string; status?: OrderStatus },
) {
  return requestJson<{ application?: AdminOrder }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
    "Could not update application.",
  );
}

export async function resendMemberPaymentLink(orderId: string) {
  return requestJson<{ checkoutUrl?: string | null; paymentLinkUrl?: string | null }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/resend-payment-link`,
    { method: "POST" },
    "Could not resend payment link.",
  );
}

export async function deleteMemberApplication(orderId: string) {
  return requestJson<{ ok?: boolean }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    { method: "DELETE" },
    "Could not delete application.",
  );
}

export async function listMemberApplicationFiles(orderId: string) {
  return requestJson<{ files?: ApplicationAdditionalFile[] }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/additional-files`,
    { cache: "no-store" },
    "Could not load application files.",
  );
}

export async function addMemberApplicationFiles(
  orderId: string,
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileKey?: string | null;
    fileType?: string;
  }>,
) {
  return requestJson<{ files?: ApplicationAdditionalFile[] }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/additional-files`,
    {
      body: JSON.stringify({ files }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not save application file.",
  );
}

export async function deleteMemberApplicationFile(orderId: string, fileId: string) {
  return requestJson<{ ok?: boolean }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}/additional-files/${encodeURIComponent(fileId)}`,
    { method: "DELETE" },
    "Could not delete application file.",
  );
}

export async function approvePartnerApplication(applicationId: string, tier: string) {
  return requestJson<AdminPartnerApplication | { ok?: boolean }>(
    "/api/admin/partner-applications/approve",
    {
      body: JSON.stringify({ applicationId, tier }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not approve partner application.",
  );
}

export async function rejectPartnerApplication(applicationId: string) {
  return requestJson<AdminPartnerApplication | { ok?: boolean }>(
    "/api/admin/partner-applications/reject",
    {
      body: JSON.stringify({ applicationId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not reject partner application.",
  );
}

export async function deletePartnerApplication(applicationId: string) {
  return requestJson<{ ok?: boolean }>(
    `/api/admin/partner-applications/${encodeURIComponent(applicationId)}`,
    { method: "DELETE" },
    "Could not delete partner application.",
  );
}
