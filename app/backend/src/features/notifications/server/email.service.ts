import { NOTIFICATIONS_REPLY_TO, NO_REPLY_SENDER, SUPPORT_REPLY_TO, SUPPORT_SENDER, sendBatchEmail } from "@/services/email";

export async function sendCampaignEmails(params: {
  subject: string;
  html: string;
  emails: string[];
}) {
  const batchData = params.emails.map((email) => ({
    from: SUPPORT_SENDER,
    to: [email],
    replyTo: SUPPORT_REPLY_TO,
    subject: params.subject,
    html: params.html,
  }));

  const chunks: typeof batchData[] = [];
  for (let index = 0; index < batchData.length; index += 100) {
    chunks.push(batchData.slice(index, index + 100));
  }

  for (const chunk of chunks) {
    const result = await sendBatchEmail(chunk);
    if (result.error) {
      return result;
    }
  }

  return { data: { count: params.emails.length }, error: null as { message: string } | null };
}

export async function buildNotificationEmail(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  return {
    from: NO_REPLY_SENDER,
    to: payload.to,
    replyTo: NOTIFICATIONS_REPLY_TO,
    subject: payload.subject,
    html: payload.html,
  };
}
