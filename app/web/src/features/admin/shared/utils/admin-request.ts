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

/**
 * Shared admin fetch helper.
 *
 * - Consumes the response body exactly once (never clones a consumed body).
 * - Tolerates empty and non-JSON bodies on both success and error paths.
 * - Preserves the server's `error`/`details` message on failures.
 * - Cancellation: pass an AbortSignal via `init.signal`.
 * - Never retries; mutations run exactly once.
 */
export async function requestJson<T>(
  url: string,
  init?: RequestInit,
  fallback = "Request failed.",
): Promise<T> {
  const response = await fetch(url, init);

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
