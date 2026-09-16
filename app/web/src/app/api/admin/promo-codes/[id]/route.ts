import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { backendUnreachableResponse } from "@/lib/backend-unreachable";

type RouteContext = { params: Promise<{ id: string }> } | { params: { id: string } };

async function resolveId(context: RouteContext) {
  const resolved = context.params instanceof Promise ? await context.params : context.params;
  return encodeURIComponent(resolved.id);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminAuth = await requireAdminApi(request);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/promo-codes/${await resolveId(context)}`, {
      method: "PATCH",
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
  } catch (error) {
    return backendUnreachableResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminAuth = await requireAdminApi(request);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const res = await fetch(`${backendUrl}/api/promo-codes/${await resolveId(context)}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error) {
    return backendUnreachableResponse(error);
  }
}
