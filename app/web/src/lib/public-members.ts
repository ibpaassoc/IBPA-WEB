export type PublicMember = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  membershipCategory: string;
  applicantType: string;
  title: string;
  specializations?: string[];
  description: string;
  experience: string;
  location: string;
  city: string;
  country: string;
  avatarUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  portfolioImages: string[];
  highlights: string[];
  memberSince: string;
};

export type PublicProfilePreview = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio: string;
  education: string;
  achievements: string;
  industryContribution: string;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price: string;
  }>;
  portfolioImages: string[];
  specializations: string[];
  city: string;
  state: string;
  country: string;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  yearsExperience: string;
};

type Locale = "en" | "ru" | "uk";

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "";
}

export async function getPublicMembers(locale: Locale = "en"): Promise<PublicMember[]> {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    console.warn("Public members backend URL is not configured.");
    return [];
  }

  try {
    const res = await fetch(`${backendUrl}/api/members/public`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[Public members] Failed to load members:", data?.error || res.statusText);
      return [];
    }

    const items = Array.isArray(data.items) ? (data.items as PublicMember[]) : [];
    return items;
  } catch (error) {
    console.error("[Public members] Error:", error);
    return [];
  }
}

export async function getPublicProfilePreview(
  id: string,
): Promise<PublicProfilePreview | null> {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    console.warn("Public profile preview backend URL is not configured.");
    return null;
  }

  try {
    const res = await fetch(`${backendUrl}/api/members/public-preview/${id}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        "[Public profile preview] Failed to load profile:",
        data?.error || res.statusText,
      );
      return null;
    }

    if (!data?.item || typeof data.item !== "object") {
      return null;
    }

    return data.item as PublicProfilePreview;
  } catch (error) {
    console.error("[Public profile preview] Error:", error);
    return null;
  }
}
