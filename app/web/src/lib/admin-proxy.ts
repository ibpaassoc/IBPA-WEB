import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAILS = ["mokich45usa@gmail.com", "info@ibpassociations.org"];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function getAdminProxyContext(requestUrl?: string) {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const internalAdminKey = process.env.ADMIN_INTERNAL_KEY || "";

  if (!backendUrl) {
    return {
      backendUrl: "",
      authHeaders: null,
      error: NextResponse.json(
        { error: "NEXT_PUBLIC_BACKEND_URL is not configured for admin." },
        { status: 500 },
      ),
    };
  }

  if (requestUrl) {
    try {
      const requestOrigin = new URL(requestUrl).origin;
      const backendOrigin = new URL(backendUrl).origin;

      if (requestOrigin === backendOrigin) {
        return {
          backendUrl: "",
          authHeaders: null,
          error: NextResponse.json(
            {
              error:
                "Admin backend URL is pointing to the admin app itself. Set BACKEND_URL to the real backend API origin.",
            },
            { status: 500 },
          ),
        };
      }
    } catch {
      // If URL parsing fails, continue and let the fetch fail normally below.
    }
  }

  if (!internalAdminKey) {
    return {
      backendUrl,
      authHeaders: null,
      error: NextResponse.json(
        { error: "Admin internal key is not configured." },
        { status: 500 },
      ),
    };
  }

  const authData = await auth();
  const { userId, getToken } = authData;

  if (!userId) {
    return {
      backendUrl,
      authHeaders: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = await getToken();
  if (!token) {
    return {
      backendUrl,
      authHeaders: null,
      error: NextResponse.json({ error: "No Token" }, { status: 401 }),
    };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail || !ADMIN_EMAILS.includes(primaryEmail.toLowerCase())) {
    return {
      backendUrl,
      authHeaders: null,
      error: NextResponse.json({ error: "Forbidden - not an admin" }, { status: 403 }),
    };
  }

  return {
    backendUrl,
    authHeaders: {
      "Authorization": `Bearer ${token}`,
      "x-admin-internal-key": internalAdminKey,
      "x-admin-user-email": primaryEmail.toLowerCase(),
    },
    error: null,
  };
}
