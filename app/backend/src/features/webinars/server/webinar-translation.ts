import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Russian → English subtitle translation with Claude.
 *
 * Cues are translated in ordered batches and matched back by id, so every
 * English cue keeps the exact timing of the cue it was translated from.
 */

export const TRANSLATION_PROVIDER = "anthropic";
export const TRANSLATION_MODEL = "claude-opus-5";

const BATCH_SIZE = 60;
const CONTEXT_CUES = 6;
const MAX_TOKENS = 16_000;

const SYSTEM_PROMPT = `You translate Russian webinar subtitles into English for IBPA, an international association of beauty professionals. The audience is practising beauty specialists, trainers, and salon owners.

You receive a JSON object with "cues" to translate and optional "context_before" cues that were already translated earlier in the same webinar. Translate every item in "cues" and return exactly one translation per id, in the same order. Never translate or return the context cues.

Each cue is displayed on screen for a fixed time slot, so keep each translation's meaning inside its own cue: do not move words between cues, merge cues, or split them. When a sentence continues across cues, translate each fragment so the sequence reads naturally in English.

Write natural, spoken English that fits on screen, close in length to the source. Keep personal names, brand names, and product names as they appear. Keep professional beauty terminology precise. The source is an automatic or manual transcript and may contain recognition mistakes; translate the most plausible intended meaning rather than the literal misrecognition. If a cue is already in English or contains only a sound or filler, return a faithful short equivalent. Return only the translations, with no commentary.`;

const TranslationBatchSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    }),
  ),
});

export type TranslatableCue = { id: string; text: string };

let client: Anthropic | null = null;

function getClient() {
  if (
    !process.env.ANTHROPIC_API_KEY?.trim() &&
    !process.env.ANTHROPIC_AUTH_TOKEN?.trim()
  ) {
    const error = new Error(
      "AI translation is not configured. Set ANTHROPIC_API_KEY on the backend.",
    );
    Object.assign(error, { code: "PROVIDER_NOT_CONFIGURED" });
    throw error;
  }
  client ??= new Anthropic();
  return client;
}

export function assertTranslationConfigured() {
  getClient();
}

function describeProviderError(error: unknown) {
  if (error instanceof Anthropic.RateLimitError) {
    return "The translation provider is rate limiting requests. Retry in a few minutes.";
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return "The translation provider rejected the configured API key.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "The translation provider could not be reached. Retry shortly.";
  }
  if (error instanceof Anthropic.APIError) {
    return `The translation provider returned an error (${error.status ?? "unknown"}).`;
  }
  return error instanceof Error ? error.message : "Translation failed.";
}

async function translateBatch(
  cues: TranslatableCue[],
  context: TranslatableCue[],
): Promise<Map<string, string>> {
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: TRANSLATION_MODEL,
      max_tokens: MAX_TOKENS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      output_config: { format: betaZodOutputFormat(TranslationBatchSchema) },
      messages: [
        {
          role: "user",
          content: JSON.stringify({ context_before: context, cues }),
        },
      ],
    });
  } catch (error) {
    throw new Error(describeProviderError(error));
  }

  if (response.stop_reason === "refusal") {
    throw new Error("The translation provider declined to translate part of this transcript.");
  }
  if (response.stop_reason === "max_tokens" && cues.length > 1) {
    // Too long for one response: split and try the halves.
    const middle = Math.ceil(cues.length / 2);
    const first = await translateBatch(cues.slice(0, middle), context);
    const second = await translateBatch(cues.slice(middle), [
      ...context,
      ...cues.slice(0, middle).map((cue) => ({
        id: cue.id,
        text: first.get(cue.id) ?? "",
      })),
    ].slice(-CONTEXT_CUES));
    return new Map([...first, ...second]);
  }

  const wanted = new Set(cues.map((cue) => cue.id));
  const result = new Map<string, string>();
  for (const item of response.parsed_output?.translations ?? []) {
    if (wanted.has(item.id) && !result.has(item.id)) {
      result.set(item.id, item.text.trim());
    }
  }
  return result;
}

export type BatchTranslator = (
  cues: TranslatableCue[],
  context: TranslatableCue[],
) => Promise<Map<string, string>>;

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
  for (let start = 0; start < cues.length; start += BATCH_SIZE) {
    const batch = cues.slice(start, start + BATCH_SIZE);
    const context = cues
      .slice(Math.max(0, start - CONTEXT_CUES), start)
      .map((cue) => ({ id: cue.id, text: translated.get(cue.id) ?? "" }));

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
    await onProgress?.(Math.min(start + batch.length, cues.length), cues.length);
  }
  return translated;
}
