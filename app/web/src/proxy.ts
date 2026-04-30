import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAILS = ["mokich45usa@gmail.com", "info@ibpassociations.org"];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "/";

const isDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
]);

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

  if (isDashboardRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const authObject = await auth();

    if (!authObject.userId) {
      if (req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized - please refresh the page to renew session" }, { status: 401 });
      }
      return authObject.redirectToSignIn();
    }

    const client = await clerkClient();
    const user = await client.users.getUser(authObject.userId);
    const userEmail = user.emailAddresses.find(
      (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      if (req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Forbidden - not an admin" }, { status: 403 });
      }
      return NextResponse.redirect(new URL(LANDING_URL, req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
