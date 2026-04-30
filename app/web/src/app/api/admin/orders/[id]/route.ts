import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextRequest, NextResponse } from "next/server";

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
