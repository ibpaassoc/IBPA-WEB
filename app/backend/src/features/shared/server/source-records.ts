export type SourceUserRecord = {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  bio: string | null;
  specialization: string | null;
  experienceYears: string | null;
  education: string | null;
  instagramUrl: string | null;
  country: string | null;
  city: string | null;
};

export type SourceOrderRecord = {
  id: string;
  email: string;
  name: string;
  accountType: string;
  membershipCategory: string | null;
  applicantType: string | null;
  applicationPayload: unknown;
  status: string;
  stripeSessionId: string | null;
  confirmationEmailStatus?: string;
  emailSentAt?: Date | null;
  emailError?: string | null;
  secureToken: string;
  package: string | null;
  phone: string | null;
  createdAt: Date;
};

export type SourceCertificateRecord = {
  id: string;
  certNumber: string;
  certificateUrl: string | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type SourceApplicationFileRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileKey: string | null;
  fileType: string;
  createdAt: Date;
};

export type SourcePartnerApplicationRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  requestedTier: string | null;
  status: string;
  paymentStatus: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  partnerOrderId: string | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

export type SourceTeamMemberRecord = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: Date;
};
