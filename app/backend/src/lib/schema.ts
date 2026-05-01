import { boolean, doublePrecision, jsonb, pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
  membershipCategory: varchar("membership_category", { length: 50 }),
  applicantType: varchar("applicant_type", { length: 50 }),
  applicationPayload: jsonb("application_payload"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, review, approved, paid
  stripeSessionId: text("stripe_session_id"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CardRequest = typeof cardRequests.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type DashboardNotificationRecord = typeof dashboardNotifications.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type User = typeof users.$inferSelect;
