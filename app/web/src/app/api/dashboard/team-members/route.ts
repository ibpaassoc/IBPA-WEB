import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

async function getAuthHeaders() {
  const authData = await auth();
  const { getToken, userId } = authData;
  if (!userId) return null;
  const token = await getToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function getApiUrl() {
  return getServerBackendUrl();
}

export async function GET() {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!getApiUrl()) return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });

    const res = await fetch(`${getApiUrl()}/api/dashboard/team-members`, {
      headers,
      cache: "no-store",
    });
    const { data, text } = await readBackendResponse(res);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: getSafeBackendErrorMessage(data, text, "Unable to load partner team members right now."),
          code: data?.code,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy /dashboard/team-members GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!getApiUrl()) return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const res = await fetch(`${getApiUrl()}/api/dashboard/team-members`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    const { data, text } = await readBackendResponse(res);
    if (!res.ok) {
      return NextResponse.json(
        {
          error: getSafeBackendErrorMessage(data, text, "Unable to invite team member right now."),
          code: data?.code,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("[Proxy /dashboard/team-members POST] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
