import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const res = await fetch(`${backendUrl}/api/cards/${encodeURIComponent(id)}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin API] Failed to reach backend card detail API GET:", error);
    return NextResponse.json(
      { error: `Failed to reach backend card detail API: ${error?.message || "Unknown error"}` },
      { status: 500 },
    );
  }
}
