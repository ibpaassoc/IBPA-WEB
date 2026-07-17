import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const adminAuth = await requireAdminApi(_req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  try {
    const res = await fetch(`${backendUrl}/api/orders/${id}/resend-payment-link`, {
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
  } catch {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}
