import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function POST(request: Request) {
  return proxyWebinarApi(request, "/sync", {
    forwardBody: true,
    method: "POST",
  });
}
