import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import {
  clerkMiddleware,
  clerkOptions,
  getAuth,
  getEmailFromSessionClaims,
  getEmailCandidatesForUser,
} from "./clerk";
import { requireDb, users } from "../lib/db";

const DEFAULT_ADMIN_EMAILS = [
  "mokich45usa@gmail.com",
  "info@ibpassociations.org",
  "admin@ibpassociations.org",
];
const INTERNAL_ADMIN_KEY = process.env.ADMIN_INTERNAL_KEY || "";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isAdminEmail(value: unknown) {
  const normalized = normalizeEmail(value);
  return normalized.length > 0 && ADMIN_EMAILS.includes(normalized);
}

function getEmailFromAuthHeader(authorizationHeader: string | undefined) {
  if (!authorizationHeader || !authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice(7).trim();
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

export const adminClerkMiddleware = clerkMiddleware(clerkOptions);

export async function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const internalKey = req.header("x-admin-internal-key");
    const internalEmail = req.header("x-admin-user-email");

    if (INTERNAL_ADMIN_KEY && internalKey === INTERNAL_ADMIN_KEY) {
      if (!isAdminEmail(internalEmail)) {
        return res.status(403).json({ error: "Forbidden - admin access required" });
      }

      return next();
    }

    const auth = getAuth(req);
    const clerkUserId = auth.userId;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const candidateEmails = new Set<string>();
    const claimsEmail = getEmailFromSessionClaims(auth.sessionClaims);
    const tokenEmail = getEmailFromAuthHeader(req.header("authorization"));
    const trustedProxyEmail =
      INTERNAL_ADMIN_KEY && internalKey === INTERNAL_ADMIN_KEY ? internalEmail : null;

    for (const candidate of [claimsEmail, tokenEmail, trustedProxyEmail]) {
      const normalized = normalizeEmail(candidate);
      if (normalized) {
        candidateEmails.add(normalized);
      }
    }

    if (Array.from(candidateEmails).some((email) => isAdminEmail(email))) {
      return next();
    }

    try {
      const db = requireDb();
      const [storedUser] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      const normalizedStored = normalizeEmail(storedUser?.email);
      if (normalizedStored) {
        candidateEmails.add(normalizedStored);
      }
    } catch (error) {
      console.error("[Admin Access] DB lookup failed:", error);
    }

    if (Array.from(candidateEmails).some((email) => isAdminEmail(email))) {
      return next();
    }

    let clerkLookupError: unknown = null;
    try {
      const clerkEmails = await getEmailCandidatesForUser(clerkUserId);
      for (const email of clerkEmails) {
        const normalized = normalizeEmail(email);
        if (normalized) {
          candidateEmails.add(normalized);
        }
      }
    } catch (error) {
      clerkLookupError = error;
      console.error("[Admin Access] Clerk lookup failed:", error);
    }

    if (Array.from(candidateEmails).some((email) => isAdminEmail(email))) {
      return next();
    }

    if (candidateEmails.size === 0 && clerkLookupError) {
      return res.status(503).json({ error: "Auth provider temporarily unavailable. Please retry." });
    }

    return res.status(403).json({ error: "Forbidden - admin access required" });
  } catch (error) {
    console.error("[Admin Access] Error:", error);
    return res.status(503).json({ error: "Auth provider temporarily unavailable. Please retry." });
  }
}
