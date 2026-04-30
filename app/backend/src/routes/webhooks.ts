import { Router } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { requireDb, orders, certificates, users } from "../lib/db";
import { and, eq, sql } from "drizzle-orm";
import { stripe } from "../services/stripe";
import { resend, resendFrom } from "../services/email";

export const webhooksRouter = Router();

async function markOrderPaid(orderId: string, stripeSessionId?: string | null) {
  const db = requireDb();

  await db
    .update(orders)
    .set({
      status: "paid",
      ...(stripeSessionId ? { stripeSessionId } : {}),
    })
    .where(eq(orders.id, orderId));
}

async function updateCertificateExpiry(orderId: string, expiresAt: Date) {
  const db = requireDb();

  await db
    .update(certificates)
    .set({ expiresAt })
    .where(eq(certificates.orderId, orderId));
}

async function getMembershipSubscriptionExpiry(subscriptionId: string) {
  const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as Stripe.Subscription;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  if (!currentPeriodEnd) {
    throw new Error(`Unable to determine current_period_end for subscription ${subscriptionId}`);
  }

  return {
    subscription,
    expiresAt: new Date(currentPeriodEnd * 1000),
  };
}

async function sendDashboardActivationEmail(params: {
  email: string;
  name: string;
  secureToken: string;
}) {
  const { email, name, secureToken } = params;
  const dashboardUrl = process.env.DASHBOARD_URL || process.env.FRONTEND_URL || "";
  const activationUrl = `${dashboardUrl.replace(/\/$/, "")}/success?token=${secureToken}`;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Complete your IBPA dashboard access",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">
          IBPA Dashboard Access
        </p>
        <h1 style="margin: 0 0 18px; font-size: 30px; line-height: 1.1;">
          Payment confirmed
        </h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Hello ${name || "there"},
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Your IBPA payment has been received. The final step is to activate your personal dashboard using the same email address you used in your application.
        </p>
        <div style="margin: 28px 0;">
          <a href="${activationUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
            Open dashboard access
          </a>
        </div>
        <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.7; color: #475569;">
          If you already have an account, sign in. If not, create one with this email: <strong>${email}</strong>.
        </p>
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #64748b;">
          If the button does not work, copy this link:<br />${activationUrl}
        </p>
      </div>
    `,
  });
}

// 1. Stripe Webhook (needs raw body parser)
webhooksRouter.post("/stripe", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderKind = session.metadata?.orderKind;
    const orderId = session.metadata?.orderId;

    if (orderKind === "sponsorship") {
      console.log("[Stripe Webhook] Sponsorship checkout completed", {
        sessionId: session.id,
        tier: session.metadata?.sponsorshipTier ?? null,
      });
      return res.json({ received: true });
    }

    if (orderId) {
      const db = requireDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        console.warn(`[Stripe Webhook] Order ${orderId} not found for paid session ${session.id}`);
        return res.json({ received: true });
      }

      const shouldSendActivationEmail = order.status !== "paid";
      await markOrderPaid(orderId, session.id);

      if (typeof session.subscription === "string") {
        const { expiresAt } = await getMembershipSubscriptionExpiry(session.subscription);
        await updateCertificateExpiry(orderId, expiresAt);
        console.log(`[Stripe Webhook] Membership order ${orderId} marked as paid, expiresAt: ${expiresAt.toISOString()}`);
      }

      if (shouldSendActivationEmail) {
        try {
          const emailResult = await sendDashboardActivationEmail({
            email: order.email,
            name: order.name,
            secureToken: order.secureToken,
          });
          console.log("[Stripe Webhook] Dashboard activation email sent", {
            to: order.email,
            id: emailResult.data?.id ?? null,
            error: emailResult.error ?? null,
          });
        } catch (emailError) {
          console.error("[Stripe Webhook] Failed to send dashboard activation email", {
            to: order.email,
            error: emailError,
          });
        }
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    const orderId = invoice.parent?.subscription_details?.metadata?.orderId;
    const periodEnd = Math.max(...invoice.lines.data.map((line) => line.period?.end || 0));

    if (orderId && periodEnd > 0) {
      const expiresAt = new Date(periodEnd * 1000);
      await markOrderPaid(orderId);
      await updateCertificateExpiry(orderId, expiresAt);
      console.log(`[Stripe Webhook] Membership renewal synced for order ${orderId}, expiresAt: ${expiresAt.toISOString()}`);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    console.warn("[Stripe Webhook] Invoice payment failed", {
      invoiceId: invoice.id,
      orderId: invoice.parent?.subscription_details?.metadata?.orderId ?? null,
    });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    console.log("[Stripe Webhook] Subscription state changed", {
      id: subscription.id,
      status: subscription.status,
      orderId: subscription.metadata?.orderId ?? null,
      type: event.type,
    });
  }

  res.json({ received: true });
});

// Helper: link certificates to a Clerk user by email (case-insensitive)
async function linkCertificatesByEmail(email: string, clerkUserId: string) {
  const db = requireDb();

  const matchingOrders = await db.select({ id: orders.id })
    .from(orders)
    .where(and(sql`lower(${orders.email}) = lower(${email})`, eq(orders.status, "paid")));

  if (matchingOrders.length === 0) {
    console.log(`[Clerk Webhook] No paid orders found for email ${email}`);
    return;
  }

  for (const order of matchingOrders) {
    await db.update(certificates)
      .set({ clerkUserId })
      .where(eq(certificates.orderId, order.id));
  }

  console.log(`[Clerk Webhook] Linked ${matchingOrders.length} certificate(s) to Clerk user ${clerkUserId} (email: ${email})`);
}

async function hasPaidMembership(email: string) {
  const db = requireDb();
  const [matchingOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(sql`lower(${orders.email}) = lower(${email})`, eq(orders.status, "paid")))
    .limit(1);

  return Boolean(matchingOrder);
}

async function upsertUser(clerkUserId: string, email: string, evtData: any) {
  const db = requireDb();
  
  const firstName = evtData.first_name || "";
  const lastName = evtData.last_name || "";
  const imageUrl = evtData.image_url || "";
  
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkUserId));
  
  if (existing.length > 0) {
    await db.update(users).set({
      email,
      firstName,
      lastName,
      imageUrl,
      updatedAt: new Date()
    }).where(eq(users.clerkId, clerkUserId));
    console.log(`[Clerk Webhook] Updated user ${clerkUserId} in DB`);
  } else {
    await db.insert(users).values({
      clerkId: clerkUserId,
      email,
      firstName,
      lastName,
      imageUrl,
    });
    console.log(`[Clerk Webhook] Inserted user ${clerkUserId} into DB`);
  }
}

// 2. Clerk Webhook
// NOTE: Must ensure this route gets parsed by express.json() in server.ts
webhooksRouter.post("/clerk", async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not defined");
  }

  const headers = req.headers;
  // Express `.json()` middleware converts the body to an object
  // Since Svix needs the raw JSON string to verify the signature, we re-stringify it here
  const payload = JSON.stringify(req.body);

  const svix_id = headers["svix-id"] as string;
  const svix_timestamp = headers["svix-timestamp"] as string;
  const svix_signature = headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  // Lazy-load svix here to avoid backend startup hanging on module init.
  const { Webhook } = require("svix");
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("[Clerk Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`[Clerk Webhook] Received event: ${eventType}, userId: ${id}`);

  if (eventType === "user.created" || eventType === "user.updated") {
    const email = evt.data.email_addresses?.[0]?.email_address;
    if (!email) {
      console.warn(`[Clerk Webhook] No email found in ${eventType} event for user ${id}`);
      return res.json({ success: true });
    }

    const paidMember = await hasPaidMembership(email);
    if (!paidMember) {
      console.log(`[Clerk Webhook] Skipping dashboard user sync for unpaid email ${email}`);
      return res.json({ success: true });
    }

    try {
      await upsertUser(id, email, evt.data);
    } catch (error) {
      console.error(`[Clerk Webhook] Failed to upsert user ${id}:`, error);
    }

    try {
      await linkCertificatesByEmail(email, id);
    } catch (error) {
      console.error(`[Clerk Webhook] Failed to link certificates for ${email}:`, error);
    }
  }

  res.json({ success: true });
});
