import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const resp = await fetch(`${backendUrl}/api/partner-applications/${encodeURIComponent(id)}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    const { data, text } = await readBackendResponse(resp);

    if (resp.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: resp.status },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load partner application detail." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    let resp = await fetch(`${backendUrl}/api/partner-applications/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders,
      cache: "no-store",
    });

    if (resp.status === 404) {
      resp = await fetch(`${backendUrl}/api/partner-applications/admin/delete`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId: id }),
        cache: "no-store",
      });
    }

    const { data, text } = await readBackendResponse(resp);

    if (resp.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: resp.status },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete partner application." },
      { status: 500 },
    );
  }
}
