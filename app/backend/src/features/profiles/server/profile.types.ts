import type { UserRole } from "@/lib/permissions";

export type DashboardProfileSaveInput = {
  clerkUserId: string;
  email: string;
  currentRole?: UserRole | null;
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
