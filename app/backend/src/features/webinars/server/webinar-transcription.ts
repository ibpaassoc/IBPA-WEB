/**
 * Speech-to-text for webinar audio (AssemblyAI).
 *
 * AssemblyAI fetches the media itself from a short-lived signed R2 URL, so the
 * backend never downloads or transcodes multi-gigabyte recordings. The provider
 * returns timestamped WebVTT directly.
 */

export const TRANSCRIPTION_PROVIDER = "assemblyai";
const REQUEST_TIMEOUT_MS = 30_000;
const CHARS_PER_CAPTION = 84;

export type TranscriptionStatus =
  | { status: "queued" | "processing" }
  | { status: "completed" }
  | { status: "error"; error: string };

function getConfig() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error(
      "AI transcription is not configured. Set ASSEMBLYAI_API_KEY in the backend environment and restart the backend.",
    );
    Object.assign(error, { code: "PROVIDER_NOT_CONFIGURED" });
    throw error;
  }
  return {
    apiKey,
    baseUrl: (
      process.env.ASSEMBLYAI_BASE_URL?.trim() || "https://api.assemblyai.com"
    ).replace(/\/+$/, ""),
  };
}

export function assertTranscriptionConfigured() {
  getConfig();
}

async function request(path: string, init: RequestInit = {}) {
  const { apiKey, baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: apiKey,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let message = body.slice(0, 300);
    try {
      const parsed = JSON.parse(body) as { error?: unknown };
      if (typeof parsed.error === "string") message = parsed.error;
    } catch {
      // Plain-text provider error.
    }
    throw new Error(
      `Transcription provider request failed (${response.status})${message ? `: ${message}` : "."}`,
    );
  }
  return response;
}

export async function submitRussianTranscription(audioUrl: string) {
  const response = await request("/v2/transcript", {
    method: "POST",
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: "ru",
      punctuate: true,
      format_text: true,
    }),
  });
  const data = (await response.json()) as { id?: unknown };
  if (typeof data.id !== "string" || !data.id) {
    throw new Error("Transcription provider did not return a job id.");
  }
  return data.id;
}

export async function getTranscriptionStatus(
  providerJobId: string,
): Promise<TranscriptionStatus> {
  const response = await request(
    `/v2/transcript/${encodeURIComponent(providerJobId)}`,
  );
  const data = (await response.json()) as { status?: unknown; error?: unknown };
  if (data.status === "completed") return { status: "completed" };
  if (data.status === "error") {
    return {
      status: "error",
      error:
        typeof data.error === "string" && data.error
          ? data.error
          : "The transcription provider could not process this recording.",
    };
  }
  return { status: data.status === "queued" ? "queued" : "processing" };
}

export async function getTranscriptionVtt(providerJobId: string) {
  const response = await request(
    `/v2/transcript/${encodeURIComponent(providerJobId)}/vtt?chars_per_caption=${CHARS_PER_CAPTION}`,
  );
  return response.text();
}
