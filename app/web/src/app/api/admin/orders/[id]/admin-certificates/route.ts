import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

type RouteContext =
  | { params: Promise<{ id: string }> }
  | { params: { id: string } };

async function resolveId(context: RouteContext) {
  const resolved = context.params instanceof Promise ? await context.params : context.params;
  return resolved.id;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const id = await resolveId(context);

  try {
    const res = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(id)}/admin-certificates`, {
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
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const id = await resolveId(context);

  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(id)}/admin-certificates`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}
