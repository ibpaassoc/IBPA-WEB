import { proxyWebinarApi } from "@/features/admin/webinars/server/webinar-api-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params;
  return proxyWebinarApi(
    request,
    `/${encodeURIComponent(id)}/subtitle-versions/${encodeURIComponent(versionId)}/retry`,
    { body: {}, method: "POST" },
  );
}
