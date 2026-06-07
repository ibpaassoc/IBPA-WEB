import type { AdminContentItem } from "../../shared/types/admin.types";
import type {
  AdminEventRegistration,
  EventEditorState,
  EventRegistrationCounts,
} from "../types/event-admin.types";

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
  const data = await parseJson<{ error?: string }>(response.clone());
  return data?.error || fallback;
}

async function requestJson<T>(url: string, init?: RequestInit, fallback = "Request failed.") {
  const response = await fetch(url, init);
  const data = await parseJson<T>(response);

  if (!response.ok) {
    throw new Error(await readError(response, fallback));
  }

  return data as T;
}

export async function listContentItems() {
  return requestJson<{ items?: AdminContentItem[] }>(
    "/api/admin/content",
    { cache: "no-store" },
    "Could not load events.",
  );
}

export async function saveEvent(input: EventEditorState) {
  const payload = {
    ...input,
    coverAspect: input.coverAspect ?? 16 / 9,
    type: "events",
  };
  const url = input.id ? `/api/admin/content/${encodeURIComponent(input.id)}` : "/api/admin/content";

  return requestJson<{ item?: AdminContentItem }>(
    url,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: input.id ? "PATCH" : "POST",
    },
    "Could not save event.",
  );
}

export async function deleteEvent(id: string) {
  return requestJson<{ success?: boolean }>(
    `/api/admin/content/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Could not delete event.",
  );
}

export async function listEventRegistrations(eventId: string) {
  return requestJson<{
    counts?: EventRegistrationCounts;
    items?: AdminEventRegistration[];
    total?: number;
  }>(
    `/api/admin/events/${encodeURIComponent(eventId)}/registrations`,
    { cache: "no-store" },
    "Could not load event registrations.",
  );
}
