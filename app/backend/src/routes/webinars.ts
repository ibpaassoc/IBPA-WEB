import { Router, type Request, type Response } from "express";
import {
  createEnglishTestTrack,
  getWebinarDetail,
  getWebinarImportOptions,
  getWebinarList,
  getWebinarPlayback,
  getWebinarSubtitle,
  isSubtitleLanguage,
  saveWebinarSubtitle,
  startWebinarImport,
  syncZoomWebinars,
} from "../features/webinars/server/webinar.service";
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

webinarsRouter.get("/:id/subtitles", async (req, res) => {
  const language = single(req.query.language);
  if (!isSubtitleLanguage(language)) {
    return res
      .status(400)
      .json({ error: "Subtitle language must be ru, en, or uk." });
  }
  try {
    const result = await getWebinarSubtitle(
      single(req.params.id) || "",
      language,
    );
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "missing")
      return res.status(404).json({ error: "Subtitle track not found." });
    return res.set("Cache-Control", "private, no-store").json(result);
  } catch (error) {
    return sendWebinarError(res, error, "Failed to load subtitles.");
  }
});

webinarsRouter.put("/:id/subtitles", async (req, res) => {
  const language = req.body?.language;
  if (!isSubtitleLanguage(language) || typeof req.body?.vtt !== "string") {
    return res
      .status(400)
      .json({
        error: "A valid subtitle language and VTT document are required.",
      });
  }
  try {
    const result = await saveWebinarSubtitle({
      id: single(req.params.id) || "",
      language,
      vtt: req.body.vtt,
      expectedEtag:
        typeof req.body.expectedEtag === "string"
          ? req.body.expectedEtag
          : null,
    });
    return result
      ? res.json(result)
      : res.status(404).json({ error: "Webinar not found." });
  } catch (error) {
    return sendWebinarError(res, error, "Failed to save subtitles.");
  }
});

webinarsRouter.post("/:id/translate-english", async (req, res) => {
  try {
    const result = await createEnglishTestTrack(single(req.params.id) || "");
    if (result.outcome === "not-found")
      return res.status(404).json({ error: "Webinar not found." });
    if (result.outcome === "missing-source") {
      return res
        .status(409)
        .json({ error: "A Russian subtitle track is required first." });
    }
    if (result.outcome === "exists") {
      return res
        .status(409)
        .json({
          error:
            "English subtitles already exist. Edit the current track instead.",
        });
    }
    return res.status(201).json(result);
  } catch (error) {
    return sendWebinarError(
      res,
      error,
      "Failed to create the English test track.",
    );
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
