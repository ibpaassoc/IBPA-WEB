import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

function getBackendUrl() {
  return getServerBackendUrl();
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

    const { data, text } = await readBackendResponse(res);

    if (!res.ok) {
      return NextResponse.json(
        { error: getSafeBackendErrorMessage(data, text, "Unable to verify payment link right now.") },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Orders verify proxy] Failed to reach backend:", error);
    return NextResponse.json({ error: "Failed to reach backend verification API" }, { status: 500 });
  }
}
