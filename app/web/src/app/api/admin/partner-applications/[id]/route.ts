import { NextRequest, NextResponse } from "next/server";
import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

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
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const resp = await fetch(`${backendUrl}/api/partner-applications/${encodeURIComponent(id)}`, {
      method: "DELETE",
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
      { error: err?.message || "Failed to delete partner application." },
      { status: 500 },
    );
  }
}
