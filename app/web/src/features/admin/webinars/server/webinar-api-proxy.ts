import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { readBackendResponse } from "@/lib/read-backend-response";

export async function proxyWebinarApi(
  request: Request,
  backendPath: string,
  options: {
    body?: unknown;
    forwardBody?: boolean;
    includeSearch?: boolean;
    method?: string;
  } = {},
) {
  const adminAuth = await requireAdminApi(request);
  if (!adminAuth.ok) return adminAuth.response;

  const sourceUrl = new URL(request.url);
  const search = options.includeSearch ? sourceUrl.search : "";
  let body = options.body;
  if (options.forwardBody) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
  }
  const hasBody = body !== undefined;

  try {
    const response = await fetch(
      `${adminAuth.backendUrl}/api/webinars${backendPath}${search}`,
      {
        method: options.method || request.method,
        headers: {
          ...adminAuth.authHeaders,
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
        },
        body: hasBody ? JSON.stringify(body) : undefined,
        cache: "no-store",
      },
    );
    const { data, text } = await readBackendResponse(response);
    return NextResponse.json(
      response.ok
        ? data
        : { error: data?.error || text || "Webinar request failed." },
      { status: response.status },
    );
  } catch (error) {
    console.error("[Admin webinars proxy] Request failed", {
      path: backendPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "The webinar service is temporarily unavailable. Please retry.",
      },
      { status: 503 },
    );
  }
}
