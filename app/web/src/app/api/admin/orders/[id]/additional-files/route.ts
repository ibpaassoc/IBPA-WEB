import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const resolvedParams = params instanceof Promise ? await params : params;

  try {
    const res = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(resolvedParams.id)}/additional-files`, {
      headers: authHeaders,
      cache: "no-store",
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ error: "Failed to reach backend additional files API." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const resolvedParams = params instanceof Promise ? await params : params;

  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(resolvedParams.id)}/additional-files`, {
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
  } catch {
    return NextResponse.json({ error: "Failed to proxy additional files request." }, { status: 500 });
  }
}
