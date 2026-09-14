import { proxyDashboardWebinarApi } from "@/features/member-webinars/server/dashboard-webinar-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; language: string }> },
) {
  const { id, language } = await params;
  return proxyDashboardWebinarApi(
    `/${encodeURIComponent(id)}/subtitles/${encodeURIComponent(language)}`,
    "Unable to load subtitles right now.",
  );
}
