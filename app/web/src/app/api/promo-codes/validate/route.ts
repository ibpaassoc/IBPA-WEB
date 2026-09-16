import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { backendUnreachableResponse } from "@/lib/backend-unreachable";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = getServerBackendUrl();

    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const res = await fetch(`${backendUrl}/api/promo-codes/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: body?.code }),
      cache: "no-store",
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { valid: false, error: data?.error || text || "That promo code is not available." },
      { status: res.status },
    );
  } catch (error) {
    return backendUnreachableResponse(error);
  }
}
