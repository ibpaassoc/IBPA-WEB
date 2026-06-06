import "../src/load-env";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import {
  requireDb,
} from "../src/lib/db";
import {
  certificates,
  contentItems,
  orders,
  teamMembers,
  teamSeatExtensions,
  users,
} from "./support/public-schema";

const TARGET_EMAIL = "info@ibpassociations.org";
const EVENT_CTA_PREFIX = "https://dev-seed.ibpa.local/dashboard/";
const CONFIRM_FLAG = "--confirm-dev-seed";

const profileAvatar = "/board/anastasia-shevchenko.webp";
const galleryImages = [
  "/board/board-of-directors-anastasiia.webp",
  "/home/professional.webp",
  "/home/salon.webp",
  "/home/website.webp",
  "/home/brand.webp",
  "/home/why-join-ibpa.webp",
];

const seededServices = [
  {
    id: "service-membership-activation",
    title: "Membership Activation",
    description:
      "Account setup, onboarding guidance, profile completion support, and renewal-ready member workflows.",
  },
  {
    id: "service-partner-operations",
    title: "Partner Operations Support",
    description:
      "Seat planning, team profile coordination, access troubleshooting, and partner dashboard enablement.",
  },
  {
    id: "service-education-programming",
    title: "Education Programming",
    description:
      "Workshop planning, educator scheduling, standards alignment, and member-facing learning sessions.",
  },
  {
    id: "service-event-production",
    title: "Event Production",
    description:
      "Regional activations, board sessions, summit logistics, and RSVP-ready event publishing across channels.",
  },
] as const;

const richApplicationPayload = {
  firstName: "Anastasiia",
  lastName: "Shevchenko",
  email: TARGET_EMAIL,
  phone: "+1 (916) 957-6174",
  city: "Roseville",
  state: "California",
  country: "United States",
  citizenship: "United States",
  yearsExperience: "11+ years",
  membershipCategory: "Business",
  applicantType: "Business",
  specialization: [
    "Association Leadership",
    "Membership Strategy",
    "Professional Standards",
  ],
  professionalDesc:
    "Executive director and membership strategist leading partner growth, education programming, and standards alignment for IBPA's professional beauty community across events, certification touchpoints, and member support.",
  educationDesc:
    "Continuing education in association leadership, beauty business operations, member programming, and public-facing industry communications.",
  instagramLink: "https://instagram.com/ibpassociations",
  websiteLink: "https://ibpassociations.org",
  portfolioLink: "https://ibpassociations.org/about",
  whyJoin:
    "This seeded dev profile represents a fully populated partner-owner account with realistic business context, richer visuals, and enough content density to validate dashboard and public profile states.",
  contributionDesc:
    "Coordinates member onboarding, partner collaborations, education sessions, compliance workflows, speaker relations, and cross-channel content planning for IBPA.",
  bizName: "IBPA Growth & Membership Office",
  bizType: "Professional beauty association and member services office",
  bizYear: "2019",
  bizTeamSize: "14",
  bizServices:
    "Membership activation, partner support, industry education, board coordination, event production, and professional standards guidance.",
  achievementsYesNo: "Yes",
  achievementsDesc:
    "Scaled member operations, launched partner team access, built dashboard onboarding resources, and coordinated multi-city events for owners, educators, and specialists.",
  competitionsYesNo: "No",
  competitionName: "",
  competitionYear: "",
  competitionResult: "",
  speakerEducatorJudge: "Yes",
  publicationsYesNo: "Yes",
  publicationsLinks:
    "https://ibpassociations.org/news | https://ibpassociations.org/governance",
  otherOrganizationsYesNo: "Yes",
  otherOrganizationName: "Professional Beauty Coalition",
  otherOrganizationStatus: "Association Partner",
  otherOrganizationYears: "2021-present",
  workingJurisdictions: "California, Nevada, online member programs across the U.S.",
  portfolioImages: galleryImages,
};

const seededBio =
  "Anastasiia oversees member experience, partner operations, and education initiatives for IBPA. This DEV profile is intentionally populated with long-form content, realistic specialties, and image-heavy fields so the dashboard and public member pages can be visually tested against fuller account data.";

const seededTeamMembers = [
  {
    fullName: "Alina Petrova",
    email: "alina.petrova+dev@ibpassociations.org",
    role: "Director of Education Partnerships",
    avatarUrl: "/board/eleonora-bediukh.webp",
    bio: "Leads workshop curation, educator scheduling, and cross-program quality checks for member-facing learning tracks.",
    location: "Seattle, Washington",
    joinedAt: "2025-01-15T10:00:00.000Z",
    portfolioLink: "https://instagram.com/alina.ibpa.dev",
    license: "EDU-WA-1842",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "checked_in",
  },
  {
    fullName: "Maya Thompson",
    email: "maya.thompson+dev@ibpassociations.org",
    role: "Senior Brow Artist and Standards Mentor",
    avatarUrl: "/board/yulia-andreeva.webp",
    bio: "Supports portfolio reviews, mentorship sessions, and member spotlight programming with a strong brow and client-care focus.",
    location: "Sacramento, California",
    joinedAt: "2025-02-04T10:00:00.000Z",
    portfolioLink: "https://instagram.com/maya.ibpa.dev",
    license: "CA-BROW-2218",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "not_marked",
  },
  {
    fullName: "Daniel Park",
    email: "daniel.park+dev@ibpassociations.org",
    role: "Event Operations Manager",
    avatarUrl: "/home/website-5.webp",
    bio: "Owns run-of-show planning, venue logistics, vendor timelines, and dashboard event readiness for partner activations.",
    location: "Los Angeles, California",
    joinedAt: "2025-02-18T10:00:00.000Z",
    portfolioLink: "https://linkedin.com/in/daniel-park-dev",
    license: "OPS-CA-0911",
    status: "invited",
    registrationStatus: "not_registered",
    attendanceStatus: "not_marked",
  },
  {
    fullName: "Sofia Malik",
    email: "sofia.malik+dev@ibpassociations.org",
    role: "Community Partnerships Lead",
    avatarUrl: "/board/valeria-kizchuk.webp",
    bio: "Coordinates sponsor communication, member collaboration requests, and outreach with schools, salons, and brand partners.",
    location: "San Diego, California",
    joinedAt: "2025-03-06T10:00:00.000Z",
    portfolioLink: "https://instagram.com/sofia.ibpa.dev",
    license: "COMM-CA-4520",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "checked_in",
  },
  {
    fullName: "Irina Kovalenko",
    email: "irina.kovalenko+dev@ibpassociations.org",
    role: "PMU Trainer and Review Panel Coordinator",
    avatarUrl: "/board/tetiana-kysliuk.webp",
    bio: "Bridges advanced training content with member review requirements, speaker briefs, and certificate-ready documentation.",
    location: "Portland, Oregon",
    joinedAt: "2025-03-27T10:00:00.000Z",
    portfolioLink: "https://instagram.com/irina.ibpa.dev",
    license: "PMU-OR-6402",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "not_marked",
  },
  {
    fullName: "Rachel Nguyen",
    email: "rachel.nguyen+dev@ibpassociations.org",
    role: "Content and Brand Coordinator",
    avatarUrl: "/home/brand.webp",
    bio: "Manages image sets, event recaps, landing-page coordination, and content QA for member-facing campaigns.",
    location: "Irvine, California",
    joinedAt: "2025-04-14T10:00:00.000Z",
    portfolioLink: "https://instagram.com/rachel.ibpa.dev",
    license: "BRAND-CA-3090",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "checked_in",
  },
  {
    fullName: "Elena Foster",
    email: "elena.foster+dev@ibpassociations.org",
    role: "Lead Lash Educator",
    avatarUrl: "/home/professional.webp",
    bio: "Develops salon-friendly education modules and member support resources for lash, retention, and service consistency topics.",
    location: "Scottsdale, Arizona",
    joinedAt: "2025-04-29T10:00:00.000Z",
    portfolioLink: "https://instagram.com/elena.ibpa.dev",
    license: "LASH-AZ-1180",
    status: "invited",
    registrationStatus: "not_registered",
    attendanceStatus: "not_marked",
  },
  {
    fullName: "Chloe Ramirez",
    email: "chloe.ramirez+dev@ibpassociations.org",
    role: "Member Success Associate",
    avatarUrl: "/home/website-2.webp",
    bio: "Handles onboarding follow-ups, profile completeness audits, and member support routing for dashboard and certificate questions.",
    location: "Austin, Texas",
    joinedAt: "2025-05-10T10:00:00.000Z",
    portfolioLink: "https://linkedin.com/in/chloe-ramirez-dev",
    license: "MS-TX-7741",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "not_marked",
  },
  {
    fullName: "Nadia de la Cruz-Hernandez",
    email: "nadia.delacruz+dev@ibpassociations.org",
    role: "Studio Development Consultant",
    avatarUrl: "/home/salon.webp",
    bio: "Advises on growth planning, partner seat usage, event staffing, and polished member-facing communication for expansion teams.",
    location: "Miami, Florida",
    joinedAt: "2025-05-28T10:00:00.000Z",
    portfolioLink: "https://instagram.com/nadia.ibpa.dev",
    license: "CONS-FL-5822",
    status: "active",
    registrationStatus: "registered",
    attendanceStatus: "checked_in",
  },
  {
    fullName: "Victor Lebedev",
    email: "victor.lebedev+dev@ibpassociations.org",
    role: "Former Events Assistant",
    avatarUrl: "/home/website-9.webp",
    bio: "Retained in DEV data to verify removed-seat behavior and historical list cleanup without affecting active access metrics.",
    location: "Chicago, Illinois",
    joinedAt: "2024-11-21T10:00:00.000Z",
    portfolioLink: "https://linkedin.com/in/victor-lebedev-dev",
    license: "OPS-IL-2044",
    status: "removed",
    registrationStatus: "not_registered",
    attendanceStatus: "not_marked",
  },
] as const;

const seededEvents = [
  {
    title: "IBPA Summer Standards Workshop",
    body:
      "Members only intensive covering service standards, onboarding workflows, and regional compliance scenarios. Early member rate: $79.",
    coverImage: "/events/teora-event.webp",
    coverAspect: 16 / 9,
    eventAddress: "Roseville Event Center, Roseville, CA",
    eventDate: "2026-07-12T16:00:00.000Z",
    eventEndDate: "2026-07-12T22:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}summer-standards-workshop`,
    ctaLabel: "Members only RSVP",
    isPinned: true,
    publishToSite: true,
    publishToDashboard: true,
  },
  {
    title:
      "Advanced Multistate Licensing, Client Safety, and Digital Portfolio Strategy Intensive for Senior Beauty Professionals",
    body:
      "Open to all. A long-title event seeded specifically to test wrapping, multiline cards, and dense scheduling content. General admission: $149.",
    coverImage: "/news/beauty-forum-2025.webp",
    coverAspect: 16 / 9,
    eventAddress: "Online livestream + replay",
    eventDate: "2026-08-06T17:00:00.000Z",
    eventEndDate: "2026-08-06T20:30:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}multistate-licensing-intensive`,
    ctaLabel: "Open registration",
    isPinned: false,
    publishToSite: true,
    publishToDashboard: true,
  },
  {
    title: "PMU",
    body:
      "Members only roundtable for permanent makeup educators and studio owners. Compact title added to test short-card layouts. Seat price: $45.",
    coverImage: null,
    coverAspect: null,
    eventAddress: "Studio Collective, Seattle, WA",
    eventDate: "2026-09-03T01:00:00.000Z",
    eventEndDate: "2026-09-03T03:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}pmu-roundtable`,
    ctaLabel: "Reserve seat",
    isPinned: false,
    publishToSite: false,
    publishToDashboard: true,
  },
  {
    title: "Partner Studio Roundtable",
    body:
      "Members only session for owners reviewing team seats, member retention, and operational checklists before fall programming. Member session included.",
    coverImage: "/home/salon.webp",
    coverAspect: 4 / 3,
    eventAddress: "The Pendry, Newport Beach, CA",
    eventDate: "2026-06-25T19:00:00.000Z",
    eventEndDate: "2026-06-25T22:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}partner-studio-roundtable`,
    ctaLabel: "View agenda",
    isPinned: false,
    publishToSite: false,
    publishToDashboard: true,
  },
  {
    title: "Board Review Office Hours",
    body:
      "Members only dashboard-exclusive office hours with live Q&A for applications, certificates, and public-profile polish. Included with membership.",
    coverImage: "/home/website.webp",
    coverAspect: 3 / 2,
    eventAddress: "Zoom",
    eventDate: "2026-06-18T18:00:00.000Z",
    eventEndDate: "2026-06-18T19:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}board-review-office-hours`,
    ctaLabel: "Join call",
    isPinned: false,
    publishToSite: false,
    publishToDashboard: true,
  },
  {
    title: "Spring Mixer Recap Session",
    body:
      "Open to all recap and networking follow-up from the spring mixer. Seeded as a past event with no cover image so date formatting and mixed media states can be checked.",
    coverImage: null,
    coverAspect: null,
    eventAddress: "San Francisco, CA",
    eventDate: "2026-03-14T01:00:00.000Z",
    eventEndDate: "2026-03-14T04:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}spring-mixer-recap`,
    ctaLabel: "View notes",
    isPinned: false,
    publishToSite: true,
    publishToDashboard: true,
  },
  {
    title: "Private Educator Lab",
    body:
      "Members only pilot session for invited educators. This remains dashboard-visible but private from the public site to exercise private-event handling.",
    coverImage: "/home/why-join-ibpa.webp",
    coverAspect: 16 / 10,
    eventAddress: "Sacramento, CA",
    eventDate: "2026-10-09T16:00:00.000Z",
    eventEndDate: "2026-10-09T23:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}private-educator-lab`,
    ctaLabel: "Private RSVP",
    isPinned: false,
    publishToSite: false,
    publishToDashboard: true,
  },
  {
    title: "Annual Partner Summit Draft Run of Show",
    body:
      "Internal draft seed item retained in the database to validate draft/private content records without publishing them anywhere.",
    coverImage: "/home/brand.webp",
    coverAspect: 16 / 9,
    eventAddress: "TBD",
    eventDate: "2026-11-04T17:00:00.000Z",
    eventEndDate: "2026-11-04T20:00:00.000Z",
    ctaUrl: `${EVENT_CTA_PREFIX}partner-summit-draft`,
    ctaLabel: "Draft only",
    isPinned: false,
    publishToSite: false,
    publishToDashboard: false,
  },
] as const;

function ensureSafeToRun() {
  if ((process.env.NODE_ENV || "").trim().toLowerCase() === "production") {
    throw new Error("Refusing to run DEV seed while NODE_ENV=production.");
  }

  if (!process.argv.includes(CONFIRM_FLAG)) {
    throw new Error(
      `This script is DEV-only. Re-run with ${CONFIRM_FLAG} to confirm you want to reseed ${TARGET_EMAIL}.`,
    );
  }
}

async function getTargetOrder() {
  const db = requireDb();

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        sql`lower(${orders.email}) = lower(${TARGET_EMAIL})`,
        eq(orders.status, "paid"),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (!order) {
    throw new Error(
      `No paid order found for ${TARGET_EMAIL}. The DEV seed expects an existing dashboard-enabled account to enrich.`,
    );
  }

  return order;
}

async function getOwnerMemberId(orderId: string) {
  const db = requireDb();
  const partnerOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "paid"),
        sql`lower(${orders.accountType}) = 'partner'`,
      ),
    )
    .orderBy(asc(orders.createdAt), asc(orders.id));

  const orderIndex = partnerOrders.findIndex((item: { id: string }) => item.id === orderId);
  const normalizedIndex = orderIndex >= 0 ? orderIndex + 1 : partnerOrders.length + 1;
  return `IBPA-BO-${String(normalizedIndex).padStart(3, "0")}`;
}

async function seedUsers(order: typeof orders.$inferSelect, linkedClerkUserId: string | null) {
  const db = requireDb();
  const matchingUsers = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${TARGET_EMAIL})`);

  const nextUserValues = {
    email: TARGET_EMAIL,
    firstName: "Anastasiia",
    lastName: "Shevchenko",
    imageUrl: profileAvatar,
    bio: seededBio,
    specialization: "Association Leadership, Membership Strategy, Professional Standards",
    experienceYears: "11+ years",
    education:
      "Association leadership, beauty business operations, professional standards development, and member programming.",
    instagramUrl: "https://instagram.com/ibpassociations",
    country: "United States",
    city: "Roseville",
    services: seededServices.map((service) => ({ ...service })),
    updatedAt: new Date(),
  };

  if (matchingUsers.length > 0) {
    await db
      .update(users)
      .set(nextUserValues)
      .where(sql`lower(${users.email}) = lower(${TARGET_EMAIL})`);
  }

  if (matchingUsers.length === 0 && linkedClerkUserId) {
    await db.insert(users).values({
      clerkId: linkedClerkUserId,
      createdAt: new Date(),
      ...nextUserValues,
    });
  }

  await db
    .update(orders)
    .set({
      accountType: "partner",
      membershipCategory: "Business",
      applicantType: "Business",
      package: "Business",
      phone: "+1 (916) 957-6174",
      applicationPayload: richApplicationPayload,
    })
    .where(eq(orders.id, order.id));
}

async function seedTeamMembers(order: typeof orders.$inferSelect, ownerClerkUserId: string | null) {
  const db = requireDb();
  const ownerMemberId = await getOwnerMemberId(order.id);

  await db.delete(teamMembers).where(eq(teamMembers.ownerOrderId, order.id));
  await db.delete(teamSeatExtensions).where(eq(teamSeatExtensions.partnerOrderId, order.id));

  const now = new Date();
  const memberRows = seededTeamMembers.map((member, index) => {
    const seatNumber = index + 1;
    const seatKind = seatNumber <= 5 ? "included" : "additional";

    return {
      ownerOrderId: order.id,
      ownerClerkUserId: ownerClerkUserId || "dev-seed-owner",
      ownerMemberId,
      teamMemberId: `${ownerMemberId}-T${seatNumber}`,
      fullName: member.fullName,
      email: member.email,
      emailNormalized: member.email.toLowerCase(),
      role: member.role,
      avatarUrl: member.avatarUrl,
      bio: member.bio,
      location: member.location,
      joinedAt: new Date(member.joinedAt),
      portfolioLink: member.portfolioLink,
      license: member.license,
      affiliationConfirmed: true,
      seatNumber,
      seatKind,
      billingStatus: seatKind === "included" ? "included" : "paid",
      accessStatus: member.status === "removed" ? "removed" : "active",
      status: member.status,
      registrationStatus: member.registrationStatus,
      ticketCode: member.status === "removed" ? null : `IBPA-DEV-${seatNumber.toString().padStart(3, "0")}`,
      attendanceStatus: member.attendanceStatus,
      createdAt: new Date(member.joinedAt),
      updatedAt: now,
    };
  });

  await db.insert(teamMembers).values(memberRows);

  await db.insert(teamSeatExtensions).values([
    {
      partnerOrderId: order.id,
      ownerClerkUserId: ownerClerkUserId || "dev-seed-owner",
      seatsRequested: 4,
      status: "active",
      paymentSessionId: "dev_seed_paid_extension",
      createdAt: new Date("2025-05-01T10:00:00.000Z"),
      updatedAt: now,
    },
    {
      partnerOrderId: order.id,
      ownerClerkUserId: ownerClerkUserId || "dev-seed-owner",
      seatsRequested: 2,
      status: "payment_required",
      paymentSessionId: "dev_seed_pending_extension",
      createdAt: new Date("2025-05-18T10:00:00.000Z"),
      updatedAt: now,
    },
  ]);
}

async function seedEvents() {
  const db = requireDb();
  const existingSeedEvents = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(sql`coalesce(${contentItems.ctaUrl}, '') like ${`${EVENT_CTA_PREFIX}%`}`);

  if (existingSeedEvents.length > 0) {
    await db
      .delete(contentItems)
      .where(inArray(contentItems.id, existingSeedEvents.map((item: { id: string }) => item.id)));
  }

  await db.insert(contentItems).values(
    seededEvents.map((event, index) => ({
      type: "events" as const,
      title: event.title,
      body: event.body,
      coverImage: event.coverImage,
      coverAspect: event.coverAspect,
      eventAddress: event.eventAddress,
      eventAllDay: false,
      eventDate: new Date(event.eventDate),
      eventEndDate: new Date(event.eventEndDate),
      ctaUrl: event.ctaUrl,
      ctaLabel: event.ctaLabel,
      isPinned: event.isPinned,
      publishToSite: event.publishToSite,
      publishToDashboard: event.publishToDashboard,
      createdAt: new Date(new Date(event.eventDate).getTime() - (index + 1) * 86_400_000),
      updatedAt: new Date(),
    })),
  );
}

async function syncCertificate(orderId: string) {
  const db = requireDb();
  const [latestCertificate] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.orderId, orderId))
    .orderBy(desc(certificates.createdAt))
    .limit(1);

  if (!latestCertificate) {
    return null;
  }

  await db
    .update(certificates)
    .set({
      expiresAt: new Date("2027-05-15T00:00:00.000Z"),
    })
    .where(eq(certificates.id, latestCertificate.id));

  return latestCertificate.clerkUserId;
}

async function main() {
  ensureSafeToRun();

  const order = await getTargetOrder();
  const linkedClerkUserId = await syncCertificate(order.id);

  await seedUsers(order, linkedClerkUserId);
  await seedTeamMembers(order, linkedClerkUserId);
  await seedEvents();

  console.log(`DEV dashboard seed complete for ${TARGET_EMAIL}.`);
  console.log(`Updated paid order: ${order.id}`);
  console.log(`Seeded team members: ${seededTeamMembers.length}`);
  console.log(`Seeded events: ${seededEvents.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
