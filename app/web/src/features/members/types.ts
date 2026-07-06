import type { Locale } from "@/lib/locale";
import type { PublicMember } from "@/lib/public-members";

/**
 * The public members feature reuses the existing `PublicMember` shape returned
 * by the `/api/members/public` endpoint (see `@/lib/public-members`). That
 * endpoint already excludes private fields (email, phone, address, payment
 * info, admin data), so everything on this type is safe to render publicly.
 */
export type { PublicMember };

export type MembersLocale = Locale;
