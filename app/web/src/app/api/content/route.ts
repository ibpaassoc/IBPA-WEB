import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";

const getApiUrl = () => getServerBackendUrl();

export async function GET(req: NextRequest) {
  const backendUrl = getApiUrl();

  if (!backendUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_BACKEND_URL is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const referer = req.headers.get("referer") || "";
  const defaultTarget = referer.includes("/dashboard") ? "dashboard" : "site";
  const explicitTarget = searchParams.get("target");
  const target = explicitTarget || defaultTarget;
  // Only cacheable when the target is part of the URL — otherwise the response
  // depends on the Referer header and must stay uncached.
  const isCacheable = Boolean(explicitTarget);

  try {
    const res = await fetch(`${backendUrl}/api/content/public?type=${type}&target=${target}`, {
      ...(isCacheable ? { next: { revalidate: 300 } } : { cache: "no-store" as const }),
    });
    const { data, text } = await readBackendResponse(res);
    if (!res.ok) {
      return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
    }
    return NextResponse.json(data, {
      status: res.status,
      headers: isCacheable
        ? { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
        : undefined,
    });
  } catch (error: any) {
    console.error("[Landing content proxy] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}
