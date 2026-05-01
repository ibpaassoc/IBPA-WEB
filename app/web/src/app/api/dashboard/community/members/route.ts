import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { readBackendResponse } from "@/lib/read-backend-response";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function GET() {
  try {
    const { getToken, userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }

    const apiUrl = getApiUrl();
    const accessRes = await fetch(`${apiUrl}/api/dashboard/me`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!accessRes.ok) {
      const { data, text } = await readBackendResponse(accessRes);
      return NextResponse.json(
        { error: data?.error || text || "Dashboard access is required." },
        { status: accessRes.status },
      );
    }

    const membersRes = await fetch(`${apiUrl}/api/members/public`, { cache: "no-store" });
    const { data, text } = await readBackendResponse(membersRes);

    if (!membersRes.ok) {
      return NextResponse.json(
        { error: data?.error || text || "Failed to load community members." },
        { status: membersRes.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy /dashboard/community/members] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
