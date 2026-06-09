import type { AdminContentItem } from "../../shared/types/admin.types";

export type AdminEvent = AdminContentItem & {
  type: "events";
  /** Free-text price label set by admins, e.g. "$25", "Free", "Members: $10". */
  price?: string | null;
};

export type EventEditorState = {
  id?: string;
  title: string;
  body: string;
  coverImage: string;
  coverAspect: number | null;
  eventAddress: string;
  eventAllDay: boolean;
  eventDate: string;
  eventEndDate: string;
  price: string;
  ctaUrl: string;
  ctaLabel: string;
  isPinned: boolean;
  publishToSite: boolean;
  publishToDashboard: boolean;
};

export type EventVisibilityFilter = "all" | "published" | "draft";

export type EventRegistrationStatus = "REGISTERED" | "WAITLISTED" | "CANCELLED" | "ATTENDED";

export type AdminEventRegistration = {
  id: string;
  eventId: string;
  userId: string;
  email: string;
  name: string;
  status: EventRegistrationStatus;
  source: string;
  registeredAt: string;
  cancelledAt?: string | null;
  profileId?: string | null;
};

export type EventRegistrationCounts = {
  registered: number;
  waitlisted: number;
  cancelled: number;
  attended: number;
};
