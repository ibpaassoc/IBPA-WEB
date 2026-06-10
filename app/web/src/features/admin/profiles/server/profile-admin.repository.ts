import type {
  AdminCardsResponse,
  AdminClient,
} from "../../shared/types/admin.types";
import type { ProfileCertificateActionResult } from "../types/profile-admin.types";

type ListProfilesParams = {
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

async function readError(response: Response, fallback: string) {
  const data = await parseJson<{ error?: string; details?: string }>(response.clone());
  return data?.error || data?.details || fallback;
}

async function requestJson<T>(url: string, init?: RequestInit, fallback = "Request failed.") {
  const response = await fetch(url, init);
  const data = await parseJson<T>(response);

  if (!response.ok) {
    throw new Error(await readError(response, fallback));
  }

  return data as T;
}

function buildQuery(params: ListProfilesParams) {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 100),
    offset: String(params.offset ?? 0),
  });

  if (params.q?.trim()) {
    query.set("q", params.q.trim());
  }

  return query.toString();
}

export async function listProfiles(params: ListProfilesParams = {}) {
  return requestJson<AdminCardsResponse>(
    `/api/cards?${buildQuery(params)}`,
    { cache: "no-store" },
    "Could not load profiles.",
  );
}

export async function getProfile(id: string) {
  return requestJson<AdminClient>(
    `/api/cards/${encodeURIComponent(id)}`,
    { cache: "no-store" },
    "Could not load profile.",
  );
}

export async function saveProfileCertificate(profileId: string, certificateUrl: string) {
  return requestJson<ProfileCertificateActionResult>(
    `/api/admin/orders/${encodeURIComponent(profileId)}/certificate`,
    {
      body: JSON.stringify({ url: certificateUrl }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not save certificate.",
  );
}

export async function removeProfileCertificate(profileId: string) {
  return requestJson<ProfileCertificateActionResult>(
    `/api/admin/orders/${encodeURIComponent(profileId)}/certificate`,
    { method: "DELETE" },
    "Could not remove certificate.",
  );
}

export async function resendProfileCertificate(profileId: string) {
  return requestJson<{ success?: boolean }>(
    `/api/admin/orders/${encodeURIComponent(profileId)}/resend-pdf`,
    { method: "POST" },
    "Could not resend certificate email.",
  );
}

export async function deleteProfileMembership(profileId: string) {
  return requestJson<{ success?: boolean }>(
    `/api/admin/orders/${encodeURIComponent(profileId)}`,
    { method: "DELETE" },
    "Could not delete profile membership.",
  );
}
