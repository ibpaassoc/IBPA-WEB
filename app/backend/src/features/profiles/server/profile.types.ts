import type { UserRole } from "@/lib/permissions";

export type ProfileService = {
  id: string;
  title: string;
  description: string;
  price: string;
};

export type ProfileRecordUpsertInput = {
  clerkUserId: string;
  email: string;
  currentRole?: UserRole | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  specializations?: string[] | null;
  achievements?: string | null;
  industryContribution?: string | null;
  experienceYears?: string | null;
  education?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  portfolioImages?: string[];
};

export type PublicProfileDirectoryRow = {
  id: string;
  membershipType: string;
  memberSince: Date | null;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  credentials: string | null;
  achievements: string | null;
  industryContribution: string | null;
  services: ProfileService[] | null;
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

export type PublicProfilePreviewItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string;
  education: string;
  achievements: string;
  industryContribution: string;
  services: ProfileService[];
  portfolioImages: string[];
  specializations: string[];
  city: string;
  state: string;
  country: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  yearsExperience: string;
};
