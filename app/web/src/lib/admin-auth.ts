const DEFAULT_ADMIN_EMAILS = [
  "mokich45usa@gmail.com",
  "support@ibpassociations.org",
  "admin@ibpassociations.org",
];

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function isAdminEmail(value: unknown) {
  const normalized = normalizeEmail(value);
  return normalized.length > 0 && getAdminEmails().includes(normalized);
}
