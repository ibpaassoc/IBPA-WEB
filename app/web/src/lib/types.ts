export type OrderStatus = 'pending' | 'review' | 'rejected' | 'approved' | 'paid';

export type ApplicationPayload = Record<string, unknown> | null;

export type Order = {
  id: string;
  email: string;
  name: string;
  accountType?: "member" | "partner" | null;
  membershipCategory?: string | null;
  applicantType?: string | null;
  applicationPayload?: ApplicationPayload;
  status: OrderStatus;
  stripeSessionId?: string | null;
  checkoutUrl?: string | null;
  secureToken: string;
  createdAt: string;
  certificateNumber?: string;
};

export type CardRequestStatus = 'pending' | 'accepted' | 'rejected' | 'approved' | 'paid';

export type CardRequest = {
  id: string;
  userName: string;
  email: string;
  cardName: string;
  status: string;
  certificateNumber?: string | null;
  certificateUrl?: string | null;
  expiresAt?: string | null;
  createdAt: string;
};
