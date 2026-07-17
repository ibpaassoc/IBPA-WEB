import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function GET(request: Request) {
  const adminAuth = await requireAdminApi(request);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

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
      const { data } = await readBackendResponse(res);
      return NextResponse.json(data);
    }

    const { data, text } = await readBackendResponse(res);
    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Public API] Failed to proxy orders POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
