import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  let resolvedParams;
  if (params instanceof Promise) {
    resolvedParams = await params;
  } else {
    resolvedParams = params;
  }

  const id = resolvedParams.id;

  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/orders/${id}/certificate`, {
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
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(_req.url);
  if (error || !authHeaders) return error!;

  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  try {
    const res = await fetch(`${backendUrl}/api/orders/${id}/certificate`, {
      method: "DELETE",
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
