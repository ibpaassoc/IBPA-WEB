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

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      return NextResponse.json(
        { error: "Backend URL is not configured." },
        { status: 500 },
      );
    }

    const { id } = await context.params;
    const response = await fetch(`${apiUrl}/api/dashboard/events/${id}/register`, {
      method: "POST",
      cache: "no-store",
      headers,
    });
    const { data, text } = await readBackendResponse(response);

    if (response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      {
        error: getSafeBackendErrorMessage(
          data,
          text,
          "Unable to register for this event right now.",
        ),
      },
      { status: response.status },
    );
  } catch (error) {
    console.error("[Proxy /dashboard/events/register POST] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      return NextResponse.json(
        { error: "Backend URL is not configured." },
        { status: 500 },
      );
    }

    const { id } = await context.params;
    const response = await fetch(`${apiUrl}/api/dashboard/events/${id}/register`, {
      method: "DELETE",
      cache: "no-store",
      headers,
    });
    const { data, text } = await readBackendResponse(response);

    if (response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      {
        error: getSafeBackendErrorMessage(
          data,
          text,
          "Unable to unregister from this event right now.",
        ),
      },
      { status: response.status },
    );
  } catch (error) {
    console.error("[Proxy /dashboard/events/register DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
