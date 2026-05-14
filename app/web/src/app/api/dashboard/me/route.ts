import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

export async function GET() {
  const apiUrl = getServerBackendUrl();

  try {
    if (!apiUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const authData = await auth();
    const { getToken, userId } = authData;

    if (!userId) {
      console.warn("[Proxy /me] No userId from Clerk auth()");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    if (!token) {
      console.warn("[Proxy /me] getToken() returned null for userId:", userId);
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }

    const backendUrl = `${apiUrl}/api/dashboard/me`;
    console.log(`[Proxy /me] Calling backend: ${backendUrl} (userId: ${userId})`);

    const res = await fetch(backendUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      console.log(`[Proxy /me] Success. Certificates count: ${data.certificates?.length ?? 0}`);
      return NextResponse.json(data);
    } else {
      console.error(`[Proxy /me] Backend error. Status: ${res.status}, Body: ${text.substring(0, 500)}`);
      const errorMessage = getSafeBackendErrorMessage(data, text, "Unable to load dashboard data right now.");
      return NextResponse.json(
        { error: errorMessage, backendStatus: res.status },
        { status: res.status }
      );
    }
  } catch (error: any) {
    console.error(`[Proxy /me] CRITICAL ERROR. Backend URL: ${apiUrl}`, error.message, error.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
