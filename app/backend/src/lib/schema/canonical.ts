import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import type { ProfileService } from "@/features/profiles/server/profile.types";

const ibpa = pgSchema("ibpa");

export const userRoleEnum = pgEnum("ibpa_user_role", ["ADMIN", "MEMBER", "PARTNER", "TEAM_MEMBER"]);
export const applicationTypeEnum = pgEnum("ibpa_application_type", ["MEMBER", "PARTNER", "TEAM_MEMBER"]);
export const applicationStatusEnum = pgEnum("ibpa_application_status", [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PAYMENT_SENT",
  "PAID",
]);
export const membershipStatusEnum = pgEnum("ibpa_membership_status", ["ACTIVE", "EXPIRED", "CANCELLED"]);
export const paymentStatusEnum = pgEnum("ibpa_payment_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);
export const eventRegistrationStatusEnum = pgEnum("ibpa_event_registration_status", ["REGISTERED", "WAITLISTED", "CANCELLED", "ATTENDED"]);
export const fileTypeEnum = pgEnum("ibpa_file_type", ["PROFILE", "APPLICATION", "EVENT", "certificate", "external_certificate"]);

export const coreUsers = ibpa.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: varchar("clerk_id", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("MEMBER"),
  status: varchar("status", { length: 40 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("ibpa_users_clerk_id_uidx").on(table.clerkId),
  index("ibpa_users_email_idx").on(table.email),
  index("ibpa_users_role_idx").on(table.role),
]);

export const coreProfiles = ibpa.table("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => coreUsers.id, { onDelete: "cascade" }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  credentials: text("credentials"),
  services: jsonb("services").$type<ProfileService[]>().notNull().default(sql`'[]'::jsonb`),
  workGalleryPhotos: jsonb("work_gallery_photos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  specializations: jsonb("specializations").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 120 }),
  country: varchar("country", { length: 120 }),
  website: text("website"),
  instagram: text("instagram"),
  yearsExperience: integer("years_experience"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("ibpa_profiles_user_id_uidx").on(table.userId),
  index("ibpa_profiles_location_idx").on(table.country, table.state, table.city),
]);

export const coreApplications = ibpa.table("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => coreUsers.id, { onDelete: "set null" }),
  type: applicationTypeEnum("type").notNull(),
  packageName: varchar("package", { length: 80 }),
  status: applicationStatusEnum("status").notNull().default("SUBMITTED"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 80 }),
  paymentLink: text("payment_link"),
  applicationData: jsonb("application_data").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  applicationFiles: jsonb("application_files").$type<Array<Record<string, unknown>>>().notNull().default(sql`'[]'::jsonb`),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_applications_user_id_idx").on(table.userId),
  index("ibpa_applications_status_idx").on(table.status),
  index("ibpa_applications_type_idx").on(table.type),
  index("ibpa_applications_email_idx").on(table.email),
  index("ibpa_applications_created_at_idx").on(table.createdAt),
]);

export const coreMemberships = ibpa.table("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => coreUsers.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  status: membershipStatusEnum("status").notNull().default("ACTIVE"),
  startedAt: timestamp("started_at"),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("ibpa_memberships_user_id_idx").on(table.userId),
  index("ibpa_memberships_status_idx").on(table.status),
]);

export const corePayments = ibpa.table("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => coreUsers.id, { onDelete: "set null" }),
  type: varchar("type", { length: 80 }).notNull(),
  stripeSessionId: text("stripe_session_id"),
  amount: integer("amount").notNull().default(0),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
}, (table) => [
  index("ibpa_payments_user_id_idx").on(table.userId),
  index("ibpa_payments_status_idx").on(table.status),
  uniqueIndex("ibpa_payments_stripe_session_uidx").on(table.stripeSessionId),
]);

export const coreCertificates = ibpa.table("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  membershipId: uuid("membership_id").references(() => coreMemberships.id, { onDelete: "cascade" }).notNull(),
  certificateNumber: varchar("certificate_number", { length: 80 }).notNull(),
  certificateUrl: text("certificate_url"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  uniqueIndex("ibpa_certificates_membership_uidx").on(table.membershipId),
  uniqueIndex("ibpa_certificates_number_uidx").on(table.certificateNumber),
]);

export const coreEvents = ibpa.table("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  coverImage: jsonb("cover_image").$type<{ url: string | null; aspect?: number | null } | null>(),
  location: text("location"),
  visibility: varchar("visibility", { length: 40 }).notNull().default("PRIVATE"),
  price: integer("price").notNull().default(0),
  capacity: integer("capacity"),
  eventLink: text("event_link"),
  eventAllDay: boolean("event_all_day").notNull().default(false),
  ctaLabel: varchar("cta_label", { length: 120 }),
  isPinned: boolean("is_pinned").notNull().default(false),
  publishToSite: boolean("publish_to_site").notNull().default(false),
  publishToDashboard: boolean("publish_to_dashboard").notNull().default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 40 }).notNull().default("DRAFT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_events_status_start_idx").on(table.status, table.startDate),
  index("ibpa_events_created_at_idx").on(table.createdAt),
]);

export const coreEventRegistrations = ibpa.table("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => coreEvents.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => coreUsers.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull().default(""),
  status: eventRegistrationStatusEnum("status").notNull().default("REGISTERED"),
  source: varchar("source", { length: 80 }).notNull().default("dashboard"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_event_registrations_event_id_idx").on(table.eventId),
  index("ibpa_event_registrations_user_id_idx").on(table.userId),
  uniqueIndex("ibpa_event_registrations_event_user_uidx").on(table.eventId, table.userId),
]);

export const coreArticles = ibpa.table("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  ctaUrl: text("cta_url"),
  ctaLabel: varchar("cta_label", { length: 120 }),
  isPinned: boolean("is_pinned").notNull().default(false),
  publishToSite: boolean("publish_to_site").notNull().default(false),
  publishToDashboard: boolean("publish_to_dashboard").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_articles_created_at_idx").on(table.createdAt),
]);

export const corePartners = ibpa.table("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  coverImage: text("cover_image"),
  ctaUrl: text("cta_url"),
  ctaLabel: varchar("cta_label", { length: 120 }),
  isPinned: boolean("is_pinned").notNull().default(false),
  publishToSite: boolean("publish_to_site").notNull().default(true),
  publishToDashboard: boolean("publish_to_dashboard").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_partners_created_at_idx").on(table.createdAt),
]);

export const coreNotifications = ibpa.table("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 60 }).notNull(),
  visibility: varchar("visibility", { length: 40 }).notNull().default("TARGETED"),
  recipients: jsonb("recipients").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_notifications_type_idx").on(table.type),
  index("ibpa_notifications_created_at_idx").on(table.createdAt),
]);

export const coreTeams = ibpa.table("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").references(() => coreUsers.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  seatCount: integer("seat_count").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("ibpa_teams_owner_uidx").on(table.ownerUserId),
]);

export const coreTeamMembers = ibpa.table("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => coreTeams.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 120 }),
  status: varchar("status", { length: 40 }).notNull().default("INVITED"),
  joinedAt: timestamp("joined_at"),
}, (table) => [
  index("ibpa_team_members_team_id_idx").on(table.teamId),
  index("ibpa_team_members_email_idx").on(table.email),
]);

export const coreFiles = ibpa.table("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").references(() => coreUsers.id, { onDelete: "set null" }),
  relatedId: uuid("related_id"),
  type: fileTypeEnum("type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("ibpa_files_owner_user_id_idx").on(table.ownerUserId),
  index("ibpa_files_related_id_idx").on(table.relatedId),
  index("ibpa_files_type_idx").on(table.type),
]);

export const coreStripeWebhookEvents = ibpa.table("stripe_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeEventId: text("stripe_event_id").notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  processedAt: timestamp("processed_at"),
}, (table) => [
  uniqueIndex("ibpa_stripe_webhook_events_event_id_uidx").on(table.stripeEventId),
  index("ibpa_stripe_webhook_events_type_idx").on(table.eventType),
]);

export type CoreUser = typeof coreUsers.$inferSelect;
export type CoreProfile = typeof coreProfiles.$inferSelect;
export type CoreApplication = typeof coreApplications.$inferSelect;
export type CoreMembership = typeof coreMemberships.$inferSelect;
export type CorePayment = typeof corePayments.$inferSelect;
export type CoreCertificate = typeof coreCertificates.$inferSelect;
export type CoreEvent = typeof coreEvents.$inferSelect;
export type CoreEventRegistration = typeof coreEventRegistrations.$inferSelect;
export type CoreArticle = typeof coreArticles.$inferSelect;
export type CorePartner = typeof corePartners.$inferSelect;
export type CoreNotification = typeof coreNotifications.$inferSelect;
export type CoreTeam = typeof coreTeams.$inferSelect;
export type CoreTeamMember = typeof coreTeamMembers.$inferSelect;
export type CoreFile = typeof coreFiles.$inferSelect;
export type CoreStripeWebhookEvent = typeof coreStripeWebhookEvents.$inferSelect;
