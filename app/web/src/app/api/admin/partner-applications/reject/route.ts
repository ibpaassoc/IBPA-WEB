import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function POST(request: Request) {
  const adminAuth = await requireAdminApi(request);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/partner-applications/admin/reject`, {
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
      { error: err?.message || "Failed to reject partner application." },
      { status: 500 },
    );
  }
}
