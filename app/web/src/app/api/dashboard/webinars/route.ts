import { proxyDashboardWebinarApi } from "@/features/member-webinars/server/dashboard-webinar-proxy";

export async function GET() {
  return proxyDashboardWebinarApi("", "Unable to load webinars right now.");
}
