import { sql } from "drizzle-orm";
import { boolean, doublePrecision, index, integer, jsonb, pgTable, uuid, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export type UserService = {
  id: string;
  title: string;
  description?: string;
};

export const cardRequests = pgTable("card_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardName: varchar("card_name", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  certificateNumber: varchar("certificate_number", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  accountType: varchar("account_type", { length: 30 }).notNull().default("member"),
  membershipCategory: varchar("membership_category", { length: 50 }),
  applicantType: varchar("applicant_type", { length: 50 }),
  applicationPayload: jsonb("application_payload"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, review, approved, paid
  stripeSessionId: text("stripe_session_id"),
  confirmationEmailStatus: varchar("confirmation_email_status", { length: 30 }).notNull().default("NOT_SENT"),
  emailSentAt: timestamp("email_sent_at"),
  emailError: text("email_error"),
  secureToken: varchar("secure_token", { length: 255 }).notNull().unique(),
  package: varchar("package", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  certNumber: varchar("cert_number", { length: 50 }).notNull().unique(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }),
  certificateUrl: text("certificate_url"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applicationAdditionalFiles = pgTable("application_additional_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key"),
  fileType: varchar("file_type", { length: 120 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("application_additional_files_application_id_idx").on(table.applicationId),
]);

export const dashboardNotifications = pgTable("dashboard_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  ctaLabel: varchar("cta_label", { length: 120 }),
  ctaUrl: text("cta_url"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  coverImage: text("cover_image"),
  coverAspect: doublePrecision("cover_aspect"),
  eventAddress: text("event_address"),
  eventAllDay: boolean("event_all_day").notNull().default(false),
  eventDate: timestamp("event_date"),
  eventEndDate: timestamp("event_end_date"),
  ctaUrl: text("cta_url"),
  ctaLabel: varchar("cta_label", { length: 120 }),
  isPinned: boolean("is_pinned").notNull().default(false),
  publishToSite: boolean("publish_to_site").notNull().default(false),
  publishToDashboard: boolean("publish_to_dashboard").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  clerkId: varchar("clerk_id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  imageUrl: text("image_url"),
  bio: text("bio"),
  specialization: varchar("specialization", { length: 255 }),
  experienceYears: varchar("experience_years", { length: 50 }),
  education: text("education"),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  services: jsonb("services").$type<UserService[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerOrderId: uuid("owner_order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  ownerClerkUserId: varchar("owner_clerk_user_id", { length: 255 }).notNull(),
  ownerMemberId: varchar("owner_member_id", { length: 40 }).notNull(),
  teamMemberId: varchar("team_member_id", { length: 60 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailNormalized: varchar("email_normalized", { length: 255 }).notNull(),
  role: varchar("role", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  joinedAt: timestamp("joined_at"),
  portfolioLink: text("portfolio_link"),
  license: varchar("license", { length: 120 }).notNull(),
  affiliationConfirmed: boolean("affiliation_confirmed").notNull().default(false),
  seatNumber: integer("seat_number").notNull(),
  seatKind: varchar("seat_kind", { length: 30 }).notNull().default("included"),
  billingStatus: varchar("billing_status", { length: 30 }).notNull().default("included"),
  accessStatus: varchar("access_status", { length: 30 }).notNull().default("active"),
  status: varchar("status", { length: 30 }).notNull().default("invited"),
  registrationStatus: varchar("registration_status", { length: 30 }).notNull().default("not_registered"),
  ticketCode: varchar("ticket_code", { length: 120 }),
  attendanceStatus: varchar("attendance_status", { length: 30 }).notNull().default("not_marked"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("team_members_owner_order_id_idx").on(table.ownerOrderId),
  index("team_members_owner_clerk_user_id_idx").on(table.ownerClerkUserId),
  index("team_members_owner_order_email_idx").on(table.ownerOrderId, table.emailNormalized),
  uniqueIndex("team_members_team_member_id_uidx").on(table.teamMemberId),
]);

export const teamSeatExtensions = pgTable("team_seat_extensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerOrderId: uuid("partner_order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  ownerClerkUserId: varchar("owner_clerk_user_id", { length: 255 }).notNull(),
  seatsRequested: integer("seats_requested").notNull().default(1),
  status: varchar("status", { length: 30 }).notNull().default("payment_required"),
  paymentSessionId: text("payment_session_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("team_seat_extensions_partner_order_id_idx").on(table.partnerOrderId),
  index("team_seat_extensions_owner_clerk_user_id_idx").on(table.ownerClerkUserId),
]);

export const partnerApplications = pgTable("partner_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  message: text("message").notNull(),
  requestedTier: varchar("requested_tier", { length: 50 }),
  status: varchar("status", { length: 30 }).notNull().default("PENDING"),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("UNPAID"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  partnerOrderId: uuid("partner_order_id").references(() => orders.id, { onDelete: "set null" }),
  confirmationEmailStatus: varchar("confirmation_email_status", { length: 30 }).notNull().default("NOT_SENT"),
  emailSentAt: timestamp("email_sent_at"),
  emailError: text("email_error"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("partner_applications_email_idx").on(table.email),
  index("partner_applications_status_idx").on(table.status),
  index("partner_applications_payment_status_idx").on(table.paymentStatus),
  index("partner_applications_created_at_idx").on(table.createdAt),
]);

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().unique(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  livemode: boolean("livemode").notNull().default(false),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CardRequest = typeof cardRequests.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type ApplicationAdditionalFile = typeof applicationAdditionalFiles.$inferSelect;
export type DashboardNotificationRecord = typeof dashboardNotifications.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type TeamSeatExtension = typeof teamSeatExtensions.$inferSelect;
export type PartnerApplication = typeof partnerApplications.$inferSelect;
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
