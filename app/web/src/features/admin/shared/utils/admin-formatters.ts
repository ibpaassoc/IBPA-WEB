const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatAdminDate(value?: string | Date | null) {
  if (!value) return "Not set";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : shortDateFormatter.format(date);
}

export function formatAdminDateTime(value?: string | Date | null) {
  if (!value) return "Not set";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : dateTimeFormatter.format(date);
}

export function formatAdminTime(value?: string | Date | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatAdminCount(count: number, singular: string, plural = `${singular}s`) {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount.toLocaleString("en-US")} ${safeCount === 1 ? singular : plural}`;
}

export function formatNullableText(value: unknown, fallback = "Not provided") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const usdFormatterCents = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

/**
 * Format a USD amount. Accepts either a number of dollars, a number of cents
 * (when `cents` is true), or a pre-formatted string like "$199" or "$1,500/year".
 *
 * Returns null when the input cannot be resolved to a numeric amount, so callers
 * can decide whether to show "Amount unavailable" or hide the field.
 */
export function formatAdminUsd(
  value: number | string | null | undefined,
  options: { cents?: boolean; preserveCents?: boolean } = {},
): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Already formatted as "$X" — accept verbatim and strip trailing "/year" etc.
    if (trimmed.startsWith("$")) return trimmed.replace(/\s*\/\s*year$/i, "");
    const parsed = Number(trimmed.replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(parsed)) return null;
    return options.preserveCents ? usdFormatterCents.format(parsed) : usdFormatter.format(parsed);
  }

  if (!Number.isFinite(value)) return null;
  const dollars = options.cents ? value / 100 : value;
  return options.preserveCents ? usdFormatterCents.format(dollars) : usdFormatter.format(dollars);
}

export function initialsFromName(value?: string | null) {
  const text = value?.trim();
  if (!text) return "IB";

  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "IB";
}
