import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";

function getBackendUrl() {
  return getServerBackendUrl();
}

export async function POST(request: Request) {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
  }

  try {
    if (new URL(request.url).origin === new URL(backendUrl).origin) {
      return NextResponse.json(
        { error: "BACKEND_URL cannot point to the public web app for Stripe webhooks." },
        { status: 500 },
      );
    }

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
    console.error("[Stripe webhook proxy] Failed to proxy Stripe webhook:", error);
    return NextResponse.json({ error: "Failed to proxy Stripe webhook" }, { status: 500 });
  }
}
