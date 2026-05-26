import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDashboardApiRoute = createRouteMatcher(["/api/dashboard(.*)"]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
  "/api/cards(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (
    req.nextUrl.pathname.startsWith("/api/uploadthing") ||
    req.nextUrl.pathname.startsWith("/api/webhooks/stripe")
  ) {
    return;
  }

  if (isDashboardApiRoute(req)) {
    const authObject = await auth();

    if (!authObject.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (isAdminRoute(req)) {
    const authObject = await auth();

    if (!authObject.userId) {
      if (req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized - please refresh the page to renew session" }, { status: 401 });
      }
      return authObject.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
