import {
  ADMIN_EMAIL,
  APPLICATIONS_EMAIL,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  EMAIL_SENDING_ENABLED,
  NO_REPLY_EMAIL,
  PAYMENTS_EMAIL,
  RESEND_API_KEY,
  SUPPORT_EMAIL,
} from "../lib/email/config";

type SendEmailParams = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
};

type BatchEmailParams = Array<SendEmailParams>;

type SendResponse = {
  data: { id?: string | null } | null;
  error: { message: string } | null;
};

type BatchSendResponse = {
  data: unknown;
  error: { message: string } | null;
};

let resendSingleton: any = null;

function getResendClient() {
  if (resendSingleton) {
    return resendSingleton;
  }

  // Lazy-load the SDK to avoid backend startup hanging on module init.
  const { Resend } = require("resend");
  resendSingleton = new Resend(RESEND_API_KEY || "re_dummy123456789");
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

function getEmailDeliveryError() {
  if (!EMAIL_SENDING_ENABLED) {
    return null;
  }

  if (!RESEND_API_KEY) {
    return { message: "Email delivery is enabled but RESEND_API_KEY is not configured." };
  }

  return null;
}

function dryRunEmailLog(prefix: string, payload: unknown) {
  console.log(`[Email Dry Run] ${prefix}`, payload);
}

export async function sendEmail(payload: SendEmailParams): Promise<SendResponse> {
  const deliveryError = getEmailDeliveryError();
  if (deliveryError) {
    return { data: null, error: deliveryError };
  }

  if (!EMAIL_SENDING_ENABLED) {
    dryRunEmailLog("emails.send", payload);
    return { data: { id: `dry-run-${Date.now()}` }, error: null };
  }

  try {
    return await resend.emails.send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend send error";
    return { data: null, error: { message } };
  }
}

export async function sendBatchEmail(payload: BatchEmailParams): Promise<BatchSendResponse> {
  const deliveryError = getEmailDeliveryError();
  if (deliveryError) {
    return { data: null, error: deliveryError };
  }

  if (!EMAIL_SENDING_ENABLED) {
    dryRunEmailLog("batch.send", { count: payload.length, payload });
    return { data: { count: payload.length }, error: null };
  }

  try {
    return await resend.batch.send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend batch send error";
    return { data: null, error: { message } };
  }
}

export const NO_REPLY_SENDER = EMAIL_FROM.notifications;
export const SUPPORT_SENDER = EMAIL_FROM.support;
export const APPLICATIONS_SENDER = EMAIL_FROM.applications;
export const PAYMENTS_SENDER = EMAIL_FROM.payments;

export const NOTIFICATIONS_REPLY_TO = EMAIL_REPLY_TO.notifications;
export const SUPPORT_REPLY_TO = EMAIL_REPLY_TO.support;
export const APPLICATIONS_REPLY_TO = EMAIL_REPLY_TO.applications;
export const PAYMENTS_REPLY_TO = EMAIL_REPLY_TO.payments;

export const noReplyEmail = NO_REPLY_EMAIL;
export const supportEmail = SUPPORT_EMAIL;
export const applicationsEmail = APPLICATIONS_EMAIL;
export const paymentsEmail = PAYMENTS_EMAIL;
export const adminNotificationEmail = ADMIN_EMAIL;
