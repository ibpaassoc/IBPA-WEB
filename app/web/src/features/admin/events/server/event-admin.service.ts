import type { AdminContentItem } from "../../shared/types/admin.types";
import type {
  AdminEvent,
  AdminEventRegistration,
  EventEditorState,
  EventRegistrationStatus,
  EventVisibilityFilter,
} from "../types/event-admin.types";

export const emptyEventEditorState: EventEditorState = {
  body: "",
  coverAspect: 16 / 9,
  coverImage: "",
  ctaLabel: "Open Event",
  ctaUrl: "",
  eventAddress: "",
  eventAllDay: false,
  eventDate: "",
  eventEndDate: "",
  isPinned: false,
  publishToDashboard: true,
  publishToSite: true,
  title: "",
};

function toInputDate(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

export function normalizeEvent(item: AdminContentItem): AdminEvent {
  return {
    ...item,
    body: item.body ?? "",
    coverAspect: item.coverAspect ?? item.cover_aspect ?? 16 / 9,
    coverImage: item.coverImage ?? "",
    ctaLabel: item.ctaLabel ?? "Open Event",
    ctaUrl: item.ctaUrl ?? "",
    eventAddress: item.eventAddress ?? "",
    eventAllDay: Boolean(item.eventAllDay),
    eventDate: item.eventDate ?? "",
    eventEndDate: item.eventEndDate ?? "",
    isPinned: Boolean(item.isPinned),
    publishToDashboard: Boolean(item.publishToDashboard),
    publishToSite: Boolean(item.publishToSite),
    title: item.title ?? "",
    type: "events",
  };
}

export function toEventEditorState(event?: AdminEvent | null): EventEditorState {
  if (!event) {
    return { ...emptyEventEditorState };
  }

  return {
    body: event.body,
    coverAspect: event.coverAspect ?? event.cover_aspect ?? 16 / 9,
    coverImage: event.coverImage ?? "",
    ctaLabel: event.ctaLabel || "Open Event",
    ctaUrl: event.ctaUrl || "",
    eventAddress: event.eventAddress || "",
    eventAllDay: Boolean(event.eventAllDay),
    eventDate: toInputDate(event.eventDate),
    eventEndDate: toInputDate(event.eventEndDate),
    id: event.id,
    isPinned: Boolean(event.isPinned),
    publishToDashboard: Boolean(event.publishToDashboard),
    publishToSite: Boolean(event.publishToSite),
    title: event.title,
  };
}

export function duplicateEventState(event: AdminEvent): EventEditorState {
  return {
    ...toEventEditorState(event),
    id: undefined,
    title: `${event.title} (Copy)`,
  };
}

export function getEventVisibility(event: Pick<AdminEvent, "publishToDashboard" | "publishToSite">) {
  return event.publishToDashboard || event.publishToSite ? "Published" : "Draft";
}

export function filterEvents(
  events: AdminEvent[],
  params: { query: string; visibility: EventVisibilityFilter },
) {
  const query = params.query.trim().toLowerCase();

  return events.filter((event) => {
    if (params.visibility === "published" && !event.publishToSite && !event.publishToDashboard) {
      return false;
    }

    if (params.visibility === "draft" && (event.publishToSite || event.publishToDashboard)) {
      return false;
    }

    if (!query) return true;

    return [event.title, event.body, event.eventAddress, event.ctaLabel]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });
}

export function filterRegistrations(
  registrations: AdminEventRegistration[],
  params: { query: string; status: "all" | EventRegistrationStatus },
) {
  const query = params.query.trim().toLowerCase();

  return registrations.filter((registration) => {
    if (params.status !== "all" && registration.status !== params.status) {
      return false;
    }

    if (!query) return true;

    return [registration.name, registration.email, registration.source]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });
}

export function registrationsToCsv(registrations: AdminEventRegistration[]) {
  const rows = [
    ["Name", "Email", "Status", "Source", "Registered At"],
    ...registrations.map((registration) => [
      registration.name,
      registration.email,
      registration.status,
      registration.source,
      registration.registeredAt,
    ]),
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
