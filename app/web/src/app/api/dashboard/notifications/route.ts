import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { readBackendResponse } from "@/lib/read-backend-response";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function GET() {
  try {
    const authData = await auth();
    const { getToken, userId } = authData;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }

    const backendUrl = `${getApiUrl()}/api/dashboard/notifications`;
    const res = await fetch(backendUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const { data, text } = await readBackendResponse(res);

    if (!res.ok) {
      return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy /dashboard/notifications] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authData = await auth();
    const { getToken, userId } = authData;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const backendUrl = `${getApiUrl()}/api/dashboard/notifications`;
    const res = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    const { data, text } = await readBackendResponse(res);

    if (!res.ok) {
      return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy /dashboard/notifications PATCH] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
