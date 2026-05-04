import { NextResponse } from "next/server";

function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const backendUrl = getBackendUrl();
    const requestUrl = new URL(request.url);
    const stripeSessionId = requestUrl.searchParams.get("session_id");

    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const verifyUrl = new URL(`${backendUrl}/api/orders/verify/${encodeURIComponent(token)}`);
    if (stripeSessionId) {
      verifyUrl.searchParams.set("session_id", stripeSessionId);
    }

    const res = await fetch(verifyUrl, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      const text = await res.text();
      return NextResponse.json({ error: text || "Backend Error" }, { status: res.status });
    }
  } catch (error: any) {
    console.error("[Orders verify proxy] Failed to reach backend:", error);
    return NextResponse.json({ error: "Failed to reach backend verification API" }, { status: 500 });
  }
}
