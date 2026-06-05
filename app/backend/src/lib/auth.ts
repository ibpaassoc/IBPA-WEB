import type { Request } from "express";
import { getAuth, getEmailFromSessionClaims } from "../services/clerk";

export function requireAuthenticatedUserId(req: Request) {
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

export function getAuthenticatedEmail(req: Request) {
  const auth = getAuth(req);
  return getEmailFromSessionClaims(auth.sessionClaims);
}
