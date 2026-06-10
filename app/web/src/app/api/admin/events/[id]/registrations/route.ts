import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  const { id } = await params;
  if (error || !authHeaders) return error!;

  try {
    const res = await fetch(
      `${backendUrl}/api/content/admin/events/${encodeURIComponent(id)}/registrations`,
      {
        cache: "no-store",
        headers: authHeaders,
      },
    );
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to reach backend event registrations API." },
      { status: 500 },
    );
  }
}
