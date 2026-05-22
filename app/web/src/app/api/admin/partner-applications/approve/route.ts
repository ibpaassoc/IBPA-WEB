import { NextResponse } from "next/server";
import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function POST(request: Request) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(request.url);
  if (error || !authHeaders) return error!;

  try {
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/partner-applications/admin/approve`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to approve partner application." },
      { status: 500 },
    );
  }
}
