import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

async function getRequestContext() {
  const { getToken, userId } = await auth();
  const token = userId ? await getToken() : null;
  return { apiUrl: getServerBackendUrl(), token, userId };
}

async function proxyMembershipChange(method: "GET" | "POST", request?: Request) {
  const { apiUrl, token, userId } = await getRequestContext();
  if (!userId || !token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!apiUrl) return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });

  try {
    const body = method === "POST" && request ? await request.text() : undefined;
    const response = await fetch(`${apiUrl}/api/dashboard/membership-change`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
    });
    const { data, text } = await readBackendResponse(response);
    if (response.ok) return NextResponse.json(data, { status: response.status });

    return NextResponse.json(
      { error: getSafeBackendErrorMessage(data, text, "Unable to process the membership change right now.") },
      { status: response.status },
    );
  } catch (error) {
    console.error(`[Proxy membership-change ${method}]`, error);
    return NextResponse.json({ error: "Unable to reach the membership service." }, { status: 500 });
  }
}

export async function GET() {
  return proxyMembershipChange("GET");
}

export async function POST(request: Request) {
  return proxyMembershipChange("POST", request);
}
