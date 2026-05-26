import { createClerkClient, clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

export const clerkClient = createClerkClient({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const clerkOptions = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
};

const CLERK_RETRY_DELAY_MS = 120;
const CLERK_EMAIL_CACHE_TTL_MS = 10 * 60 * 1000;
const clerkEmailCache = new Map<string, { email: string; expiresAt: number }>();
const clerkEmailCandidatesCache = new Map<string, { emails: string[]; expiresAt: number }>();

export function getEmailFromSessionClaims(sessionClaims: unknown) {
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getClerkUserWithRetry(userId: string, attempts = 2) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await clerkClient.users.getUser(userId);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await delay(CLERK_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

export function getPrimaryEmailFromClerkUser(user: {
  emailAddresses?: Array<{ id?: string | null; emailAddress?: string | null }>;
  primaryEmailAddressId?: string | null;
} | null | undefined) {
  if (!user?.emailAddresses || !Array.isArray(user.emailAddresses)) {
    return null;
  }

  const primary = user.emailAddresses.find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)?.emailAddress;
  return typeof primary === "string" && primary.trim().length > 0 ? primary.trim() : null;
}

export function getAllEmailsFromClerkUser(user: {
  emailAddresses?: Array<{ emailAddress?: string | null }>;
} | null | undefined) {
  if (!user?.emailAddresses || !Array.isArray(user.emailAddresses)) {
    return [];
  }

  const unique = new Set<string>();
  for (const item of user.emailAddresses) {
    if (typeof item?.emailAddress !== "string") {
      continue;
    }

    const normalized = item.emailAddress.trim().toLowerCase();
    if (normalized) {
      unique.add(normalized);
    }
  }

  return Array.from(unique);
}

export async function getPrimaryEmailForUser(userId: string) {
  const cached = clerkEmailCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.email;
  }

  const user = await getClerkUserWithRetry(userId);
  const email = getPrimaryEmailFromClerkUser(user);

  if (email) {
    clerkEmailCache.set(userId, {
      email,
      expiresAt: Date.now() + CLERK_EMAIL_CACHE_TTL_MS,
    });
  }

  return email;
}

export async function getEmailCandidatesForUser(userId: string) {
  const cached = clerkEmailCandidatesCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.emails;
  }

  const user = await getClerkUserWithRetry(userId);
  const primaryEmail = getPrimaryEmailFromClerkUser(user);
  const allEmails = getAllEmailsFromClerkUser(user);
  const merged = Array.from(new Set([...(primaryEmail ? [primaryEmail.toLowerCase()] : []), ...allEmails]));

  if (primaryEmail) {
    clerkEmailCache.set(userId, {
      email: primaryEmail,
      expiresAt: Date.now() + CLERK_EMAIL_CACHE_TTL_MS,
    });
  }

  clerkEmailCandidatesCache.set(userId, {
    emails: merged,
    expiresAt: Date.now() + CLERK_EMAIL_CACHE_TTL_MS,
  });

  return merged;
}

// Re-export clerk methods so routes can import from this centralized service
export { clerkMiddleware, requireAuth, getAuth };
