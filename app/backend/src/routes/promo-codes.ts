import { Router } from "express";
import { requireDb } from "../lib/db";
import { createRateLimiter, getClientAddress } from "../lib/rate-limit";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { listAdminPromoCodes } from "../features/site-settings/server/promo-code.admin.service";
import {
  PromoCodeError,
  createPromoCode,
  deletePromoCode,
  findRedeemablePromoCode,
  listDiscountEnvKeys,
  toPublicPromoCode,
  updatePromoCode,
} from "../features/site-settings/server/promo-code.service";

export const promoCodesRouter = Router();

const validateLimiter = createRateLimiter(12, 10 * 60 * 1000);

function getAdminEmail(req: { header: (name: string) => string | undefined }) {
  return req.header("x-admin-user-email") || null;
}

function handleError(res: any, error: unknown, fallback: string) {
  if (error instanceof PromoCodeError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error instanceof Error && error.message.includes("DATABASE_URL")) {
    return res.status(503).json({ error: error.message });
  }

  console.error(`[Promo codes] ${fallback}`, error);
  return res.status(500).json({ error: fallback });
}

/**
 * Public check used by the membership application form. It only reports
 * whether a code can be redeemed — never the discount amount or the Stripe
 * coupon behind it, which stay server-side until an administrator approves the
 * application for payment.
 */
promoCodesRouter.post("/validate", async (req, res) => {
  const clientIp = getClientAddress(req);
  if (!validateLimiter.hit(`promo:ip:${clientIp}`).allowed) {
    return res.status(429).json({ error: "Too many promo code attempts. Please try again later." });
  }

  try {
    const promoCode = await findRedeemablePromoCode(requireDb(), req.body?.code);
    if (!promoCode) {
      return res.status(404).json({ valid: false, error: "That promo code is not available." });
    }

    return res.json({ valid: true, promoCode: toPublicPromoCode(promoCode) });
  } catch (error) {
    return handleError(res, error, "Failed to check promo code");
  }
});

promoCodesRouter.get("/", adminClerkMiddleware, requireAdminAccess, async (_req, res) => {
  try {
    const items = await listAdminPromoCodes(requireDb());
    return res.json({ items, discountEnvKeys: listDiscountEnvKeys() });
  } catch (error) {
    return handleError(res, error, "Failed to load promo codes");
  }
});

promoCodesRouter.post("/", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const created = await createPromoCode(requireDb(), req.body ?? {}, getAdminEmail(req));
    return res.status(201).json({ promoCode: created });
  } catch (error) {
    return handleError(res, error, "Failed to create promo code");
  }
});

promoCodesRouter.patch("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const updated = await updatePromoCode(
      requireDb(),
      String(req.params.id),
      req.body ?? {},
      getAdminEmail(req),
    );
    return res.json({ promoCode: updated });
  } catch (error) {
    return handleError(res, error, "Failed to update promo code");
  }
});

promoCodesRouter.delete("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    await deletePromoCode(requireDb(), String(req.params.id), getAdminEmail(req));
    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error, "Failed to delete promo code");
  }
});
