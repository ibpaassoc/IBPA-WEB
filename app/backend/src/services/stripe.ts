import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("CRITICAL ERROR: STRIPE_SECRET_KEY is not defined in .env!");
}

// Ensure dummy_key is only used as a fallback local development safeguard
export const stripe = new Stripe(stripeKey || "dummy_key");
