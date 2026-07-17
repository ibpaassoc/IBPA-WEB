import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Invalid application edit link." }, { status: 400 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/orders/review-edit?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const { data, text } = await readBackendResponse(res);
    return NextResponse.json(res.ok ? data : { error: data?.error || text || "Could not load this application." }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json({ error: "Could not load this application." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const backendUrl = getServerBackendUrl();
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/orders/review-edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { data, text } = await readBackendResponse(res);
    return NextResponse.json(res.ok ? data : { error: data?.error || text || "Could not save this application." }, {
      status: res.status,
    });
  } catch {
    return NextResponse.json({ error: "Could not save this application." }, { status: 500 });
  }
}
