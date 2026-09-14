/**
 * Russian → English subtitle translation with the DeepL API (Free or Pro key).
 *
 * Cues are translated in ordered batches. DeepL returns translations in the
 * order the texts were sent, so every English cue keeps the exact timing of
 * the cue it was translated from. Preceding source cues are sent as `context`,
 * which DeepL uses for continuity and does not bill.
 */

export const TRANSLATION_PROVIDER = "deepl";
export const TRANSLATION_MODEL = "DeepL";

const BATCH_SIZE = 50;
const MAX_BATCH_BYTES = 100 * 1024;
const CONTEXT_CUES = 6;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 4;

export type TranslatableCue = { id: string; text: string };

export type BatchTranslator = (
  cues: TranslatableCue[],
  context: TranslatableCue[],
) => Promise<Map<string, string>>;

function getConfig() {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error(
      "AI translation is not configured. Set DEEPL_API_KEY on the backend.",
    );
    Object.assign(error, { code: "PROVIDER_NOT_CONFIGURED" });
    throw error;
  }
  // DeepL API Free keys end with ":fx" and use a separate host.
  const defaultUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";
  return {
    apiKey,
    baseUrl: (process.env.DEEPL_API_URL?.trim() || defaultUrl).replace(/\/+$/, ""),
    targetLang: process.env.DEEPL_TARGET_LANG?.trim() || "EN-US",
  };
}

export function assertTranslationConfigured() {
  getConfig();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function providerError(status: number) {
  if (status === 403) return "DeepL rejected the configured API key.";
  if (status === 456) {
    return "The DeepL character quota for this billing period is used up. Retry after it resets or upgrade the DeepL plan.";
  }
  if (status === 413) return "A subtitle batch was too large for DeepL.";
  if (status === 429) return "DeepL is rate limiting requests. Retry in a few minutes.";
  return `DeepL returned an error (${status}).`;
}

/** Retries rate limits, server errors, and network failures with backoff. */
async function deeplRequest(path: string, init: RequestInit = {}) {
  const { apiKey, baseUrl } = getConfig();
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (attempt) await sleep(1000 * 2 ** attempt);
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      lastError = new Error("DeepL could not be reached. Retry shortly.");
      continue;
    }
    if (response.ok) return (await response.json()) as unknown;
    lastError = new Error(providerError(response.status));
    // Auth, quota, and request errors will not succeed on retry.
    if (response.status !== 429 && response.status < 500) break;
  }
  throw lastError ?? new Error("DeepL translation failed.");
}

export function countTranslationCharacters(cues: TranslatableCue[]) {
  return cues.reduce((total, cue) => total + Array.from(cue.text).length, 0);
}

/**
 * Fails before any work starts when the remaining character allowance cannot
 * cover the transcript, instead of stopping partway through.
 */
export async function assertTranslationQuota(characters: number) {
  const usage = (await deeplRequest("/v2/usage")) as {
    character_count?: unknown;
    character_limit?: unknown;
  };
  const used = Number(usage.character_count);
  const limit = Number(usage.character_limit);
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return;
  const remaining = Math.max(0, limit - used);
  if (characters > remaining) {
    const format = (value: number) => value.toLocaleString("en-US");
    throw new Error(
      `This transcript needs about ${format(characters)} DeepL characters, but only ${format(remaining)} of ${format(limit)} remain this billing period.`,
    );
  }
}

const translateBatch: BatchTranslator = async (cues, context) => {
  const { targetLang } = getConfig();
  const data = (await deeplRequest("/v2/translate", {
    method: "POST",
    body: JSON.stringify({
      text: cues.map((cue) => cue.text),
      source_lang: "RU",
      target_lang: targetLang,
      // Earlier cues help DeepL finish sentences that span cue boundaries.
      ...(context.length
        ? { context: context.map((cue) => cue.text).join("\n") }
        : {}),
      preserve_formatting: true,
    }),
  })) as { translations?: Array<{ text?: unknown }> };

  const translations = Array.isArray(data.translations) ? data.translations : [];
  const result = new Map<string, string>();
  cues.forEach((cue, index) => {
    const text = translations[index]?.text;
    if (typeof text === "string" && text.trim()) result.set(cue.id, text.trim());
  });
  return result;
};

/** Splits cues into DeepL-sized batches by count and request size. */
export function planTranslationBatches(cues: TranslatableCue[]) {
  const batches: TranslatableCue[][] = [];
  let current: TranslatableCue[] = [];
  let bytes = 0;
  for (const cue of cues) {
    const size = Buffer.byteLength(cue.text, "utf8") + 16;
    if (
      current.length &&
      (current.length >= BATCH_SIZE || bytes + size > MAX_BATCH_BYTES)
    ) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(cue);
    bytes += size;
  }
  if (current.length) batches.push(current);
  return batches;
}

/**
 * Translates cues in order. `onProgress` runs after each batch so the caller
 * can record progress. Throws if any cue is still missing after one retry.
 */
export async function translateCuesToEnglish(
  cues: TranslatableCue[],
  onProgress?: (completed: number, total: number) => Promise<void>,
  translate: BatchTranslator = translateBatch,
) {
  const translated = new Map<string, string>();
  let completed = 0;
  for (const batch of planTranslationBatches(cues)) {
    // DeepL expects context in the source language, so pass source cues.
    const context = cues.slice(Math.max(0, completed - CONTEXT_CUES), completed);

    let result = await translate(batch, context);
    const missing = batch.filter((cue) => !result.has(cue.id));
    if (missing.length) {
      const retry = await translate(missing, context);
      result = new Map([...result, ...retry]);
    }
    const stillMissing = batch.filter((cue) => !result.has(cue.id));
    if (stillMissing.length) {
      throw new Error(
        `The translation was incomplete (${stillMissing.length} cues missing). Retry to run it again.`,
      );
    }
    for (const [id, text] of result) translated.set(id, text);
    completed += batch.length;
    await onProgress?.(completed, cues.length);
  }
  return translated;
}
