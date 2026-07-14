import type {
  AdminCardsResponse,
  AdminClient,
} from "../../shared/types/admin.types";
import { requestJson } from "../../shared/utils/admin-request";
import type { ProfileCertificateActionResult } from "../types/profile-admin.types";

type ListProfilesParams = {
  limit?: number;
  offset?: number;
  q?: string;
};

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
