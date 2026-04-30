import { getAdminProxyContext } from "@/lib/admin-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

  try {
    const body = await req.json();

    const resp = await fetch(`${backendUrl}/api/mailing/notifications/send`, {
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
        { error: errorData.error || "Failed to send dashboard notifications" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Proxy Dashboard Notification Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend notifications API." },
      { status: 500 },
    );
  }
}
