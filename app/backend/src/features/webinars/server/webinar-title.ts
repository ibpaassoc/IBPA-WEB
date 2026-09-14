export const MAX_WEBINAR_TITLE_LENGTH = 255;
export const UNTITLED_ZOOM_RECORDING = "Untitled Zoom recording";

export function zoomTopicTitle(topic: string | null | undefined) {
  return topic?.trim() || UNTITLED_ZOOM_RECORDING;
}

/**
 * Zoom sync refreshes the title from the meeting topic unless an admin renamed
 * the webinar. A title counts as renamed when it differs from the topic the
 * previous sync stored; rows synced before topics were stored follow Zoom.
 */
export function resolveSyncedTitle(input: {
  currentTitle: string;
  previousTopic: string | null | undefined;
  incomingTitle: string;
}) {
  const renamed =
    typeof input.previousTopic === "string" &&
    input.currentTitle !== input.previousTopic;
  return renamed ? input.currentTitle : input.incomingTitle;
}

export function validateWebinarTitle(
  raw: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Enter a webinar title." };
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return { ok: false, error: "Enter a webinar title." };
  if (value.length > MAX_WEBINAR_TITLE_LENGTH) {
    return {
      ok: false,
      error: `Keep the title under ${MAX_WEBINAR_TITLE_LENGTH} characters.`,
    };
  }
  return { ok: true, value };
}
