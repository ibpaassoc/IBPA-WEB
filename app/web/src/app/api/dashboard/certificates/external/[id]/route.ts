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

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!getApiUrl()) return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });

    const { id } = await context.params;
    const res = await fetch(`${getApiUrl()}/api/dashboard/certificates/external/${id}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      {
        error: getSafeBackendErrorMessage(
          data,
          text,
          "Unable to remove the uploaded certificate right now.",
        ),
      },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Proxy /dashboard/certificates/external DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
