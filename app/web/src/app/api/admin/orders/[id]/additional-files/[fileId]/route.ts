import { getAdminProxyContext } from "@/lib/admin-proxy";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> } | { params: { id: string; fileId: string } },
) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  const resolvedParams = params instanceof Promise ? await params : params;

  try {
    const res = await fetch(
      `${backendUrl}/api/orders/${encodeURIComponent(resolvedParams.id)}/additional-files/${encodeURIComponent(resolvedParams.fileId)}`,
      {
        method: "DELETE",
        headers: authHeaders,
      },
    );

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ error: "Failed to proxy additional file delete request." }, { status: 500 });
  }
}
