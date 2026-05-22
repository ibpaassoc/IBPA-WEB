import { Router } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import crypto from "crypto";
import { requireDb, orders, certificates, users, emailLogs, partnerApplications } from "../lib/db";
import { and, eq, sql } from "drizzle-orm";
import { stripe } from "../services/stripe";
import { adminNotificationEmail, resend, resendFrom } from "../services/email";

export const webhooksRouter = Router();
const processedInvoiceCopyEvents = new Set<string>();
const dashboardActivationSubject = "Complete your IBPA dashboard access";

function dashboardActivationLogBody(orderId: string) {
  return `stripe-dashboard-activation:${orderId}`;
}

async function ensureEmailLogsTable(db: ReturnType<typeof requireDb>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "email_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "to" text NOT NULL,
      "subject" text NOT NULL,
      "body" text NOT NULL,
      "status" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `);
}

async function hasSentDashboardActivationEmail(db: ReturnType<typeof requireDb>, email: string, orderId: string) {
  await ensureEmailLogsTable(db);
  const [existingLog] = await db
    .select({ id: emailLogs.id })
    .from(emailLogs)
    .where(
      and(
        sql`lower(${emailLogs.to}) = lower(${email})`,
        eq(emailLogs.subject, dashboardActivationSubject),
        eq(emailLogs.body, dashboardActivationLogBody(orderId)),
        eq(emailLogs.status, "sent"),
      ),
    )
    .limit(1);

  return Boolean(existingLog);
}

async function logDashboardActivationEmailSent(db: ReturnType<typeof requireDb>, email: string, orderId: string) {
  await ensureEmailLogsTable(db);
  await db.insert(emailLogs).values({
    to: email,
    subject: dashboardActivationSubject,
    body: dashboardActivationLogBody(orderId),
    status: "sent",
  });
}

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
    subject: dashboardActivationSubject,
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

async function sendAdminPaymentReceivedEmail(params: {
  email: string;
  name: string;
  orderId: string;
  membershipCategory?: string | null;
  stripeSessionId?: string | null;
}) {
  const { email, name, orderId, membershipCategory, stripeSessionId } = params;

  return resend.emails.send({
    from: resendFrom,
    to: adminNotificationEmail,
    subject: `IBPA payment received: ${name || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <h1 style="margin: 0 0 16px; font-size: 24px;">Payment received</h1>
        <p style="margin: 0 0 10px;"><strong>Applicant:</strong> ${name || "Unknown"}</p>
        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px;"><strong>Membership:</strong> ${membershipCategory || "N/A"}</p>
        <p style="margin: 0 0 10px;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 0;"><strong>Stripe session:</strong> ${stripeSessionId || "N/A"}</p>
      </div>
    `,
  });
}

async function sendAdminPartnerPaymentReceivedEmail(params: {
  applicationId: string;
  orderId: string;
  name: string;
  email: string;
  tier?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}) {
  const { applicationId, orderId, name, email, tier, stripeSessionId, stripePaymentIntentId } = params;

  return resend.emails.send({
    from: resendFrom,
    to: adminNotificationEmail,
    subject: `IBPA partner payment received: ${name || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <h1 style="margin: 0 0 16px; font-size: 24px;">Partner payment received</h1>
        <p style="margin: 0 0 10px;"><strong>Applicant:</strong> ${name || "Unknown"}</p>
        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px;"><strong>Tier:</strong> ${tier || "N/A"}</p>
        <p style="margin: 0 0 10px;"><strong>Partner application ID:</strong> ${applicationId}</p>
        <p style="margin: 0 0 10px;"><strong>Partner order ID:</strong> ${orderId}</p>
        <p style="margin: 0 0 10px;"><strong>Stripe session:</strong> ${stripeSessionId || "N/A"}</p>
        <p style="margin: 0;"><strong>Stripe payment intent:</strong> ${stripePaymentIntentId || "N/A"}</p>
      </div>
    `,
  });
}

async function findPartnerOrderByApplicationId(db: ReturnType<typeof requireDb>, applicationId: string) {
  const [existing] = await db
    .select()
    .from(orders)
    .where(
      and(
        sql`lower(${orders.accountType}) = 'partner'`,
        sql`${orders.applicationPayload} ->> 'partnerApplicationId' = ${applicationId}`,
      ),
    )
    .limit(1);

  return existing || null;
}

async function ensurePartnerOrderForApplication(params: {
  db: ReturnType<typeof requireDb>;
  application: typeof partnerApplications.$inferSelect;
  sessionId: string;
}) {
  const { db, application, sessionId } = params;

  const linkedOrderId = application.partnerOrderId || null;
  if (linkedOrderId) {
    const [linkedOrder] = await db.select().from(orders).where(eq(orders.id, linkedOrderId));
    if (linkedOrder) {
      if (linkedOrder.status !== "paid" || linkedOrder.stripeSessionId !== sessionId) {
        await db
          .update(orders)
          .set({
            status: "paid",
            stripeSessionId: sessionId,
            accountType: "partner",
          })
          .where(eq(orders.id, linkedOrder.id));
      }

      return { id: linkedOrder.id, secureToken: linkedOrder.secureToken };
    }
  }

  const existingByApplication = await findPartnerOrderByApplicationId(db, application.id);
  if (existingByApplication) {
    if (existingByApplication.status !== "paid" || existingByApplication.stripeSessionId !== sessionId) {
      await db
        .update(orders)
        .set({
          status: "paid",
          stripeSessionId: sessionId,
          accountType: "partner",
        })
        .where(eq(orders.id, existingByApplication.id));
    }

    await db
      .update(partnerApplications)
      .set({
        partnerOrderId: existingByApplication.id,
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, application.id));

    return { id: existingByApplication.id, secureToken: existingByApplication.secureToken };
  }

  const [existingBySession] = await db
    .select()
    .from(orders)
    .where(and(sql`lower(${orders.accountType}) = 'partner'`, eq(orders.stripeSessionId, sessionId)))
    .limit(1);

  if (existingBySession) {
    await db
      .update(partnerApplications)
      .set({
        partnerOrderId: existingBySession.id,
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, application.id));

    return { id: existingBySession.id, secureToken: existingBySession.secureToken };
  }

  const [createdOrder] = await db
    .insert(orders)
    .values({
      email: application.email,
      name: application.name,
      accountType: "partner",
      membershipCategory: "partner",
      applicantType: "Partner",
      package: application.requestedTier || "partner",
      applicationPayload: {
        type: "partner",
        partnerApplicationId: application.id,
        partnerTier: application.requestedTier,
        partnerMessage: application.message,
        partnerPhone: application.phone,
        paymentStatus: "paid",
      },
      status: "paid",
      stripeSessionId: sessionId,
      secureToken: crypto.randomUUID(),
      phone: application.phone,
    })
    .returning({
      id: orders.id,
      secureToken: orders.secureToken,
    });

  await db
    .update(partnerApplications)
    .set({
      partnerOrderId: createdOrder.id,
      updatedAt: new Date(),
    })
    .where(eq(partnerApplications.id, application.id));

  return { id: createdOrder.id, secureToken: createdOrder.secureToken };
}

async function handlePartnerApplicationCheckoutSession(session: Stripe.Checkout.Session) {
  const partnerApplicationId =
    session.metadata?.partnerApplicationId ||
    session.metadata?.partner_application_id ||
    null;

  if (!partnerApplicationId) {
    console.warn("[Stripe Webhook] Partner application metadata missing id", {
      sessionId: session.id,
    });
    return;
  }

  const db = requireDb();
  const [application] = await db
    .select()
    .from(partnerApplications)
    .where(eq(partnerApplications.id, partnerApplicationId));

  if (!application) {
    console.warn("[Stripe Webhook] Partner application not found", {
      partnerApplicationId,
      sessionId: session.id,
    });
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const invoiceId = typeof session.invoice === "string" ? session.invoice : null;
  const isDuplicatePaidEvent =
    application.paymentStatus === "PAID" &&
    application.stripeCheckoutSessionId === session.id &&
    Boolean(application.partnerOrderId);
  const paidAt = application.paidAt || new Date();

  const [updatedApplication] = await db
    .update(partnerApplications)
    .set({
      status: "APPROVED",
      paymentStatus: "PAID",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId || application.stripePaymentIntentId,
      stripeInvoiceId: invoiceId || application.stripeInvoiceId,
      paidAt,
      updatedAt: new Date(),
    })
    .where(eq(partnerApplications.id, application.id))
    .returning();

  const partnerOrder = await ensurePartnerOrderForApplication({
    db,
    application: updatedApplication || application,
    sessionId: session.id,
  });

  if (isDuplicatePaidEvent) {
    console.log("[Stripe Webhook] Partner paid event already processed", {
      partnerApplicationId: application.id,
      partnerOrderId: partnerOrder.id,
      sessionId: session.id,
    });
    return;
  }

  let activationEmailAlreadySent = false;
  try {
    activationEmailAlreadySent = await hasSentDashboardActivationEmail(db, application.email, partnerOrder.id);
  } catch (emailLogError) {
    console.error("[Stripe Webhook] Failed to check partner dashboard activation email log", {
      partnerApplicationId: application.id,
      partnerOrderId: partnerOrder.id,
      email: application.email,
      error: emailLogError,
    });
  }

  if (!activationEmailAlreadySent) {
    try {
      const emailResult = await sendDashboardActivationEmail({
        email: application.email,
        name: application.name,
        secureToken: partnerOrder.secureToken,
      });
      console.log("[Stripe Webhook] Partner dashboard activation email sent", {
        to: application.email,
        partnerApplicationId: application.id,
        partnerOrderId: partnerOrder.id,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });

      if (!emailResult.error) {
        try {
          await logDashboardActivationEmailSent(db, application.email, partnerOrder.id);
        } catch (emailLogError) {
          console.error("[Stripe Webhook] Failed to log partner dashboard activation email", {
            partnerApplicationId: application.id,
            partnerOrderId: partnerOrder.id,
            email: application.email,
            error: emailLogError,
          });
        }
      }
    } catch (emailError) {
      console.error("[Stripe Webhook] Failed to send partner dashboard activation email", {
        to: application.email,
        partnerApplicationId: application.id,
        partnerOrderId: partnerOrder.id,
        error: emailError,
      });
    }
  }

  try {
    const adminEmailResult = await sendAdminPartnerPaymentReceivedEmail({
      applicationId: application.id,
      orderId: partnerOrder.id,
      name: application.name,
      email: application.email,
      tier: application.requestedTier,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    });
    console.log("[Stripe Webhook] Partner payment received notification sent", {
      to: adminNotificationEmail,
      id: adminEmailResult.data?.id ?? null,
      error: adminEmailResult.error ?? null,
    });
  } catch (adminEmailError) {
    console.error("[Stripe Webhook] Partner payment received notification failed", {
      to: adminNotificationEmail,
      applicationId: application.id,
      error: adminEmailError,
    });
  }

  console.log("[Stripe Webhook] Partner application marked as paid", {
    partnerApplicationId: application.id,
    partnerOrderId: partnerOrder.id,
    sessionId: session.id,
    paymentIntentId,
    invoiceId,
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInvoiceAmount(invoice: Stripe.Invoice) {
  const amount = typeof invoice.amount_due === "number" ? invoice.amount_due : invoice.amount_paid ?? 0;
  const currency = (invoice.currency || "usd").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${amount} ${currency}`;
  }
}

async function sendStripeInvoiceCopyEmail(invoice: Stripe.Invoice) {
  const invoiceLabel = invoice.number || invoice.id;
  const customerName = invoice.customer_name || "Unknown";
  const customerEmail = invoice.customer_email || "Unknown";
  const hostedInvoiceUrl = invoice.hosted_invoice_url || "";
  const invoicePdfUrl = invoice.invoice_pdf || "";

  return resend.emails.send({
    from: resendFrom,
    to: resendFrom,
    subject: `Stripe invoice sent: ${invoiceLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <h1 style="margin: 0 0 16px; font-size: 24px;">Stripe invoice sent</h1>
        <p style="margin: 0 0 10px;"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
        <p style="margin: 0 0 10px;"><strong>Invoice:</strong> ${escapeHtml(invoiceLabel)}</p>
        <p style="margin: 0 0 10px;"><strong>Amount:</strong> ${escapeHtml(formatInvoiceAmount(invoice))}</p>
        <p style="margin: 0 0 10px;"><strong>Status:</strong> ${escapeHtml(invoice.status || "unknown")}</p>
        <p style="margin: 0 0 10px;"><strong>Hosted invoice URL:</strong> ${hostedInvoiceUrl ? `<a href="${escapeHtml(hostedInvoiceUrl)}">${escapeHtml(hostedInvoiceUrl)}</a>` : "N/A"}</p>
        <p style="margin: 0;"><strong>Invoice PDF URL:</strong> ${invoicePdfUrl ? `<a href="${escapeHtml(invoicePdfUrl)}">${escapeHtml(invoicePdfUrl)}</a>` : "N/A"}</p>
      </div>
    `,
  });
}

// 1. Stripe Webhook (needs raw body parser)
webhooksRouter.post("/stripe", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe Webhook Error: STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(500).send("Webhook Error: Stripe webhook secret is not configured");
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Stripe Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderKind = session.metadata?.orderKind;
      const metadataType = session.metadata?.type;
      const orderId = session.metadata?.orderId;

      if (orderKind === "sponsorship") {
        console.log("[Stripe Webhook] Sponsorship checkout completed", {
          sessionId: session.id,
          tier: session.metadata?.sponsorshipTier ?? null,
        });
        return res.json({ received: true });
      }

      if (orderKind === "partner_application" || metadataType === "partner_application") {
        await handlePartnerApplicationCheckoutSession(session);
        return res.json({ received: true });
      }

      if (orderId) {
        const db = requireDb();
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

        if (!order) {
          console.warn(`[Stripe Webhook] Order ${orderId} not found for paid session ${session.id}`);
          return res.json({ received: true });
        }

        let activationEmailAlreadySent = false;
        try {
          activationEmailAlreadySent = await hasSentDashboardActivationEmail(db, order.email, order.id);
        } catch (emailLogError) {
          console.error("[Stripe Webhook] Failed to check dashboard activation email log", {
            orderId: order.id,
            email: order.email,
            error: emailLogError,
          });
        }

        const shouldSendActivationEmail =
          !activationEmailAlreadySent && (order.status !== "paid" || !order.stripeSessionId || session.id === order.stripeSessionId);
        await markOrderPaid(orderId, session.id);
        console.log(`[Stripe Webhook] Order ${orderId} marked as paid for session ${session.id}`);

        if (typeof session.subscription === "string") {
          try {
            const { expiresAt } = await getMembershipSubscriptionExpiry(session.subscription);
            await updateCertificateExpiry(orderId, expiresAt);
            console.log(`[Stripe Webhook] Membership order ${orderId} expiresAt synced: ${expiresAt.toISOString()}`);
          } catch (expiryError) {
            console.error("[Stripe Webhook] Failed to sync membership expiry", {
              orderId,
              sessionId: session.id,
              subscriptionId: session.subscription,
              error: expiryError,
            });
          }
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

            if (!emailResult.error) {
              try {
                await logDashboardActivationEmailSent(db, order.email, order.id);
              } catch (emailLogError) {
                console.error("[Stripe Webhook] Failed to log dashboard activation email", {
                  orderId: order.id,
                  email: order.email,
                  error: emailLogError,
                });
              }
            }
          } catch (emailError) {
            console.error("[Stripe Webhook] Failed to send dashboard activation email", {
              to: order.email,
              error: emailError,
            });
          }

          try {
            const adminEmailResult = await sendAdminPaymentReceivedEmail({
              email: order.email,
              name: order.name,
              orderId: order.id,
              membershipCategory: order.membershipCategory,
              stripeSessionId: session.id,
            });
            console.log("[Stripe Webhook] Admin payment received notification sent", {
              to: adminNotificationEmail,
              id: adminEmailResult.data?.id ?? null,
              error: adminEmailResult.error ?? null,
            });
          } catch (adminEmailError) {
            console.error("[Stripe Webhook] Admin payment received notification failed", {
              to: adminNotificationEmail,
              error: adminEmailError,
            });
          }
        } else {
          console.log("[Stripe Webhook] Dashboard activation email skipped", {
            orderId: order.id,
            email: order.email,
            activationEmailAlreadySent,
            orderStatus: order.status,
            existingStripeSessionId: order.stripeSessionId ?? null,
            eventStripeSessionId: session.id,
          });
        }
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      const orderId = invoice.parent?.subscription_details?.metadata?.orderId;
      const periodEnd = Math.max(...invoice.lines.data.map((line) => line.period?.end || 0));

      if (orderId && periodEnd > 0 && invoice.billing_reason && invoice.billing_reason !== "subscription_cycle") {
        console.log("[Stripe Webhook] Skipping non-renewal invoice payment sync", {
          invoiceId: invoice.id,
          orderId,
          billingReason: invoice.billing_reason,
        });
      } else if (orderId && periodEnd > 0) {
        const expiresAt = new Date(periodEnd * 1000);
        await markOrderPaid(orderId);
        await updateCertificateExpiry(orderId, expiresAt);
        console.log(`[Stripe Webhook] Membership renewal synced for order ${orderId}, expiresAt: ${expiresAt.toISOString()}`);
      }
    }

    if (event.type === "invoice.sent") {
      const invoice = event.data.object as Stripe.Invoice;

      if (processedInvoiceCopyEvents.has(event.id)) {
        console.log("[Stripe Webhook] Invoice copy email already processed for event", {
          eventId: event.id,
          invoiceId: invoice.id,
        });
      } else {
        try {
          const copyEmailResult = await sendStripeInvoiceCopyEmail(invoice);

          if (copyEmailResult?.error) {
            console.error("[Stripe Webhook] Stripe invoice copy notification failed", {
              to: resendFrom,
              invoiceId: invoice.id,
              invoiceNumber: invoice.number ?? null,
              error: copyEmailResult.error,
            });
          } else if (copyEmailResult) {
            processedInvoiceCopyEvents.add(event.id);
            console.log("[Stripe Webhook] Stripe invoice copy notification sent", {
              to: resendFrom,
              invoiceId: invoice.id,
              invoiceNumber: invoice.number ?? null,
              id: copyEmailResult.data?.id ?? null,
              error: copyEmailResult.error ?? null,
            });
          }
        } catch (copyEmailError) {
          console.error("[Stripe Webhook] Stripe invoice copy notification failed", {
            to: resendFrom,
            invoiceId: invoice.id,
            invoiceNumber: invoice.number ?? null,
            error: copyEmailError,
          });
        }
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
  } catch (handlerError) {
    console.error("[Stripe Webhook] Failed to process event", {
      eventId: event.id,
      eventType: event.type,
      error: handlerError,
    });
    return res.status(500).json({ error: "Failed to process Stripe webhook event" });
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
