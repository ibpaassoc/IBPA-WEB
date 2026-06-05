import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

const getApiUrl = () => getServerBackendUrl();

async function getAuthHeaders() {
  const authData = await auth();
  const { getToken, userId } = authData;
  if (!userId) return null;
  const token = await getToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function PATCH(req: Request) {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!getApiUrl()) {
      return NextResponse.json(
        { error: "Backend URL is not configured." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const backendUrl = `${getApiUrl()}/api/dashboard/profile/services`;

    const res = await fetch(backendUrl, {
      method: "PATCH",
      cache: "no-store",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        services: Array.isArray(body?.services) ? body.services : [],
      }),
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    console.error(
      "[Proxy /profile/services PATCH] Backend error:",
      res.status,
      text.substring(0, 300),
    );

    return NextResponse.json(
      {
        error: getSafeBackendErrorMessage(
          data,
          text,
          "Unable to save profile services right now.",
        ),
      },
      { status: res.status },
    );
  } catch (error: unknown) {
    console.error("[Proxy /profile/services PATCH] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
