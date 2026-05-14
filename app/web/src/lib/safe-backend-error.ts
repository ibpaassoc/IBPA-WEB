type BackendErrorData = {
  error?: unknown;
  message?: unknown;
};

const HTML_LIKE_PATTERN = /<!doctype|<html|<body|<head|<pre|<\/?[a-z][\s\S]*>/i;
const STACK_LIKE_PATTERN = /node_modules| at [A-Za-z0-9_$]+\s*\(|[A-Za-z]:\\/i;

function toCleanString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeBackendErrorMessage(input: unknown, fallback: string) {
  if (typeof input !== "string") {
    return fallback;
  }

  const raw = input.trim();
  if (!raw) {
    return fallback;
  }

  if (raw.toLowerCase().includes("publishable key is missing")) {
    return "Authentication service is temporarily unavailable. Please try again in a moment.";
  }

  if (HTML_LIKE_PATTERN.test(raw) || STACK_LIKE_PATTERN.test(raw)) {
    return fallback;
  }

  const cleaned = toCleanString(raw);
  if (!cleaned) {
    return fallback;
  }

  if (cleaned.length > 260) {
    return fallback;
  }

  return cleaned;
}

export function getSafeBackendErrorMessage(
  data: BackendErrorData | null,
  text: string,
  fallback: string,
) {
  const messageCandidate =
    typeof data?.error === "string"
      ? data.error
      : typeof data?.message === "string"
        ? data.message
        : text;

  return sanitizeBackendErrorMessage(messageCandidate, fallback);
}

