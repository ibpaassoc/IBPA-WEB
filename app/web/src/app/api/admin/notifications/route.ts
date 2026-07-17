import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

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

    const { data, text } = await readBackendResponse(resp);

    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.error || text || "Failed to send dashboard notifications" },
        { status: resp.status },
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Proxy Dashboard Notification Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend notifications API." },
      { status: 500 },
    );
  }
}
