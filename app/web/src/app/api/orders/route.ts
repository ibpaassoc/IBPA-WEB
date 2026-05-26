import { NextResponse } from "next/server";
import { getAdminProxyContext } from "@/lib/admin-proxy";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function GET(request: Request) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(request.url);
  if (error || !authHeaders) return error!;

  try {
    const sourceUrl = new URL(request.url);
    const res = await fetch(`${backendUrl}/api/orders${sourceUrl.search}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (res.ok) {
      const { data } = await readBackendResponse(res);
      return NextResponse.json(data);
    }

    const { data, text } = await readBackendResponse(res);
    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin API] Failed to reach backend orders API GET:", error);
    const backendUnavailable =
      error?.cause?.code === "ECONNREFUSED" || String(error?.message || "").toLowerCase().includes("fetch failed");
    return NextResponse.json(
      {
        error: backendUnavailable
          ? "Backend service is temporarily unavailable. Please retry in a few seconds."
          : `Failed to reach backend orders API: ${error?.message || "Unknown error"}`,
      },
      { status: backendUnavailable ? 503 : 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = getServerBackendUrl();

    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const res = await fetch(`${backendUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      const text = await res.text();
      return NextResponse.json({ error: text || "Backend Error" }, { status: res.status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
