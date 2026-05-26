import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAILS = [
  "mokich45usa@gmail.com",
  "info@ibpassociations.org",
  "admin@ibpassociations.org",
];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function getEmailFromSessionClaims(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== "object") {
    return null;
  }

  const claims = sessionClaims as Record<string, unknown>;
  const candidateKeys = ["email", "primaryEmail", "email_address"] as const;

  for (const key of candidateKeys) {
    const value = claims[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getEmailFromToken(token: string) {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=");
    const payloadJson = Buffer.from(normalized, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const candidateKeys = ["email", "email_address", "primaryEmail"] as const;

    for (const key of candidateKeys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function getAdminProxyContext(requestUrl?: string) {
  const backendUrlRaw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const backendUrl = backendUrlRaw.replace(/\/+$/, "");
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

  const primaryEmail = getEmailFromSessionClaims(authData.sessionClaims) || getEmailFromToken(token);

  if (primaryEmail && !ADMIN_EMAILS.includes(primaryEmail.toLowerCase())) {
    return {
      backendUrl,
      authHeaders: null,
      error: NextResponse.json({ error: "Forbidden - not an admin" }, { status: 403 }),
    };
  }

  const authHeaders: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
  };

  if (primaryEmail) {
    authHeaders["x-admin-user-email"] = primaryEmail.toLowerCase();
  }

  if (internalAdminKey && primaryEmail) {
    authHeaders["x-admin-internal-key"] = internalAdminKey;
  }

  return {
    backendUrl,
    authHeaders,
    error: null,
  };
}
