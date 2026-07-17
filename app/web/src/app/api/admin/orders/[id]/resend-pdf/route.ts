import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  let resolvedParams;
  if (params instanceof Promise) {
    resolvedParams = await params;
  } else {
    resolvedParams = params;
  }

  const id = resolvedParams.id;

  try {
    const res = await fetch(`${backendUrl}/api/orders/${id}/resend-pdf`, {
      method: "POST",
      headers: authHeaders,
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}
