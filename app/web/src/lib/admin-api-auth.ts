import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-auth";

/**
 * Authoritative admin authentication/authorization utility.
 *
 * Used by:
 * - `src/proxy.ts` (middleware) — request classification, JSON error
 *   responses for API routes, structured failure logging. Everything the
 *   middleware touches is Edge-safe (no Node-only APIs).
 * - Admin API route handlers — `requireAdminApi()`.
 * - The admin layout — `getAdminPageAuth()`.
 *
 * Guarantees:
 * - `401 unauthenticated` (no/expired session) is distinct from
 *   `403 forbidden` (signed in, not an admin).
 * - API requests always receive JSON errors, never an HTML redirect.
 * - The same admin-role logic (`isAdminEmail`) is used by middleware, route
 *   handlers, and pages.
 * - A 401/403 is always returned before the proxied backend call runs, so a
 *   rejected mutation has no side effects.
 */

export type AdminAuthFailureCategory =
  | "unauthenticated"
  | "forbidden"
  | "unavailable"
  | "misconfigured";

export type AdminApiAuthFailure = {
  ok: false;
  status: 401 | 403 | 500 | 503;
  category: AdminAuthFailureCategory;
  response: NextResponse;
};

export type AdminApiAuthSuccess = {
  ok: true;
  userId: string;
  email: string;
  backendUrl: string;
  authHeaders: Record<string, string>;
};

export type AdminApiAuth = AdminApiAuthSuccess | AdminApiAuthFailure;

const ADMIN_AUTH_ERRORS: Record<
  AdminAuthFailureCategory,
  { status: 401 | 403 | 500 | 503; error: string }
> = {
  unauthenticated: { status: 401, error: "Authentication required. Please sign in again." },
  forbidden: { status: 403, error: "Forbidden - admin access required" },
  unavailable: { status: 503, error: "Auth provider temporarily unavailable. Please retry." },
  misconfigured: { status: 500, error: "Admin backend is not configured." },
};

/** Consistent JSON error body for API auth failures. Never a redirect. */
export function adminAuthErrorResponse(
  category: AdminAuthFailureCategory,
  message?: string,
): NextResponse {
  const { status, error } = ADMIN_AUTH_ERRORS[category];
  return NextResponse.json({ error: message || error, code: category }, { status });
}

type AdminAuthLogContext = {
  layer: "middleware" | "route" | "page";
  route: string;
  method: string;
  category: AdminAuthFailureCategory;
  requestId?: string | null;
  hasUserId: boolean;
};

/**
 * Structured, grep-able auth failure log line. Safe metadata only — never
 * cookies, tokens, authorization headers, or personal data.
 */
export function logAdminAuthFailure(context: AdminAuthLogContext) {
  console.warn(
    JSON.stringify({
      event: "admin_auth_failure",
      layer: context.layer,
      route: context.route,
      method: context.method,
      category: context.category,
      requestId: context.requestId || undefined,
      hasUserId: context.hasUserId,
    }),
  );
}

/** Vercel/request id when available, for correlating with platform logs. */
export function getRequestId(headers: Headers): string | null {
  return headers.get("x-vercel-id") || headers.get("x-request-id");
}

/**
 * A top-level document navigation (as opposed to an RSC/prefetch/fetch
 * request). Only document requests may be answered with an HTML redirect;
 * everything else must get JSON so the client can react programmatically.
 */
export function isDocumentRequest(headers: Headers): boolean {
  const dest = headers.get("sec-fetch-dest");
  if (dest) {
    return dest === "document" || dest === "iframe";
  }
  return (headers.get("accept") || "").includes("text/html");
}

export type ProxyPathKind =
  /** Routes that authenticate themselves (UploadThing, Stripe webhooks). */
  | "bypass"
  /** APIs that require a signed-in user; unauthenticated gets JSON 401. */
  | "protected-api"
  /** Admin pages; unauthenticated documents redirect to sign-in. */
  | "admin-page"
  /** Everything else — middleware does not gate it. */
  | "public";

/** Single source of truth for what the middleware protects. */
export function classifyProxyPath(pathname: string): ProxyPathKind {
  if (pathname.startsWith("/api/uploadthing") || pathname.startsWith("/api/webhooks/stripe")) {
    return "bypass";
  }
  if (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/cards") ||
    pathname.startsWith("/api/dashboard")
  ) {
    return "protected-api";
  }
  if (pathname.startsWith("/admin")) {
    return "admin-page";
  }
  return "public";
}

export type UnauthenticatedPageAction = "redirect-to-sign-in" | "json-401";

/**
 * How the middleware should answer an unauthenticated admin *page* request.
 *
 * Document navigations keep the existing redirect-to-sign-in behavior (Clerk's
 * handshake has already had its chance to refresh an expired session before
 * this runs). RSC and prefetch requests must never be redirected: returning
 * 401 makes the Next.js router fall back to a full document navigation, which
 * lets the Clerk handshake refresh an expired-but-valid session in place
 * instead of bouncing an authenticated admin to the sign-in page mid-session.
 */
export function unauthenticatedAdminPageAction(headers: Headers): UnauthenticatedPageAction {
  return isDocumentRequest(headers) ? "redirect-to-sign-in" : "json-401";
}

function getEmailFromSessionClaims(sessionClaims: unknown): string | null {
  if (!sessionClaims || typeof sessionClaims !== "object") {
    return null;
  }

  const claims = sessionClaims as Record<string, unknown>;
  const candidateKeys = ["email", "primaryEmail", "email_address"] as const;

  for (const key of candidateKeys) {
    const value = claims[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

/** Base64url → UTF-8 without Buffer, so the module stays Edge-safe. */
function decodeBase64Url(value: string): string | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function getEmailFromToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payloadJson = decodeBase64Url(parts[1]);
  if (!payloadJson) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const candidateKeys = ["email", "email_address", "primaryEmail"] as const;

    for (const key of candidateKeys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

const CLERK_EMAIL_CACHE_TTL_MS = 5 * 60 * 1000;
const clerkEmailCache = new Map<string, { emails: string[]; expiresAt: number }>();

/**
 * Fallback email lookup for sessions whose token carries no email claim.
 * Cached per user so repeated admin requests do not hammer the Clerk API.
 */
async function lookupEmailsFromClerk(userId: string): Promise<string[]> {
  const cached = clerkEmailCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.emails;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const emails: string[] = [];
  const primary = user.emailAddresses.find(
    (item) => item.id === user.primaryEmailAddressId,
  )?.emailAddress;
  if (primary) {
    emails.push(primary);
  }
  for (const item of user.emailAddresses) {
    if (item.emailAddress && !emails.includes(item.emailAddress)) {
      emails.push(item.emailAddress);
    }
  }

  clerkEmailCache.set(userId, { emails, expiresAt: Date.now() + CLERK_EMAIL_CACHE_TTL_MS });
  return emails;
}

export type AdminIdentityDecision =
  | { outcome: "ok"; email: string }
  | { outcome: "unauthenticated" }
  | { outcome: "forbidden" }
  | { outcome: "unavailable" };

/**
 * Pure admin authorization decision, shared by every entry point and
 * deliberately independent of the HTTP method — GET and POST always get the
 * same answer for the same session.
 */
export async function evaluateAdminIdentity(
  identity: { userId: string | null; sessionClaims: unknown; token: string | null },
  lookupEmails: (userId: string) => Promise<string[]> = lookupEmailsFromClerk,
): Promise<AdminIdentityDecision> {
  if (!identity.userId || !identity.token) {
    return { outcome: "unauthenticated" };
  }

  const directEmail =
    getEmailFromSessionClaims(identity.sessionClaims) || getEmailFromToken(identity.token);

  if (directEmail) {
    return isAdminEmail(directEmail)
      ? { outcome: "ok", email: directEmail.toLowerCase() }
      : { outcome: "forbidden" };
  }

  let emails: string[];
  try {
    emails = await lookupEmails(identity.userId);
  } catch {
    // Surface the provider outage instead of misreporting it as "not an
    // admin" — the client may retry a 503, but must not treat it as a 403.
    return { outcome: "unavailable" };
  }

  const adminEmail = emails.find((email) => isAdminEmail(email));
  return adminEmail
    ? { outcome: "ok", email: adminEmail.toLowerCase() }
    : { outcome: "forbidden" };
}

const FAILURE_CATEGORY_BY_OUTCOME = {
  unauthenticated: "unauthenticated",
  forbidden: "forbidden",
  unavailable: "unavailable",
} as const;

/**
 * Authenticate + authorize an admin API request and build the auth headers
 * for the backend proxy call. Returns a typed result; on failure, `response`
 * is a ready-to-return JSON error (never a redirect).
 */
export async function requireAdminApi(req: Request): Promise<AdminApiAuth> {
  const url = new URL(req.url);
  const route = url.pathname;
  const method = req.method;
  const requestId = getRequestId(req.headers);

  const fail = (
    category: AdminAuthFailureCategory,
    hasUserId: boolean,
    message?: string,
  ): AdminApiAuthFailure => {
    logAdminAuthFailure({ layer: "route", route, method, category, requestId, hasUserId });
    return {
      ok: false,
      status: ADMIN_AUTH_ERRORS[category].status,
      category,
      response: adminAuthErrorResponse(category, message),
    };
  };

  const backendUrlRaw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const backendUrl = backendUrlRaw.replace(/\/+$/, "");

  if (!backendUrl) {
    return fail("misconfigured", false, "NEXT_PUBLIC_BACKEND_URL is not configured for admin.");
  }

  try {
    if (url.origin === new URL(backendUrl).origin) {
      return fail(
        "misconfigured",
        false,
        "Admin backend URL is pointing to the admin app itself. Set BACKEND_URL to the real backend API origin.",
      );
    }
  } catch {
    // If the backend URL cannot be parsed, let the proxied fetch fail normally.
  }

  const authData = await auth();
  const { userId } = authData;

  if (!userId) {
    return fail("unauthenticated", false);
  }

  const token = await authData.getToken();
  if (!token) {
    return fail("unauthenticated", true);
  }

  const decision = await evaluateAdminIdentity({
    userId,
    sessionClaims: authData.sessionClaims,
    token,
  });

  if (decision.outcome !== "ok") {
    return fail(FAILURE_CATEGORY_BY_OUTCOME[decision.outcome], true);
  }

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "x-admin-user-email": decision.email,
  };

  const internalAdminKey = process.env.ADMIN_INTERNAL_KEY || "";
  if (internalAdminKey) {
    authHeaders["x-admin-internal-key"] = internalAdminKey;
  }

  return { ok: true, userId, email: decision.email, backendUrl, authHeaders };
}

export type AdminPageAuth =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "ok"; email: string; fullName: string | null };

/**
 * Admin check for server-component pages (the admin layout). Same role logic
 * as the API path; the caller maps the result to redirects so the existing
 * login/redirect behavior is preserved.
 */
export async function getAdminPageAuth(): Promise<AdminPageAuth> {
  const { userId } = await auth();
  if (!userId) {
    logAdminAuthFailure({
      layer: "page",
      route: "/admin",
      method: "GET",
      category: "unauthenticated",
      hasUserId: false,
    });
    return { status: "unauthenticated" };
  }

  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses?.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ||
    null;

  if (!primaryEmail || !isAdminEmail(primaryEmail)) {
    logAdminAuthFailure({
      layer: "page",
      route: "/admin",
      method: "GET",
      category: "forbidden",
      hasUserId: true,
    });
    return { status: "forbidden" };
  }

  return { status: "ok", email: primaryEmail, fullName: user?.fullName ?? null };
}
