import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyWebinarApi(request, `/${encodeURIComponent(id)}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyWebinarApi(request, `/${encodeURIComponent(id)}`, {
    forwardBody: true,
    method: "PATCH",
  });
}
