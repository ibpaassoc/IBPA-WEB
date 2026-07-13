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

// JSON error handler. Without this, an error thrown by middleware (Clerk auth
// failures, body-parser rejects, unexpected route throws) falls through to
// Express's default handler, which responds with an HTML error page — API
// clients expect JSON and previously surfaced these as misleading parse
// failures. Client-caused errors keep their status and message; everything
// else is a generic 500 with the details kept in the server log.
const apiErrorHandler: express.ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[API Error]", err);

  if (res.headersSent) {
    return;
  }

  const statusCandidate = Number(
    (err as { status?: number; statusCode?: number })?.status ??
      (err as { status?: number; statusCode?: number })?.statusCode,
  );
  const status = Number.isInteger(statusCandidate) && statusCandidate >= 400 && statusCandidate < 600
    ? statusCandidate
    : 500;
  const message = status < 500 && err instanceof Error && err.message
    ? err.message
    : "Internal server error";

  res.status(status).json({ error: message });
};

app.use(apiErrorHandler);

async function startServer() {
  app.listen(port, () => {
    console.log(`Backend listening at port ${port}`);
  });
}

void startServer();
