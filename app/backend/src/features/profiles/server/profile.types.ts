import type { Order, User as LegacyUser } from "@/lib/schema";

export type DashboardProfileSaveInput = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  specialization?: string | null;
  experienceYears?: string | null;
  education?: string | null;
  instagramUrl?: string | null;
  country?: string | null;
  city?: string | null;
  applicationPayload?: Record<string, unknown>;
  legacyOrder?: Order | null;
};

export type LegacyPublicMemberRow = {
  orderId: string;
  fullName: string;
  email: string;
  clerkId: string | null;
  membershipCategory: string | null;
  applicantType: string | null;
  createdAt: Date;
  bio: string | null;
  specialization: string | null;
  experienceYears: string | null;
  education: string | null;
  instagramUrl: string | null;
  country: string | null;
  city: string | null;
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  applicationPayload: unknown;
};

export type CanonicalPublicMemberRow = {
  id: string;
  membershipType: string;
  memberSince: Date | null;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  credentials: string | null;
  services: string | null;
  workGalleryPhotos: string[];
  specializations: string[];
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  instagram: string | null;
  yearsExperience: number | null;
  createdAt: Date;
};

export type PublicMemberDirectoryItem = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  membershipCategory: string;
  applicantType: string;
  title: string;
  specializations: string[];
  description: string;
  experience: string;
  location: string;
  city: string;
  country: string;
  avatarUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  portfolioImages: string[];
  highlights: string[];
  memberSince: string;
};

export type LegacyDashboardProfileRecord = {
  existingUser: LegacyUser | null;
  nextApplicationPayload: Record<string, unknown>;
};
