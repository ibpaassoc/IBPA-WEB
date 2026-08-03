const MAX_PLAIN_TEXT_ERROR_LENGTH = 300;

/**
 * Admin pages share a long-lived client-side cache while the admin workspace is
 * open. Keeping this in memory deliberately avoids persisting sensitive member
 * data to disk, and a full browser reload naturally starts a fresh session.
 */
export const ADMIN_READ_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ADMIN_READ_CACHE_ENTRIES = 100;

type CachedAdminResponse = {
  expiresAt: number;
  value: unknown;
};

const adminReadCache = new Map<string, CachedAdminResponse>();
const pendingAdminReads = new Map<string, Promise<unknown>>();
let adminReadCacheEpoch = 0;

/** Clear all cached admin data before an explicit refresh or after a mutation. */
export function clearAdminReadCache() {
  adminReadCacheEpoch += 1;
  adminReadCache.clear();
  pendingAdminReads.clear();
}

function isCacheableRead(init?: RequestInit) {
  return (
    typeof window !== "undefined" &&
    (!init?.method || init.method.toUpperCase() === "GET") &&
    !init?.body &&
    !init?.signal
  );
}

function cacheAdminRead(url: string, value: unknown) {
  const now = Date.now();

  for (const [key, entry] of adminReadCache) {
    if (entry.expiresAt <= now) adminReadCache.delete(key);
  }

  while (adminReadCache.size >= MAX_ADMIN_READ_CACHE_ENTRIES) {
    const oldestKey = adminReadCache.keys().next().value;
    if (oldestKey === undefined) break;
    adminReadCache.delete(oldestKey);
  }

  adminReadCache.set(url, {
    expiresAt: now + ADMIN_READ_CACHE_TTL_MS,
    value,
  });
}

function readErrorMessage(data: unknown, raw: string, fallback: string) {
  if (data && typeof data === "object") {
    const { error, details } = data as { error?: unknown; details?: unknown };
    if (typeof error === "string" && error.trim()) return error;
    if (typeof details === "string" && details.trim()) return details;
  }

  // A short plain-text body (not an HTML error page) is still a meaningful
  // server message; anything else falls back to the feature-provided text.
  const text = raw.trim();
  if (text && !text.startsWith("<") && text.length <= MAX_PLAIN_TEXT_ERROR_LENGTH) {
    return text;
  }

  return fallback;
}

type ClerkSessionLike = {
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>;
};

function getClerkSession(): ClerkSessionLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  const clerk = (window as { Clerk?: { session?: ClerkSessionLike | null } }).Clerk;
  return clerk?.session ?? null;
}

/**
 * Ask clerk-js for a fresh session token. Minting a token also rewrites the
 * `__session` cookie the server reads, so a subsequent same-origin request
 * carries a valid session again. Returns true only if a token was issued.
 */
async function refreshClerkSession(): Promise<boolean> {
  const session = getClerkSession();
  if (!session) {
    return false;
  }

  try {
    return Boolean(await session.getToken({ skipCache: true }));
  } catch {
    return false;
  }
}

/** Only bodies that can be sent twice are eligible for the one-time retry. */
function isRepeatableBody(body: RequestInit["body"]): boolean {
  return (
    body == null ||
    typeof body === "string" ||
    body instanceof URLSearchParams ||
    (typeof FormData !== "undefined" && body instanceof FormData)
  );
}

/**
 * Shared admin fetch helper.
 *
 * - Consumes the response body exactly once (never clones a consumed body).
 * - Tolerates empty and non-JSON bodies on both success and error paths.
 * - Preserves the server's `error`/`details` message on failures.
 * - Cancellation: pass an AbortSignal via `init.signal`.
 * - On a 401 it refreshes the Clerk session once and retries the request one
 *   time. This is safe for mutations: every 401 in this stack is issued by an
 *   auth gate *before* the handler or backend runs, so the rejected request
 *   had no side effects. A 403 (or any other status) is never retried, so a
 *   real "not an admin" answer can never turn into a refresh loop.
 */
export async function requestJson<T>(
  url: string,
  init?: RequestInit,
  fallback = "Request failed.",
): Promise<T> {
  if (isCacheableRead(init)) {
    const cached = adminReadCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    if (cached) adminReadCache.delete(url);

    const pending = pendingAdminReads.get(url);
    if (pending) return pending as Promise<T>;

    const requestEpoch = adminReadCacheEpoch;
    const request = requestJsonUncached<T>(url, init, fallback)
      .then((value) => {
        // A force refresh may finish before an older request. Do not let that
        // older response repopulate the newly cleared cache.
        if (requestEpoch === adminReadCacheEpoch) {
          cacheAdminRead(url, value);
        }
        return value;
      })
      .finally(() => {
        if (pendingAdminReads.get(url) === request) {
          pendingAdminReads.delete(url);
        }
      });

    pendingAdminReads.set(url, request);
    return request;
  }

  return requestJsonUncached<T>(url, init, fallback);
}

async function requestJsonUncached<T>(
  url: string,
  init?: RequestInit,
  fallback = "Request failed.",
): Promise<T> {
  let response = await fetch(url, init);

  if (response.status === 401 && isRepeatableBody(init?.body) && (await refreshClerkSession())) {
    response = await fetch(url, init);
  }

  let data: unknown = null;
  const raw = await response.text();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(readErrorMessage(data, raw, fallback));
  }

  // Admin mutations can affect several dashboards at once (for example an
  // approval changes applications, payments, members, and the overview).
  // Invalidate only after a successful response so failed edits do not discard
  // a useful cache.
  if (init?.method && init.method.toUpperCase() !== "GET") {
    clearAdminReadCache();
  }

  return data as T;
}
