import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const certNumber = searchParams.get("certNumber");

    if (!certNumber) {
      return NextResponse.json({ error: "certNumber is required" }, { status: 400 });
    }

    const backendUrl = getServerBackendUrl();
    if (!backendUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const response = await fetch(
      `${backendUrl}/api/members/verify-cert?certNumber=${encodeURIComponent(certNumber)}`
    );

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error || "Failed to verify certificate." },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Failed to verify certificate." }, { status: 500 });
  }
}
