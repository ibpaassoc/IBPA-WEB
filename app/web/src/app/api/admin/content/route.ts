import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: Request) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const res = await fetch(`${backendUrl}/api/content/admin`, { cache: "no-store", headers: authHeaders });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[Admin content GET] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/content/admin`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[Admin content POST] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}
