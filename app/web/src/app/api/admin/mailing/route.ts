import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const body = await req.json();

    const resp = await fetch(`${backendUrl}/api/mailing/send`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to send mailing" },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Proxy Mailing Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend mailing API." },
      { status: 500 }
    );
  }
}
