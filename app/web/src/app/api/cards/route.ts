import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const sourceUrl = new URL(req.url);
    const res = await fetch(`${backendUrl}/api/cards${sourceUrl.search}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin API] Failed to reach backend cards API GET:", error);
    return NextResponse.json({ error: `Failed to reach backend cards API: ${error?.message || "Unknown error"}` }, { status: 500 });
  }
}
