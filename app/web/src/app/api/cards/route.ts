import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const res = await fetch(`${backendUrl}/api/cards`, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      try {
        const data = await res.json();
        return NextResponse.json(
          { error: data?.error || "Backend Error" },
          { status: res.status },
        );
      } catch {
        const text = await res.text();
        return NextResponse.json({ error: text || "Backend Error" }, { status: res.status });
      }
    }
  } catch (error: any) {
    console.error("[Admin API] Failed to reach backend cards API GET:", error);
    return NextResponse.json({ error: `Failed to reach backend cards API: ${error?.message || "Unknown error"}` }, { status: 500 });
  }
}
