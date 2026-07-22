import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { deleteUploadThingFile } from "@/lib/uploadthing-storage";
import { NextRequest, NextResponse } from "next/server";

type RouteContext =
  | { params: Promise<{ id: string; certId: string }> }
  | { params: { id: string; certId: string } };

async function resolveParams(context: RouteContext) {
  return context.params instanceof Promise ? await context.params : context.params;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const { id, certId } = await resolveParams(context);

  try {
    const body = await req.json();
    const res = await fetch(
      `${backendUrl}/api/orders/${encodeURIComponent(id)}/admin-certificates/${encodeURIComponent(certId)}`,
      {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      // A superseded file (returned server-side only) is removed from storage
      // best-effort. The storage key is never forwarded to the browser.
      const { previousFileKey, ...safe } = data ?? {};
      await deleteUploadThingFile(previousFileKey);
      return NextResponse.json(safe);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const { id, certId } = await resolveParams(context);

  try {
    const res = await fetch(
      `${backendUrl}/api/orders/${encodeURIComponent(id)}/admin-certificates/${encodeURIComponent(certId)}`,
      {
        method: "DELETE",
        headers: authHeaders,
      },
    );
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      const { removedFileKey, ...safe } = data ?? {};
      await deleteUploadThingFile(removedFileKey);
      return NextResponse.json(safe);
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}
