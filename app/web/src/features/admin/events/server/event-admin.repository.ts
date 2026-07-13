import type { AdminContentItem } from "../../shared/types/admin.types";
import { requestJson } from "../../shared/utils/admin-request";
import type {
  AdminEventRegistration,
  EventEditorState,
  EventRegistrationCounts,
} from "../types/event-admin.types";

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

  const result = await requestJson<{ item?: AdminContentItem & { price?: unknown } }>(
    url,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: input.id ? "PATCH" : "POST",
    },
    "Could not save event.",
  );

  // The backend may omit fields it does not recognise from its response
  // (price is a custom extension). Echo back what we sent so the caller
  // never loses client-side state the API silently drops.
  if (result?.item != null && !("price" in result.item) && input.price) {
    return { ...result, item: { ...result.item, price: input.price } };
  }

  return result;
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
