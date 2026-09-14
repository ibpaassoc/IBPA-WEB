import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

/**
 * Forwards a member dashboard webinar request with the member's Clerk token.
 * Authorization (publication and access rules) is enforced by the backend.
 */
export async function proxyDashboardWebinarApi(
  backendPath: string,
  fallbackError: string,
) {
  try {
    const authData = await auth();
    const token = authData.userId ? await authData.getToken() : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = getServerBackendUrl();
    if (!apiUrl) {
      return NextResponse.json(
        { error: "Backend URL is not configured." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${apiUrl}/api/dashboard/webinars${backendPath}`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const { data, text } = await readBackendResponse(response);
    const headers = { "Cache-Control": "private, no-store" };

    if (response.ok) {
      return NextResponse.json(data, { headers });
    }

    return NextResponse.json(
      {
        error: getSafeBackendErrorMessage(data, text, fallbackError),
        code:
          data && typeof data === "object" && "code" in data
            ? (data as { code?: unknown }).code
            : undefined,
      },
      { status: response.status, headers },
    );
  } catch (error) {
    console.error("[Proxy /dashboard/webinars] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
