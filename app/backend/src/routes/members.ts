import { Router } from "express";
import { eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { coreCertificates, coreTeamMembers, coreTeams, coreUsers } from "../lib/schema";
import { classifyCredential } from "../features/teams/server/team-credential";
import {
  getPublicProfilePreviewByUserId,
  listPublicProfiles,
} from "../features/profiles/server/profile.service";

export const membersRouter = Router();

type DbClient = ReturnType<typeof requireDb>;

async function verifyCertificate(db: DbClient, code: string) {
  const [cert] = await db
    .select()
    .from(coreCertificates)
    .where(eq(coreCertificates.certificateNumber, code))
    .limit(1);

  if (!cert) {
    return { valid: false, expiresAt: null };
  }

  const isExpired = cert.expiresAt != null && cert.expiresAt < new Date();

  return {
    valid: !isExpired,
    expiresAt: cert.expiresAt?.toISOString() ?? null,
  };
}

async function verifyTeamCredential(db: DbClient, code: string) {
  const [member] = await db
    .select()
    .from(coreTeamMembers)
    .where(eq(coreTeamMembers.credentials, code))
    .limit(1);

  if (!member) {
    return { valid: false, expiresAt: null };
  }

  // A team credential is valid while the member is not removed AND the owning
  // team is active (i.e. the partner/owner account is still active).
  const memberActive = member.status.toUpperCase() !== "REMOVED";

  const [team] = await db
    .select({ ownerUserId: coreTeams.ownerUserId })
    .from(coreTeams)
    .where(eq(coreTeams.id, member.teamId))
    .limit(1);

  let ownerActive = false;
  if (team) {
    const [owner] = await db
      .select({ status: coreUsers.status })
      .from(coreUsers)
      .where(eq(coreUsers.id, team.ownerUserId))
      .limit(1);
    ownerActive = owner?.status?.toUpperCase() === "ACTIVE";
  }

  return {
    valid: memberActive && ownerActive,
    // Team credentials have no expiry; shape matches the certificate response.
    expiresAt: null,
  };
}

membersRouter.get("/verify-cert", async (req, res) => {
  const certNumber = req.query.certNumber;

  if (!certNumber || typeof certNumber !== "string") {
    return res.status(400).json({ error: "certNumber query param is required" });
  }

  const code = certNumber.trim();

  try {
    const db = requireDb();

    // Route by prefix: TEAM-* codes resolve against team-member credentials,
    // everything else (CERT-*) resolves against membership certificates.
    const result = classifyCredential(code) === "team"
      ? await verifyTeamCredential(db, code)
      : await verifyCertificate(db, code);

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Members /verify-cert] Error:", error);
    res.status(500).json({ error: "Failed to verify certificate" });
  }
});

membersRouter.get("/public", async (_req, res) => {
  try {
    const db = requireDb();
    const items = await listPublicProfiles(db);
    res.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Members /public] Error:", error);
    res.status(500).json({ error: "Failed to fetch public members" });
  }
});

membersRouter.get("/public-preview/:id", async (req, res) => {
  try {
    const db = requireDb();
    const item = await getPublicProfilePreviewByUserId(db, req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Public profile preview not found" });
    }

    res.json({ item });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Members /public-preview/:id] Error:", error);
    res.status(500).json({ error: "Failed to fetch public profile preview" });
  }
});
