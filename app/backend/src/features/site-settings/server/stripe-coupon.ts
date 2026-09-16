import { stripe } from "@/services/stripe";

const CACHE_TTL_MS = 60 * 1000;
const MAX_REASON_LENGTH = 220;

export type CouponCheck = {
  usable: boolean;
  /** Stripe's own explanation when it will not accept the coupon. */
  reason: string | null;
};

const cache = new Map<string, { check: CouponCheck; expiresAt: number }>();

/**
 * Ask Stripe whether it will accept this coupon on a checkout session.
 *
 * A promo code points at a coupon id held in the server environment, so the two
 * can drift: the coupon may be deleted, expired, redeemed out, or belong to the
 * other Stripe mode (a live coupon id with a test key, say). The environment
 * variable being set proves none of that, so the answer — and Stripe's reason
 * when it says no — comes from Stripe. Results are cached briefly so one page
 * load never fans out repeat calls.
 */
export async function describeCoupon(couponId: string): Promise<CouponCheck> {
  const cached = cache.get(couponId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.check;
  }

  let check: CouponCheck;
  try {
    const coupon = await stripe.coupons.retrieve(couponId);
    check =
      coupon.valid === false
        ? { usable: false, reason: "Stripe reports this coupon is no longer valid." }
        : { usable: true, reason: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Promo codes] Stripe rejected coupon ${couponId}:`, message);
    check = { usable: false, reason: message.slice(0, MAX_REASON_LENGTH) };
  }

  cache.set(couponId, { check, expiresAt: Date.now() + CACHE_TTL_MS });
  return check;
}

export async function isCouponUsable(couponId: string): Promise<boolean> {
  return (await describeCoupon(couponId)).usable;
}

/** Drop a cached answer so the next check asks Stripe again. */
export function forgetCoupon(couponId: string) {
  cache.delete(couponId);
}
