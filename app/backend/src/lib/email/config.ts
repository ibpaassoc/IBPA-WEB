type EmailStream = "notifications" | "support" | "applications" | "payments";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const warnedMessages = new Set<string>();

function warnOnce(message: string) {
  if (warnedMessages.has(message)) {
    return;
  }
  warnedMessages.add(message);
  console.warn(message);
}

function parseEnvBoolean(value: string | undefined) {
  if (!value) {
    return false;
  }
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function resolveEmailAddress(
  label: string,
  envKeys: string[],
  fallback: string,
) {
  for (const key of envKeys) {
    const raw = process.env[key];
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim().toLowerCase();
    }
  }

  warnOnce(`[Email Config] ${label} is not configured via ${envKeys.join(" / ")}. Falling back to ${fallback}.`);
  return fallback;
}

function resolveEmailSendingEnabled() {
  const explicit = process.env.EMAIL_SENDING_ENABLED;
  if (typeof explicit === "string" && explicit.trim()) {
    return parseEnvBoolean(explicit);
  }

  const mode = (process.env.NODE_ENV || "").toLowerCase();
  return mode === "production";
}

export const NO_REPLY_EMAIL = resolveEmailAddress("NO_REPLY_EMAIL", ["NO_REPLY_EMAIL"], "no-reply@ibpassociations.org");
export const SUPPORT_EMAIL = resolveEmailAddress("SUPPORT_EMAIL", ["SUPPORT_EMAIL"], "support@ibpassociations.org");
export const APPLICATIONS_EMAIL = resolveEmailAddress(
  "APPLICATIONS_EMAIL",
  ["APPLICATIONS_EMAIL"],
  "applications@ibpassociations.org",
);
export const PAYMENTS_EMAIL = resolveEmailAddress("PAYMENTS_EMAIL", ["PAYMENTS_EMAIL"], "payments@ibpassociations.org");
export const ADMIN_EMAIL = resolveEmailAddress(
  "ADMIN_EMAIL",
  ["ADMIN_EMAIL", "ADMIN_NOTIFICATION_EMAIL"],
  SUPPORT_EMAIL,
);

export const EMAIL_SENDING_ENABLED = resolveEmailSendingEnabled();
export const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || "";

export function formatSender(name: string, email: string) {
  return `${name} <${email}>`;
}

export const EMAIL_FROM = {
  notifications: formatSender("IBPA Notifications", NO_REPLY_EMAIL),
  support: formatSender("IBPA Support", SUPPORT_EMAIL),
  applications: formatSender("IBPA Applications", APPLICATIONS_EMAIL),
  payments: formatSender("IBPA Payments", PAYMENTS_EMAIL),
} as const satisfies Record<EmailStream, string>;

export const EMAIL_REPLY_TO = {
  notifications: SUPPORT_EMAIL,
  support: SUPPORT_EMAIL,
  applications: APPLICATIONS_EMAIL,
  payments: PAYMENTS_EMAIL,
} as const satisfies Record<EmailStream, string>;

if (!EMAIL_SENDING_ENABLED) {
  warnOnce("[Email Config] Email sending is disabled. Set EMAIL_SENDING_ENABLED=true to deliver emails from this environment.");
}

if (!RESEND_API_KEY && EMAIL_SENDING_ENABLED) {
  warnOnce("[Email Config] RESEND_API_KEY is missing while email sending is enabled. Email delivery will fail until configured.");
}
