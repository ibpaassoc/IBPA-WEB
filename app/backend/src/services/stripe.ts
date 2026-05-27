import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const isProduction = process.env.NODE_ENV === "production";

if (!stripeKey) {
  const message = "CRITICAL ERROR: STRIPE_SECRET_KEY is not configured.";
  if (isProduction) {
    throw new Error(message);
  }
  console.error(`${message} Falling back to a dummy key for local development only.`);
}

// Ensure dummy_key is only used as a fallback local development safeguard
export const stripe = new Stripe(stripeKey || "sk_test_dummy_key_for_local_dev");
