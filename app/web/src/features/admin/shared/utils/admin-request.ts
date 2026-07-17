const MAX_PLAIN_TEXT_ERROR_LENGTH = 300;

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

  return data as T;
}
