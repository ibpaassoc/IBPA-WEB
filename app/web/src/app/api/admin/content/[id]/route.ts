import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function normalizeContentBody(body: Record<string, any>) {
  if (!Object.prototype.hasOwnProperty.call(body, "coverAspect")) {
    return body;
  }

  if (body.coverAspect === null) {
    return { ...body, coverAspect: null };
  }

  const rawCoverAspect = Number(body.coverAspect);
  const coverAspect = Number.isFinite(rawCoverAspect) && rawCoverAspect > 0 ? rawCoverAspect : null;
  return { ...body, coverAspect };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;
  const { id } = await params;

  try {
    const body = normalizeContentBody(await req.json());
    const res = await fetch(`${backendUrl}/api/content/admin/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      revalidateTag("public-content", "max");
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin content PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminApi(_req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;
  const { id } = await params;

  try {
    const res = await fetch(`${backendUrl}/api/content/admin/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      revalidateTag("public-content", "max");
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin content DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}
