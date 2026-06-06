export function getStableMemberNumericId(source?: string | null) {
  const value = String(source || "ibpa-member").trim();
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_000;
  }

  return String(hash || 123).padStart(6, "0");
}

export function formatMemberId(source?: string | null) {
  return `IBPA #${getStableMemberNumericId(source)}`;
}

export function getPublicProfileHref(source?: string | null) {
  if (!source) {
    return null;
  }

  return `/member/${encodeURIComponent(source)}`;
}

export function getDashboardProfilePreviewHref() {
  return "/dashboard/profile/preview";
}
