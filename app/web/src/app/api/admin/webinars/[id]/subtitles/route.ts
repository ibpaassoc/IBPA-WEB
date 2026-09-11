import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyWebinarApi(request, `/${encodeURIComponent(id)}/subtitles`, {
    includeSearch: true,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyWebinarApi(request, `/${encodeURIComponent(id)}/subtitles`, {
    forwardBody: true,
    method: "PUT",
  });
}
