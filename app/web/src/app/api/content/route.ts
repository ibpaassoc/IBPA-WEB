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
  const target = searchParams.get("target") || defaultTarget;

  try {
    const res = await fetch(`${backendUrl}/api/content/public?type=${type}&target=${target}`, {
      cache: "no-store",
    });
    const { data, text } = await readBackendResponse(res);
    if (!res.ok) {
      return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[Landing content proxy] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}
