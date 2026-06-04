import { Router } from "express";
import { requireDb } from "../lib/db";
import { listPublicProfiles } from "../features/profiles/server/profile.service";

export const membersRouter = Router();

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
