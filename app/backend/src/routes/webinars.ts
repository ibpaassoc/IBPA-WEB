import { Router, type Request, type Response } from "express";
import {
  publishWebinar,
  toPublicationResponse,
  unpublishWebinar,
  updateWebinarAccess,
  getWebinarDetail,
  getWebinarImportOptions,
  getWebinarList,
  getWebinarPlayback,
  startWebinarImport,
  syncZoomWebinars,
} from "../features/webinars/server/webinar.service";
import {
  getSubtitleVersionContent,
  restoreSubtitleRevision,
  saveManualSubtitleRevision,
  setActiveSubtitleVersion,
} from "../features/webinars/server/webinar-subtitles.service";
import { isSubtitleTrackLanguage } from "../features/webinars/server/webinar-subtitle-state";
import { validateWebinarAccessInput } from "../features/webinars/server/webinar-access";
import {
  retrySubtitleVersion,
  startEnglishTranslation,
  startRussianTranscript,
} from "../features/webinars/server/webinar-subtitle-jobs.service";

export const webinarsRouter = Router();

function single(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/** Admin email forwarded by the authenticated Next proxy; used for audit labels only. */
function adminActor(req: Request) {
  const email = req.header("x-admin-user-email")?.trim().toLowerCase();
  return email ? email.slice(0, 255) : null;
}

function sendWebinarError(res: Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const code =
    error && typeof error === "object"
      ? (error as { code?: string }).code
      : null;
  if (code === "VERSION_CONFLICT")
    return res.status(409).json({ error: message, code });
  if (message.includes("DATABASE_URL") || message.includes("not configured")) {
    return res.status(503).json({ error: message });
  }
  if (
    message.startsWith("Failed query:") ||
    code?.startsWith("23") ||
    code?.startsWith("42")
  ) {
    console.error("[Webinars API] Database request failed", error);
    return res.status(500).json({ error: fallback });
  }
  if (
    message.includes("date") ||
    message.includes("Date") ||
    message.includes("WebVTT") ||
    message.includes("4 MB")
  ) {
    return res.status(400).json({ error: message });
  }
  console.error("[Webinars API] Provider request failed", error);
  return res.status(502).json({ error: message || fallback });
}

webinarsRouter.get("/", async (req, res) => {
  try {
    const result = await getWebinarList({
      from: single(req.query.from),
      to: single(req.query.to),
      page: Number(single(req.query.page) || 1),
      pageSize: Number(single(req.query.pageSize) || 20),
      query: single(req.query.query),
      status: single(req.query.status),
    });
    return res.json(result);
  } catch (error) {
    return sendWebinarError(res, error, "Failed to load webinars.");
  }
});

webinarsRouter.post("/sync", async (req, res) => {
  try {
    const from = typeof req.body?.from === "string" ? req.body.from : "";
    const to = typeof req.body?.to === "string" ? req.body.to : "";
    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "A start and end date are required." });
    }
    return res.json(await syncZoomWebinars({ from, to }));
  } catch (error) {
    return sendWebinarError(res, error, "Failed to sync Zoom recordings.");
  }
});

webinarsRouter.get("/:id/import-options", async (req, res) => {
  try {
    const result = await getWebinarImportOptions(single(req.params.id) || "");
    return result
      ? res.json(result)
      : res.status(404).json({ error: "Webinar not found." });
  } catch (error) {
    return sendWebinarError(
      res,
      error,
      "Failed to inspect Zoom recording files.",
    );
  }
});

webinarsRouter.post("/:id/import", async (req, res) => {
  try {
    const recordingFileId =
      typeof req.body?.recordingFileId === "string"
        ? req.body.recordingFileId
        : "";
    if (!recordingFileId) {
      return res
        .status(400)
        .json({ error: "Choose a Zoom MP4 recording file." });
    }
    const result = await startWebinarImport(
      single(req.params.id) || "",
      recordingFileId,
    );
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "conflict" || result.outcome === "invalid-file") {
      return res.status(409).json({ error: result.message });
    }
    return res.status(result.outcome === "started" ? 202 : 200).json(result);
  } catch (error) {
    return sendWebinarError(res, error, "Failed to start the webinar import.");
  }
});

webinarsRouter.get("/:id/playback", async (req, res) => {
  try {
    const result = await getWebinarPlayback(single(req.params.id) || "");
    return result
      ? res.set("Cache-Control", "private, no-store").json(result)
      : res.status(404).json({ error: "Imported video is not available." });
  } catch (error) {
    return sendWebinarError(res, error, "Failed to create a playback URL.");
  }
});

webinarsRouter.get(
  "/:id/subtitle-versions/:versionId/content",
  async (req, res) => {
    try {
      const result = await getSubtitleVersionContent({
        webinarId: single(req.params.id) || "",
        versionId: single(req.params.versionId) || "",
        revisionId: single(req.query.revisionId),
      });
      if (result.outcome === "not-found")
        return res.status(404).json({ error: "Webinar not found." });
      if (result.outcome === "missing")
        return res.status(404).json({ error: "Subtitle version not found." });
      return res.set("Cache-Control", "private, no-store").json(result);
    } catch (error) {
      return sendWebinarError(res, error, "Failed to load subtitles.");
    }
  },
);

webinarsRouter.post(
  "/:id/subtitle-versions/:versionId/revisions",
  async (req, res) => {
    if (typeof req.body?.vtt !== "string") {
      return res.status(400).json({ error: "A WebVTT document is required." });
    }
    try {
      const result = await saveManualSubtitleRevision({
        webinarId: single(req.params.id) || "",
        versionId: single(req.params.versionId) || "",
        vtt: req.body.vtt,
        expectedRevisionId:
          typeof req.body.expectedRevisionId === "string"
            ? req.body.expectedRevisionId
            : null,
        actor: adminActor(req),
      });
      if (result.outcome === "not-found")
        return res.status(404).json({ error: "Webinar not found." });
      if (result.outcome === "missing")
        return res.status(404).json({ error: "Subtitle version not found." });
      if (result.outcome === "not-editable") {
        return res.status(409).json({
          error: "This version is still processing or has no subtitles to edit.",
        });
      }
      return res.status(result.createdVersion ? 201 : 200).json(result);
    } catch (error) {
      return sendWebinarError(res, error, "Failed to save subtitles.");
    }
  },
);

webinarsRouter.post(
  "/:id/subtitle-versions/:versionId/restore",
  async (req, res) => {
    const revisionId =
      typeof req.body?.revisionId === "string" ? req.body.revisionId : "";
    if (!revisionId) {
      return res.status(400).json({ error: "Choose a revision to restore." });
    }
    try {
      const result = await restoreSubtitleRevision({
        webinarId: single(req.params.id) || "",
        versionId: single(req.params.versionId) || "",
        revisionId,
        expectedRevisionId:
          typeof req.body.expectedRevisionId === "string"
            ? req.body.expectedRevisionId
            : null,
        actor: adminActor(req),
      });
      if (result.outcome === "not-found")
        return res.status(404).json({ error: "Subtitle revision not found." });
      if (result.outcome === "not-restorable") {
        return res.status(409).json({
          error: "Only an earlier revision of a manual version can be restored.",
        });
      }
      return res.json(result);
    } catch (error) {
      return sendWebinarError(res, error, "Failed to restore the revision.");
    }
  },
);

webinarsRouter.put("/:id/subtitle-tracks", async (req, res) => {
  const language = req.body?.language;
  const versionId = req.body?.versionId;
  if (
    !isSubtitleTrackLanguage(language) ||
    !(versionId === null || typeof versionId === "string")
  ) {
    return res.status(400).json({
      error: "A subtitle language (ru or en) and a version id or null are required.",
    });
  }
  try {
    const result = await setActiveSubtitleVersion({
      webinarId: single(req.params.id) || "",
      language,
      versionId,
    });
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "invalid") {
      return res.status(409).json({
        error: "Only a ready version in the same language can be shown to members.",
      });
    }
    return res.json(result);
  } catch (error) {
    return sendWebinarError(res, error, "Failed to update the member track.");
  }
});

webinarsRouter.post("/:id/subtitle-versions/russian-ai", async (req, res) => {
  try {
    const result = await startRussianTranscript(
      single(req.params.id) || "",
      adminActor(req),
    );
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "no-video") {
      return res.status(409).json({
        error: "Import the recording before generating an AI transcript.",
      });
    }
    return res
      .status(result.outcome === "started" ? 202 : 200)
      .json(result);
  } catch (error) {
    return sendWebinarError(
      res,
      error,
      "Failed to start the Russian AI transcript.",
    );
  }
});

webinarsRouter.post("/:id/subtitle-versions/english-ai", async (req, res) => {
  const sourceVersionId =
    typeof req.body?.sourceVersionId === "string" ? req.body.sourceVersionId : "";
  if (!sourceVersionId) {
    return res
      .status(400)
      .json({ error: "Choose which Russian version to translate." });
  }
  try {
    const result = await startEnglishTranslation(
      single(req.params.id) || "",
      sourceVersionId,
      adminActor(req),
    );
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "invalid-source") {
      return res.status(409).json({
        error: "The selected source must be a ready Russian subtitle version.",
      });
    }
    return res
      .status(result.outcome === "started" ? 202 : 200)
      .json(result);
  } catch (error) {
    return sendWebinarError(
      res,
      error,
      "Failed to start the English translation.",
    );
  }
});

webinarsRouter.post("/:id/subtitle-versions/:versionId/retry", async (req, res) => {
  try {
    const result = await retrySubtitleVersion(
      single(req.params.id) || "",
      single(req.params.versionId) || "",
    );
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "no-video") {
      return res.status(409).json({
        error: "Import the recording before generating an AI transcript.",
      });
    }
    if (result.outcome === "not-retryable") {
      return res.status(409).json({
        error: "Only a failed or interrupted AI version can be retried.",
      });
    }
    return res.status(202).json(result);
  } catch (error) {
    return sendWebinarError(res, error, "Failed to retry the subtitle job.");
  }
});

webinarsRouter.post("/:id/publish", async (req, res) => {
  const access = validateWebinarAccessInput(req.body?.access);
  if (!access.ok) return res.status(400).json({ error: access.error });
  try {
    const result = await publishWebinar({
      id: single(req.params.id) || "",
      access: access.value,
      actor: adminActor(req),
    });
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "no-video") {
      return res.status(409).json({
        error: "Import the recording before publishing this webinar.",
      });
    }
    return res.json(toPublicationResponse(result.webinar));
  } catch (error) {
    return sendWebinarError(res, error, "Failed to publish the webinar.");
  }
});

webinarsRouter.post("/:id/unpublish", async (req, res) => {
  try {
    const result = await unpublishWebinar(single(req.params.id) || "");
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    return res.json(toPublicationResponse(result.webinar));
  } catch (error) {
    return sendWebinarError(res, error, "Failed to move the webinar to draft.");
  }
});

webinarsRouter.put("/:id/access", async (req, res) => {
  const access = validateWebinarAccessInput(req.body?.access);
  if (!access.ok) return res.status(400).json({ error: access.error });
  try {
    const result = await updateWebinarAccess({
      id: single(req.params.id) || "",
      access: access.value,
      actor: adminActor(req),
    });
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    return res.json(toPublicationResponse(result.webinar));
  } catch (error) {
    return sendWebinarError(res, error, "Failed to save access settings.");
  }
});

webinarsRouter.get("/:id", async (req, res) => {
  try {
    const result = await getWebinarDetail(single(req.params.id) || "");
    return result
      ? res.set("Cache-Control", "private, no-store").json(result)
      : res.status(404).json({ error: "Webinar not found." });
  } catch (error) {
    return sendWebinarError(res, error, "Failed to load the webinar.");
  }
});
