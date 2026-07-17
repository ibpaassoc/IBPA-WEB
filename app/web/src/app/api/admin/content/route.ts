import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";
import { NextRequest, NextResponse } from "next/server";

function normalizeContentBody(body: Record<string, any>) {
  if (!Object.prototype.hasOwnProperty.call(body, "coverAspect")) {
    return body;
  }

  if (body.coverAspect === null) {
    return { ...body, coverAspect: null };
  }

  const rawCoverAspect = Number(body.coverAspect);
  const coverAspect = Number.isFinite(rawCoverAspect) && rawCoverAspect > 0 ? rawCoverAspect : null;
  return { ...body, coverAspect };
}

export async function GET(req: Request) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const res = await fetch(`${backendUrl}/api/content/admin`, { cache: "no-store", headers: authHeaders });
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin content GET] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi(req);
  if (!adminAuth.ok) return adminAuth.response;
  const { backendUrl, authHeaders } = adminAuth;

  try {
    const body = normalizeContentBody(await req.json());
    const res = await fetch(`${backendUrl}/api/content/admin`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { data, text } = await readBackendResponse(res);

    if (res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(
      { error: data?.error || text || "Backend Error" },
      { status: res.status },
    );
  } catch (error: any) {
    console.error("[Admin content POST] Error:", error);
    return NextResponse.json({ error: "Failed to reach backend content API." }, { status: 500 });
  }
}
