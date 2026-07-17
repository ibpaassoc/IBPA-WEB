import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function GET(request: Request) {
  const adminAuth = await requireAdminApi(request);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const sourceUrl = new URL(request.url);
    const res = await fetch(`${backendUrl}/api/partner-applications${sourceUrl.search}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (res.ok) {
      const { data } = await readBackendResponse(res);
      return NextResponse.json(data);
    }

    const { data, text } = await readBackendResponse(res);
    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (err: any) {
    const backendUnavailable =
      err?.cause?.code === "ECONNREFUSED" || String(err?.message || "").toLowerCase().includes("fetch failed");
    return NextResponse.json(
      {
        error: backendUnavailable
          ? "Backend service is temporarily unavailable. Please retry in a few seconds."
          : err?.message || "Failed to load partner applications.",
      },
      { status: backendUnavailable ? 503 : 500 },
    );
  }
}
