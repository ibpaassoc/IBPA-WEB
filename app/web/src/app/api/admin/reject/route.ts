import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(request.url);
  if (error || !authHeaders) return error!;

  try {
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/orders/admin/reject`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach backend reject API." }, { status: 500 });
  }
}
