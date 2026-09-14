import type {
  SubtitleRevision,
  SubtitleTrackLanguage,
  SubtitleVersion,
  SubtitleVersionKind,
  WebinarSubtitleState,
} from "../types/webinar.types";

export const kindShortLabel: Record<SubtitleVersionKind, string> = {
  SOURCE: "Zoom original",
  RU_AI: "AI Russian",
  RU_MANUAL: "Manual Russian",
  EN_AI: "AI English",
  EN_MANUAL: "Manual English",
};

/** Compact lineage token used in relationship strings such as `RU_AI → EN_AI`. */
export const kindCode: Record<SubtitleVersionKind, string> = {
  SOURCE: "SOURCE",
  RU_AI: "RU_AI",
  RU_MANUAL: "RU_MANUAL",
  EN_AI: "EN_AI",
  EN_MANUAL: "EN_MANUAL",
};

export const languageName: Record<SubtitleTrackLanguage, string> = {
  ru: "Russian",
  en: "English",
};

export function isManualKind(kind: SubtitleVersionKind) {
  return kind === "RU_MANUAL" || kind === "EN_MANUAL";
}

export function findVersion(
  state: WebinarSubtitleState | null | undefined,
  versionId: string | null | undefined,
) {
  if (!state || !versionId) return null;
  return state.versions.find((version) => version.id === versionId) || null;
}

export function currentRevision(version: SubtitleVersion | null | undefined) {
  if (!version) return null;
  return (
    version.revisions.find((revision) => revision.id === version.currentRevisionId) ||
    null
  );
}

export function isReadyVersion(version: SubtitleVersion | null | undefined) {
  return Boolean(version && version.status === "READY" && currentRevision(version));
}

/** Versions of the same kind and origin get an ordinal so names stay unique. */
function ordinalWithinLabel(state: WebinarSubtitleState, version: SubtitleVersion) {
  const siblings = state.versions.filter(
    (item) =>
      item.kind === version.kind &&
      item.origin.sourceKind === version.origin.sourceKind,
  );
  if (siblings.length < 2) return "";
  return ` · ${siblings.findIndex((item) => item.id === version.id) + 1}`;
}

/** How a source reads inside "AI from …" / "from …" phrases. */
const sourcePhrase: Record<SubtitleVersionKind, string> = {
  SOURCE: "Source",
  RU_AI: "AI Russian",
  RU_MANUAL: "Manual Russian",
  EN_AI: "AI English",
  EN_MANUAL: "Manual English",
};

function sourceName(state: WebinarSubtitleState, version: SubtitleVersion) {
  const source = findVersion(state, version.origin.sourceVersionId);
  const kind = source?.kind ?? version.origin.sourceKind;
  return kind ? sourcePhrase[kind] : null;
}

/** Human name shown in navigation, e.g. "AI from Manual Russian". */
export function versionName(state: WebinarSubtitleState, version: SubtitleVersion) {
  const from = sourceName(state, version);
  let name: string;
  switch (version.kind) {
    case "SOURCE":
      name = version.origin.type === "ZOOM_IMPORT" ? "Zoom original" : "Original transcript";
      break;
    case "RU_AI":
      name = "AI generated";
      break;
    case "EN_AI":
      name = from ? `AI from ${from}` : "AI translation";
      break;
    case "RU_MANUAL":
    case "EN_MANUAL": {
      if (version.origin.type === "LEGACY_TRACK") {
        name = "Earlier English track";
        break;
      }
      const manualCount = state.versions.filter(
        (item) => item.kind === version.kind && item.origin.type !== "LEGACY_TRACK",
      ).length;
      name = manualCount > 1 && from ? `Manual correction · from ${from}` : "Manual correction";
      break;
    }
  }
  return `${name}${ordinalWithinLabel(state, version)}`;
}

/** Root-first chain of kinds, e.g. [SOURCE, EN_AI, EN_MANUAL]. */
export function lineageKinds(state: WebinarSubtitleState, version: SubtitleVersion) {
  const chain: SubtitleVersionKind[] = [version.kind];
  const seen = new Set([version.id]);
  let cursor: SubtitleVersion | null = version;
  while (cursor?.origin.sourceVersionId && !seen.has(cursor.origin.sourceVersionId)) {
    const parent = findVersion(state, cursor.origin.sourceVersionId);
    if (!parent) {
      if (cursor.origin.sourceKind) chain.unshift(cursor.origin.sourceKind);
      break;
    }
    seen.add(parent.id);
    chain.unshift(parent.kind);
    cursor = parent;
  }
  return chain;
}

export function lineageLabel(state: WebinarSubtitleState, version: SubtitleVersion) {
  return lineageKinds(state, version).map((kind) => kindCode[kind]).join(" → ");
}

export type NavigatorLane = {
  key: "source" | SubtitleTrackLanguage;
  title: string;
  versions: SubtitleVersion[];
};

/** Source → Russian → English lanes, oldest first within each lane. */
export function navigatorLanes(state: WebinarSubtitleState): NavigatorLane[] {
  const byCreated = [...state.versions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return [
    {
      key: "source",
      title: "Source",
      versions: byCreated.filter((version) => version.kind === "SOURCE"),
    },
    {
      key: "ru",
      title: "Russian",
      versions: byCreated.filter(
        (version) => version.kind === "RU_AI" || version.kind === "RU_MANUAL",
      ),
    },
    {
      key: "en",
      title: "English",
      versions: byCreated.filter((version) => version.language === "en"),
    },
  ];
}

/** Ready Russian-language versions the admin may translate from. */
export function translationSources(state: WebinarSubtitleState) {
  return state.versions.filter(
    (version) => version.language === "ru" && isReadyVersion(version),
  );
}

/** Manual versions already derived from a base version, newest first. */
export function manualVersionsFrom(state: WebinarSubtitleState, baseId: string) {
  return state.versions
    .filter(
      (version) => isManualKind(version.kind) && version.origin.sourceVersionId === baseId,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isVersionActive(state: WebinarSubtitleState, version: SubtitleVersion) {
  return state.activeVersionIds[version.language] === version.id;
}

export function revisionLabel(revision: SubtitleRevision) {
  switch (revision.kind) {
    case "BASELINE":
      return "Starting point";
    case "RESTORE":
      return revision.note || "Restored";
    case "INITIAL":
      return revision.note || "Created";
    default:
      return revision.note || "Manual edit";
  }
}
