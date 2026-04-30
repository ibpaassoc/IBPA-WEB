import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/public-urls";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(getBackendUrl("/api/contact"), {
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
