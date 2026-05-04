import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = getServerBackendUrl();
    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : { error: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error || "Failed to submit contact form." },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Failed to submit contact form." }, { status: 500 });
  }
}
