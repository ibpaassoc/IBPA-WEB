import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const resp = await fetch(`${backendUrl}/api/mailing/email-logs`, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to load email logs" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
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
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing email log id" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${backendUrl}/api/mailing/email-logs/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to delete email log" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Proxy Delete Email Log Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend email logs API." },
      { status: 500 },
    );
  }
}
