import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/backend-url";
import { readBackendResponse } from "@/lib/read-backend-response";
import { getSafeBackendErrorMessage } from "@/lib/safe-backend-error";

const getApiUrl = () => getServerBackendUrl();

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
    }

    const membersRes = await fetch(`${apiUrl}/api/members/public`, { cache: "no-store" });
    const { data, text } = await readBackendResponse(membersRes);

    if (!membersRes.ok) {
      return NextResponse.json(
        { error: getSafeBackendErrorMessage(data, text, "Failed to load community members.") },
        { status: membersRes.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy /dashboard/community/members] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
