import { NextResponse } from "next/server";

function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
}

export async function POST(request: Request) {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
  }

  try {
    const body = await request.arrayBuffer();
    const res = await fetch(`${backendUrl}/api/webhooks/stripe`, {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") || "application/json",
        "stripe-signature": request.headers.get("stripe-signature") || "",
      },
      body,
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[Admin webhook proxy] Failed to proxy Stripe webhook:", error);
    return NextResponse.json({ error: "Failed to proxy Stripe webhook" }, { status: 500 });
  }
}
