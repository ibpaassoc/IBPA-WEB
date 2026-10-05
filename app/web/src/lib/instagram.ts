const INSTAGRAM_HANDLE_PATTERN = /^@?[A-Za-z0-9._]{1,30}$/;
const INSTAGRAM_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/@?[A-Za-z0-9._]{1,30}\/?(?:[?#].*)?$/i;

/** Accepts an Instagram handle (`@name` or `name`) or a profile link. */
export function isInstagramProfile(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return INSTAGRAM_HANDLE_PATTERN.test(trimmed) || INSTAGRAM_URL_PATTERN.test(trimmed);
}
