export type OrderStatus = "pending" | "review" | "rejected" | "approved" | "paid";

export type ApplicationPayload = Record<string, unknown> | null;

export type AdminOrder = {
  id: string;
  email: string;
  name: string;
  membershipCategory?: string | null;
  applicantType?: string | null;
  applicationPayload?: ApplicationPayload;
  status: OrderStatus;
  stripeSessionId?: string | null;
  checkoutUrl?: string | null;
  secureToken?: string;
  createdAt: string;
  certificateNumber?: string | null;
};

export type ApplicationAdditionalFile = {
  id: string;
  applicationId: string;
  fileName: string;
  fileUrl: string;
  fileKey?: string | null;
  fileType: string;
  createdAt: string;
};

export type AdminClient = {
  id: string;
  userName: string;
  email: string;
  cardName: string;
  membershipCategory?: string | null;
  phone?: string | null;
  status: string;
  certificateNumber?: string | null;
  certificateUrl?: string | null;
  expiresAt?: string | null;
  applicationPayload?: ApplicationPayload;
  createdAt: string;
  bio?: string | null;
  specialization?: string | null;
  experienceYears?: string | null;
  education?: string | null;
  instagramUrl?: string | null;
  country?: string | null;
  city?: string | null;
  hasDashboardAccess?: boolean;
};

export type AdminListResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type AdminOrderSummary = {
  all: number;
  pending: number;
  review: number;
  rejected: number;
  approved: number;
  paid: number;
};

export type AdminOrdersResponse = AdminListResponse<AdminOrder> & {
  summary: AdminOrderSummary;
};

export type AdminCardsResponse = AdminListResponse<AdminClient> & {
  categories?: string[];
};

export type AdminContentItem = {
  id: string;
  type: "news" | "events" | "partners";
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  cover_aspect?: number | null;
  eventAddress?: string | null;
  eventAllDay?: boolean;
  eventDate?: string | null;
  eventEndDate?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned: boolean;
  publishToSite: boolean;
  publishToDashboard: boolean;
  createdAt: string;
  updatedAt: string;
};
