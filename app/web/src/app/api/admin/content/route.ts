import { getAdminProxyContext } from "@/lib/admin-proxy";
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
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

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
  const { backendUrl, authHeaders, error } = await getAdminProxyContext(req.url);
  if (error || !authHeaders) return error!;

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
