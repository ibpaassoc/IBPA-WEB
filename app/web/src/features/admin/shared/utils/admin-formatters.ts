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

export function initialsFromName(value?: string | null) {
  const text = value?.trim();
  if (!text) return "IB";

  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "IB";
}
