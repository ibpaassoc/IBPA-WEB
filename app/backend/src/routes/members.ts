import { Router } from "express";
import { eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { coreCertificates } from "../lib/schema";
import {
  getPublicProfilePreviewByUserId,
  listPublicProfiles,
} from "../features/profiles/server/profile.service";

export const membersRouter = Router();

membersRouter.get("/verify-cert", async (req, res) => {
  const certNumber = req.query.certNumber;

  if (!certNumber || typeof certNumber !== "string") {
    return res.status(400).json({ error: "certNumber query param is required" });
  }

  try {
    const db = requireDb();
    const [cert] = await db
      .select()
      .from(coreCertificates)
      .where(eq(coreCertificates.certificateNumber, certNumber.trim()))
      .limit(1);

    if (!cert) {
      return res.json({ valid: false });
    }

    const isExpired = cert.expiresAt != null && cert.expiresAt < new Date();

    return res.json({
      valid: !isExpired,
      expiresAt: cert.expiresAt?.toISOString() ?? null,
    });
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
