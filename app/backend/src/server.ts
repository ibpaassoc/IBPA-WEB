import express from "express";
import cors from "cors";
import { webhooksRouter } from "./routes/webhooks";
import { ordersRouter } from "./routes/orders";
import { cardsRouter, dashboardRouter } from "./routes/dashboard";
import { mailingRouter } from "./routes/mailing";
import { contentRouter } from "./routes/content";
import { contactRouter } from "./routes/contact";
import { membersRouter } from "./routes/members";
import { partnerApplicationsRouter } from "./routes/partner-applications";
import { ensureRuntimeSchemaCompat } from "./lib/runtime-schema-compat";

const app = express();
const port = process.env.PORT || 3003;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) || [];

const membershipStripePriceKeys = {
  Specialist: "STRIPE_PRICE_SPECIALIST",
  Professional: "STRIPE_PRICE_PROFESSIONAL",
  Trainer: "STRIPE_PRICE_TRAINER",
  Business: "STRIPE_PRICE_BUSINESS",
  Brand: "STRIPE_PRICE_BRAND",
} as const;

const membershipFallbackAmounts = {
  Specialist: 4900,
  Professional: 12900,
  Trainer: 24900,
  Business: 39900,
  Brand: 99900,
} as const;

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-clerk-auth-reason", "x-clerk-auth-status"],
  credentials: true
}));

// Route: Webhooks (Must be placed BEFORE express.json() because Stripe needs raw body)
app.use("/api/webhooks", webhooksRouter);

// Global middleware for standard JSON parsing
app.use(express.json());

// Main Domain Routes
app.use("/api/orders", ordersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/mailing", mailingRouter);
app.use("/api/content", contentRouter);
app.use("/api/contact", contactRouter);
app.use("/api/members", membersRouter);
app.use("/api/partner-applications", partnerApplicationsRouter);

async function startServer() {
  try {
    await ensureRuntimeSchemaCompat();
    console.log("[Startup] Runtime schema compatibility check complete.");
  } catch (error) {
    console.error("[Startup] Runtime schema compatibility check failed.", error);
  }

  app.listen(port, () => {
    console.log(`Backend listening at port ${port}`);
  });
}

void startServer();
