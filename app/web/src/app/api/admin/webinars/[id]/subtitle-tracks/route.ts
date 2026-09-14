import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyWebinarApi(request, `/${encodeURIComponent(id)}/subtitle-tracks`, {
    forwardBody: true,
    method: "PUT",
  });
}
