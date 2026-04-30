import type { Request } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function getClientAddress(req: Request) {
  const forwardedFor = req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }

  return req.ip || "unknown";
}

export function createRateLimiter(limit: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  return {
    hit(key: string) {
      const now = Date.now();
      const existing = store.get(key);

      if (!existing || existing.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
      }

      if (existing.count >= limit) {
        return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
      }

      existing.count += 1;
      store.set(key, existing);
      return { allowed: true, remaining: limit - existing.count };
    },
  };
}
