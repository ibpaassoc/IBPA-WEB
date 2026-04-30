import type { NextFunction, Request, Response } from "express";
import { clerkClient, clerkMiddleware, clerkOptions, getAuth } from "./clerk";

const DEFAULT_ADMIN_EMAILS = ["mokich45usa@gmail.com", "info@ibpassociations.org"];
const INTERNAL_ADMIN_KEY = process.env.ADMIN_INTERNAL_KEY || "";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const adminClerkMiddleware = clerkMiddleware(clerkOptions);

export async function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const internalKey = req.header("x-admin-internal-key");
    const internalEmail = req.header("x-admin-user-email");

    if (INTERNAL_ADMIN_KEY && internalKey === INTERNAL_ADMIN_KEY) {
      if (!internalEmail || !ADMIN_EMAILS.includes(internalEmail.toLowerCase())) {
        return res.status(403).json({ error: "Forbidden - admin access required" });
      }

      return next();
    }

    const auth = getAuth(req);
    const clerkUserId = auth.userId;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(clerkUserId);
    const primaryEmail = user.emailAddresses.find(
      (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!primaryEmail || !ADMIN_EMAILS.includes(primaryEmail.toLowerCase())) {
      return res.status(403).json({ error: "Forbidden - admin access required" });
    }

    next();
  } catch (error) {
    console.error("[Admin Access] Error:", error);
    return res.status(500).json({ error: "Failed to verify admin access" });
  }
}
