import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const body = await req.json();
    const resp = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    console.error("[Admin API] Failed to update order PATCH:", err);
    return NextResponse.json(
      { error: "Internal Error", details: err?.message || String(err) },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const resp = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(id)}`, {
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
    console.error("[Admin API] Failed to fetch order GET:", err);
    return NextResponse.json(
      { error: "Internal Error", details: err?.message || String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const resp = await fetch(`${backendUrl}/api/orders/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to delete order" },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Admin API] Failed to delete order DELETE:", err);
    return NextResponse.json(
      { error: "Internal Error", details: err?.message || String(err) },
      { status: 500 },
    );
  }
}
