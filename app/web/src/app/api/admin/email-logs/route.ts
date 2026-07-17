import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const resp = await fetch(`${backendUrl}/api/mailing/email-logs`, {
      headers: authHeaders,
      cache: "no-store",
    });

    const { data, text } = await readBackendResponse(resp);

    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.error || text || "Failed to load email logs" },
        { status: resp.status },
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Proxy Email Logs Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend email logs API." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing email log id" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${backendUrl}/api/mailing/email-logs/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    const { data, text } = await readBackendResponse(resp);

    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.error || text || "Failed to delete email log" },
        { status: resp.status },
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Proxy Delete Email Log Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend email logs API." },
      { status: 500 },
    );
  }
}
