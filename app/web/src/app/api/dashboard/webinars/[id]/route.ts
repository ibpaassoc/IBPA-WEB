import { proxyDashboardWebinarApi } from "@/features/member-webinars/server/dashboard-webinar-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyDashboardWebinarApi(
    `/${encodeURIComponent(id)}`,
    "Unable to load this webinar right now.",
  );
}
