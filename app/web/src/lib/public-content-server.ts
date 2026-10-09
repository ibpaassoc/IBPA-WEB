import { getServerBackendUrl } from "@/lib/backend-url";
import { normalizePublicContentItems, type PublicContentItem } from "@/lib/public-content";

/**
 * Fetches published site content during server rendering so lists such as
 * /news and /events are present in the HTML that search engines receive.
 *
 * Uses the same backend endpoint, cache lifetime, and `public-content` tag as
 * the /api/content proxy, so admin edits that call `revalidateTag` refresh
 * these pages exactly as they refresh the homepage sections.
 *
 * Returns `null` when the backend cannot be reached, so callers can fall back
 * to client-side loading instead of showing an empty list as if it were fact.
 */
export async function fetchPublicContentServer(
  type: "news" | "events" | "partners",
  target: "site" | "dashboard" = "site",
): Promise<PublicContentItem[] | null> {
  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return null;
  }

  try {
    const response = await fetch(`${backendUrl}/api/content/public?type=${type}&target=${target}`, {
      next: { revalidate: 300, tags: ["public-content"] },
    });
    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => null);
    return normalizePublicContentItems(data?.items);
  } catch {
    return null;
  }
}
