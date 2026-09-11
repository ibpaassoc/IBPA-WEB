import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function GET(request: Request) {
  return proxyWebinarApi(request, "/", { includeSearch: true });
}
