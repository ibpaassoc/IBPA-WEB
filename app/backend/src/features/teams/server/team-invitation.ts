import {
  NOTIFICATIONS_REPLY_TO,
  NO_REPLY_SENDER,
  sendEmailOrThrow,
  type SendEmailParams,
} from "@/services/email";

type UrlEnvironment = {
  DASHBOARD_URL?: string;
  FRONTEND_URL?: string;
  NODE_ENV?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getTeamInvitationBaseUrl(
  environment: UrlEnvironment = process.env,
) {
  const configured = environment.DASHBOARD_URL || environment.FRONTEND_URL;
  const rawUrl =
    configured ||
    (environment.NODE_ENV === "production" ? "" : "http://localhost:3002");

  if (!rawUrl) {
    throw new Error(
      "DASHBOARD_URL or FRONTEND_URL is not configured for team invitations.",
    );
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(
      "DASHBOARD_URL or FRONTEND_URL is not a valid absolute URL.",
    );
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      "DASHBOARD_URL or FRONTEND_URL must use http or https.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

export function buildTeamAccountSetupUrl(params: {
  email: string;
  environment?: UrlEnvironment;
}) {
  const setupUrl = new URL(
    "/team-invite",
    getTeamInvitationBaseUrl(params.environment),
  );
  setupUrl.searchParams.set("email", params.email.trim().toLowerCase());
  return setupUrl.toString();
}

export function buildTeamInvitationEmail(params: {
  email: string;
  fullName: string;
  role: string;
  teamName: string;
  certificateNumber: string;
  setupUrl: string;
}): SendEmailParams {
  const subjectTeamName = params.teamName.replace(/[\r\n]+/g, " ").trim();

  return {
    from: NO_REPLY_SENDER,
    to: params.email.trim().toLowerCase(),
    replyTo: NOTIFICATIONS_REPLY_TO,
    subject: `You're invited to join ${subjectTeamName} on IBPA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; border: 1px solid #dbe4ee; border-radius: 24px; color: #10203b;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #4c7d9d;">IBPA team invitation</p>
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.15;">Welcome, ${escapeHtml(params.fullName)}!</h1>
        <p>${escapeHtml(params.teamName)} invited you to join its IBPA account as <strong>${escapeHtml(params.role)}</strong>.</p>
        <div style="margin: 24px 0; padding: 18px; background: #f4f9fd; border-radius: 16px;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em;">Your team member certificate number</p>
          <p style="margin: 0; font-size: 19px; font-weight: 700;">${escapeHtml(params.certificateNumber)}</p>
        </div>
        <p>Create your account with <strong>${escapeHtml(params.email.trim().toLowerCase())}</strong>. Your dashboard access is connected to this email address.</p>
        <p style="margin: 28px 0;">
          <a href="${escapeHtml(params.setupUrl)}" style="display: inline-block; background: #10203b; color: #ffffff; padding: 14px 22px; border-radius: 12px; text-decoration: none; font-weight: 700;">Set up my team member account</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">If you already have an IBPA login with this email, use the same button and sign in instead.</p>
      </div>
    `,
  };
}

export async function sendTeamInvitationEmail(
  params: Parameters<typeof buildTeamInvitationEmail>[0],
) {
  return sendEmailOrThrow(buildTeamInvitationEmail(params));
}
