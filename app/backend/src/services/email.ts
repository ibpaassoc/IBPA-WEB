const resendKey = process.env.RESEND_API_KEY;

if (!resendKey) {
  console.error("WARNING: RESEND_API_KEY is not defined in .env! Emails will not be sent.");
}

let resendSingleton: any = null;

function getResendClient() {
  if (resendSingleton) {
    return resendSingleton;
  }

  // Lazy-load the SDK to avoid backend startup hanging on module init.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require("resend");
  resendSingleton = new Resend(resendKey || "re_dummy123456789");
  return resendSingleton;
}

export const resend = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getResendClient();
      return client[prop];
    },
  },
) as ReturnType<typeof getResendClient>;

export const resendFrom = process.env.RESEND_FROM_EMAIL || "IBPA <onboarding@resend.dev>";
export const adminNotificationEmail =
  process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL || "info@ibpassociations.org";
