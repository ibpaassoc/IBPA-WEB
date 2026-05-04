import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = getServerBackendUrl();

    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const res = await fetch(`${backendUrl}/api/orders/sponsorship/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Backend Error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
