const INSTAGRAM_HANDLE_PATTERN = /^@?[A-Za-z0-9._]{1,30}$/;
const INSTAGRAM_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/@?[A-Za-z0-9._]{1,30}\/?(?:[?#].*)?$/i;

const INSTAGRAM_FIELD_BY_PACKAGE: Record<string, string> = {
  Business: "businessInstagram",
  Brand: "brandInstagram",
};

function hasFiles(value: unknown, minimum: number) {
  return Array.isArray(value)
    && value.filter((item) => typeof item === "string" && item.trim()).length >= minimum;
}

/** Accepts an Instagram handle (`@name` or `name`) or a profile link. */
export function isInstagramProfile(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return INSTAGRAM_HANDLE_PATTERN.test(trimmed) || INSTAGRAM_URL_PATTERN.test(trimmed);
}

/**
 * Requirements every membership application must meet regardless of category.
 * Returns the first problem as an applicant-facing message, or null.
 */
export function validateApplicationRequirements(
  membershipPackage: string,
  payload: Record<string, unknown>,
) {
  const instagramField = INSTAGRAM_FIELD_BY_PACKAGE[membershipPackage] ?? "instagramLink";
  if (!isInstagramProfile(payload[instagramField])) {
    return "Instagram is required. Enter your Instagram handle or profile link.";
  }

  const profilePhotoField = membershipPackage === "Business" ? "businessProfilePhotoFiles" : "profilePhotoFiles";
  if (!hasFiles(payload[profilePhotoField], 1)) {
    return "A profile photo is required.";
  }

  return null;
}
