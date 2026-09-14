import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyWebinarApi(
    request,
    `/${encodeURIComponent(id)}/subtitle-versions/english-ai`,
    { forwardBody: true, method: "POST" },
  );
}
