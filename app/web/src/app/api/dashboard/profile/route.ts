import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { readBackendResponse } from "@/lib/read-backend-response";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function getAuthHeaders() {
  const authData = await auth();
  const { getToken, userId } = authData;
  if (!userId) return null;
  const token = await getToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function GET() {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const backendUrl = `${getApiUrl()}/api/dashboard/profile`;
    const res = await fetch(backendUrl, { headers, cache: "no-store" });
    const { data, text } = await readBackendResponse(res);
    
    if (res.ok) {
      return NextResponse.json(data);
    } else {
      console.error(`[Proxy /profile GET] Backend error:`, res.status, text.substring(0, 300));
      return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
    }
  } catch (error: any) {
    console.error(`[Proxy /profile GET] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const backendUrl = `${getApiUrl()}/api/dashboard/profile`;

    const res = await fetch(backendUrl, {
      method: "PATCH",
      cache: "no-store",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    } else {
      console.error(`[Proxy /profile PATCH] Backend error:`, res.status, text.substring(0, 300));
      return NextResponse.json({ error: data?.error || text || "Backend Error" }, { status: res.status });
    }
  } catch (error: any) {
    console.error(`[Proxy /profile PATCH] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
