import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;

  const { id } = await params;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const response = await fetch(
      `${backendUrl}/api/orders/admin/${encodeURIComponent(id)}/team-members`,
      { cache: "no-store", headers: authHeaders },
    );
    const { data, text } = await readBackendResponse(response);

    if (response.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: response.status },
    );
  } catch (error) {
    console.error("[Admin API] Failed to fetch team members:", error);
    return NextResponse.json(
      { error: "Failed to reach backend team members API." },
      { status: 500 },
    );
  }
}
