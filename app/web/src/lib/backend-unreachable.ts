import { NextResponse } from "next/server";

/**
 * A promo codes request that never reached the backend. A stopped or crashed
 * backend is the common case, and it reads very differently from a real server
 * error — say so, and use 503 so the admin knows to retry rather than hunt for
 * a bug in the promo code itself.
 */
export function backendUnreachableResponse(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause?.code;
  const message = String((error as Error)?.message || "").toLowerCase();
  const isUnreachable =
    cause === "ECONNREFUSED" || cause === "ECONNRESET" || message.includes("fetch failed");

  console.error("[Admin API] Promo codes request failed:", error);

  return NextResponse.json(
    {
      error: isUnreachable
        ? "The backend service is not responding. Check that it is running, then retry."
        : "Could not reach the promo codes API.",
    },
    { status: isUnreachable ? 503 : 500 },
  );
}
