import "../src/load-env";

import crypto from "crypto";
import { createClerkClient } from "@clerk/express";
import { eq, inArray } from "drizzle-orm";

import { requireDb } from "../src/lib/db";
import {
  coreApplications,
  coreProfiles,
  coreUsers,
} from "../src/lib/schema";
import { deleteCanonicalApplicationAggregate, upsertCanonicalApplication } from "../src/features/applications/server/application.repository";
import { upsertCanonicalMembership } from "../src/features/memberships/server/membership.repository";
import { upsertCanonicalPayment } from "../src/features/payments/server/payment.repository";
import { upsertCanonicalCertificate } from "../src/features/certificates/server/certificate.repository";
import { ensureCanonicalUser } from "../src/features/users/server/user.service";

const MEMBER_EMAIL = "qa-member+clerk_test@example.com";
const ADMIN_EMAIL = "qa-admin+clerk_test@example.com";
const PASSWORD = "CodexTest!2026#Flow";
const mode = process.argv[2] || "setup";

const clerk = createClerkClient({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function findClerkUser(email: string) {
  const result = await clerk.users.getUserList({ query: email, limit: 100 });
  return result.data.find((user) =>
    user.emailAddresses.some((item) => item.emailAddress.toLowerCase() === email),
  ) ?? null;
}

async function cleanup() {
  const db = requireDb();
  const users = await db.select().from(coreUsers).where(inArray(coreUsers.email, [MEMBER_EMAIL, ADMIN_EMAIL]));
  for (const user of users) {
    const applications = await db.select().from(coreApplications).where(eq(coreApplications.userId, user.id));
    for (const application of applications) {
      await deleteCanonicalApplicationAggregate(db, application.id);
    }
    await db.delete(coreProfiles).where(eq(coreProfiles.userId, user.id));
    await db.delete(coreUsers).where(eq(coreUsers.id, user.id));
  }

  for (const email of [MEMBER_EMAIL, ADMIN_EMAIL]) {
    const user = await findClerkUser(email);
    if (user) await clerk.users.deleteUser(user.id);
  }
}

async function setup() {
  await cleanup();
  const [memberClerk, adminClerk] = await Promise.all([
    clerk.users.createUser({
      emailAddress: [MEMBER_EMAIL],
      firstName: "QA",
      lastName: "Member",
      password: PASSWORD,
    }),
    clerk.users.createUser({
      emailAddress: [ADMIN_EMAIL],
      firstName: "QA",
      lastName: "Admin",
      password: PASSWORD,
    }),
  ]);

  const db = requireDb();
  const userResult = await ensureCanonicalUser(db, {
    clerkId: memberClerk.id,
    email: MEMBER_EMAIL,
    role: "MEMBER",
    status: "ACTIVE",
  });
  const applicationId = crypto.randomUUID();
  const startedAt = new Date("2026-01-15T12:00:00.000Z");
  const expiresAt = new Date("2027-01-15T12:00:00.000Z");

  await upsertCanonicalApplication(db, {
    id: applicationId,
    userId: userResult.record.id,
    type: "MEMBER",
    packageName: "Professional",
    status: "PAID",
    fullName: "QA Member",
    email: MEMBER_EMAIL,
    phone: null,
    paymentLink: null,
    applicationData: {
      membershipCategory: "Professional",
      applicantType: "Individual",
      firstName: "QA",
      lastName: "Member",
      professionalDesc: "End-to-end membership change test fixture.",
    },
    applicationFiles: [],
    approvedAt: startedAt,
    createdAt: startedAt,
  });
  await upsertCanonicalPayment(db, {
    id: applicationId,
    userId: userResult.record.id,
    type: "membership",
    amount: 19900,
    status: "PAID",
    createdAt: startedAt,
    paidAt: startedAt,
  });
  await upsertCanonicalMembership(db, {
    id: applicationId,
    userId: userResult.record.id,
    type: "Professional",
    status: "ACTIVE",
    startedAt,
    expiresAt,
  });
  await upsertCanonicalCertificate(db, {
    id: applicationId,
    membershipId: applicationId,
    certificateNumber: `CERT-E2E-${applicationId.slice(0, 8).toUpperCase()}`,
    issuedAt: startedAt,
    expiresAt,
  });

  console.log(JSON.stringify({ ready: true, memberClerkId: memberClerk.id, adminClerkId: adminClerk.id }));
}

async function main() {
  if (mode === "cleanup") {
    await cleanup();
    console.log(JSON.stringify({ cleaned: true }));
  } else {
    await setup();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
