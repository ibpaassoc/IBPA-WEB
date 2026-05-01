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
