"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Columns2,
  LoaderCircle,
  PencilLine,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSubtitleVersionContent } from "../server/webinar.repository";
import type {
  SubtitleVersion,
  SubtitleVersionKind,
  WebinarSubtitleState,
} from "../types/webinar.types";
import {
  alignSubtitleCues,
  summarizeAlignment,
  type AlignedRow,
  type DiffSegment,
} from "../utils/subtitle-diff";
import {
  currentRevision,
  findVersion,
  isReadyVersion,
  languageName,
  lineageLabel,
  versionName,
} from "../utils/subtitle-versions";
import { parseVtt, type VttCue } from "../utils/vtt";
import { scrollWithinContainer } from "../utils/scroll-within";
import { formatDuration } from "../utils/webinar-formatters";

type SubtitleCompareViewProps = {
  webinarId: string;
  state: WebinarSubtitleState;
  focusVersionId: string | null;
  currentTime: number;
  onSeek: (time: number) => void;
  onOpenInEditor: (versionId: string) => void;
};

type PairPreset = { label: string; leftId: string; rightId: string };

const rowRail: Record<AlignedRow["status"], string> = {
  same: "shadow-[inset_3px_0_0_transparent]",
  changed: "shadow-[inset_3px_0_0_#7EA8CF]",
  "left-only": "shadow-[inset_3px_0_0_#D9534F]",
  "right-only": "shadow-[inset_3px_0_0_#2F9E68]",
};

const rowStatusLabel: Record<AlignedRow["status"], string | null> = {
  same: null,
  changed: "Changed",
  "left-only": "Only in A",
  "right-only": "Only in B",
};

function latestReady(
  state: WebinarSubtitleState,
  kinds: SubtitleVersionKind[],
) {
  return [...state.versions]
    .filter(
      (version) => kinds.includes(version.kind) && isReadyVersion(version),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function buildPresets(state: WebinarSubtitleState): PairPreset[] {
  const source = latestReady(state, ["SOURCE"]);
  const ruAi = latestReady(state, ["RU_AI"]);
  const ruManual = latestReady(state, ["RU_MANUAL"]);
  const enAi = latestReady(state, ["EN_AI"]);
  const enManual = latestReady(state, ["EN_MANUAL"]);
  const presets: Array<PairPreset | null> = [
    source && ruAi
      ? { label: "Source ↔ AI Russian", leftId: source.id, rightId: ruAi.id }
      : null,
    source && ruManual
      ? {
          label: "Source ↔ Manual Russian",
          leftId: source.id,
          rightId: ruManual.id,
        }
      : null,
    ruAi && ruManual
      ? { label: "AI ↔ Manual Russian", leftId: ruAi.id, rightId: ruManual.id }
      : null,
    enAi && enManual
      ? { label: "AI ↔ Manual English", leftId: enAi.id, rightId: enManual.id }
      : null,
  ];
  return presets.filter((preset): preset is PairPreset => Boolean(preset));
}

/** Prefer comparing the focused version against what it was derived from. */
function initialPair(
  state: WebinarSubtitleState,
  focusVersionId: string | null,
) {
  const focus = findVersion(state, focusVersionId);
  if (focus && isReadyVersion(focus)) {
    const origin = findVersion(state, focus.origin.sourceVersionId);
    if (
      origin &&
      origin.language === focus.language &&
      isReadyVersion(origin)
    ) {
      return { leftId: origin.id, rightId: focus.id };
    }
    const partner = state.versions.find(
      (version) =>
        version.id !== focus.id &&
        version.language === focus.language &&
        isReadyVersion(version),
    );
    if (partner) {
      return partner.kind === "SOURCE" || partner.createdAt < focus.createdAt
        ? { leftId: partner.id, rightId: focus.id }
        : { leftId: focus.id, rightId: partner.id };
    }
  }
  const preset = buildPresets(state)[0];
  return preset ? { leftId: preset.leftId, rightId: preset.rightId } : null;
}

function DiffText({
  segments,
  highlight,
}: {
  segments: DiffSegment[];
  highlight: boolean;
}) {
  if (!segments.length) {
    return (
      <span className="text-xs italic text-[#8AA2BD]">
        No text in this range
      </span>
    );
  }
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "equal" || !highlight) {
          return <span key={index}>{segment.text}</span>;
        }
        const word = segment.text.trimEnd();
        const trailing = segment.text.slice(word.length);
        return (
          <span key={index}>
            {segment.kind === "removed" ? (
              <del className="rounded-[4px] bg-[#FDE7E7] px-0.5 text-[#8F241E] decoration-[#D9534F]/70 decoration-1">
                {word}
              </del>
            ) : (
              <ins className="rounded-[4px] bg-[#DDF3E6] px-0.5 text-[#145C3B] no-underline shadow-[inset_0_-1.5px_0_#2F9E68]">
                {word}
              </ins>
            )}
            {trailing}
          </span>
        );
      })}
    </>
  );
}

export function SubtitleCompareView({
  currentTime,
  focusVersionId,
  onOpenInEditor,
  onSeek,
  state,
  webinarId,
}: SubtitleCompareViewProps) {
  const [pair, setPair] = useState(() => initialPair(state, focusVersionId));
  const [changedOnly, setChangedOnly] = useState(false);
  const [highlight, setHighlight] = useState(true);
  const [ignoreCaseAndPunctuation, setIgnoreCaseAndPunctuation] =
    useState(true);
  const [contents, setContents] = useState<Record<string, VttCue[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const listRef = useRef<HTMLDivElement | null>(null);

  const readyVersions = state.versions.filter((version) =>
    isReadyVersion(version),
  );
  const left = findVersion(state, pair?.leftId);
  const right = findVersion(state, pair?.rightId);
  const presets = buildPresets(state);
  const contentKey = (version: SubtitleVersion | null) =>
    version ? `${version.id}:${currentRevision(version)?.id}` : "";
  const leftKey = contentKey(left);
  const rightKey = contentKey(right);
  const leftCues = contents[leftKey];
  const rightCues = contents[rightKey];

  useEffect(() => {
    if (pair) return;
    setPair(initialPair(state, focusVersionId));
  }, [focusVersionId, pair, state]);

  useEffect(() => {
    const controller = new AbortController();
    const missing = [left, right].filter(
      (version): version is SubtitleVersion =>
        Boolean(version) && !contents[contentKey(version!)],
    );
    if (!missing.length) return;
    setLoadError(null);
    void Promise.all(
      missing.map(async (version) => {
        const document = await getSubtitleVersionContent(
          webinarId,
          version.id,
          {
            signal: controller.signal,
          },
        );
        return [contentKey(version), parseVtt(document.text)] as const;
      }),
    )
      .then((entries) => {
        setContents((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        }));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load subtitles to compare.",
          );
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftKey, rightKey, webinarId]);

  const rows = useMemo(
    () =>
      leftCues && rightCues
        ? alignSubtitleCues(leftCues, rightCues, { ignoreCaseAndPunctuation })
        : [],
    [ignoreCaseAndPunctuation, leftCues, rightCues],
  );
  const summary = useMemo(() => summarizeAlignment(rows), [rows]);
  const visibleRows = changedOnly
    ? rows.filter((row) => row.status !== "same")
    : rows;
  const activeRow = rows.find(
    (row) => currentTime >= row.start && currentTime < row.end,
  );

  useEffect(() => {
    if (!activeRow) return;
    scrollWithinContainer(listRef.current, rowRefs.current.get(activeRow.id));
  }, [activeRow]);

  const jumpToDifference = (direction: 1 | -1) => {
    const changed = rows.filter((row) => row.status !== "same");
    if (!changed.length) return;
    const epsilon = 0.05;
    const target =
      direction === 1
        ? (changed.find((row) => row.start > currentTime + epsilon) ??
          changed[0])
        : ([...changed]
            .reverse()
            .find((row) => row.start < currentTime - epsilon) ??
          changed[changed.length - 1]);
    onSeek(target.start);
    scrollWithinContainer(
      listRef.current,
      rowRefs.current.get(target.id),
      "center",
    );
  };

  const chooseLeft = (leftId: string) => {
    const nextLeft = findVersion(state, leftId);
    if (!nextLeft) return;
    const keepRight =
      right && right.language === nextLeft.language && right.id !== leftId;
    const fallbackRight = readyVersions.find(
      (version) =>
        version.language === nextLeft.language && version.id !== leftId,
    );
    setPair({
      leftId,
      rightId: keepRight ? right.id : (fallbackRight?.id ?? ""),
    });
  };

  if (readyVersions.length < 2 || (!presets.length && !pair)) {
    return (
      <section className="flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-[#D4E0F0] bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
        <Columns2 className="size-8 text-[#8AA2BD]" />
        <h2 className="mt-4 text-lg font-semibold text-[#0B1F44]">
          Nothing to compare yet
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#6C7F95]">
          Comparison needs two ready versions in the same language, such as the
          Zoom original and an AI Russian transcript.
        </p>
      </section>
    );
  }

  const selectClass =
    "h-10 w-full rounded-2xl border-[#D4E0F0] bg-[#F8FBFF] text-left text-sm text-[#0B1F44]";

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-white shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <div className="space-y-4 border-b border-[#D4E0F0] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
              Compare versions{left ? ` · ${languageName[left.language]}` : ""}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#0B1F44]">
              {left && right
                ? `${versionName(state, left)} vs ${versionName(state, right)}`
                : "Choose two versions"}
            </h2>
          </div>
          {rows.length ? (
            <p
              className="flex flex-wrap items-center gap-2 text-xs text-[#55708F]"
              aria-live="polite"
            >
              <span className="rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-2.5 py-1 font-semibold tabular-nums text-[#21466D]">
                {summary.changedRows} of {summary.rows} segments differ
              </span>
              <span className="rounded-full bg-[#FDE7E7] px-2.5 py-1 font-semibold tabular-nums text-[#8F241E]">
                −{summary.removedWords} words
              </span>
              <span className="rounded-full bg-[#DDF3E6] px-2.5 py-1 font-semibold tabular-nums text-[#145C3B]">
                +{summary.addedWords} words
              </span>
            </p>
          ) : null}
        </div>

        <div className="grid items-end gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold text-[#55708F]">
              A · Original
            </span>
            <Select onValueChange={chooseLeft} value={left?.id}>
              <SelectTrigger aria-label="Version A" className={selectClass}>
                <SelectValue placeholder="Choose version A" />
              </SelectTrigger>
              <SelectContent
                className="rounded-xl border-[#D4E0F0]"
                position="popper"
              >
                {readyVersions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {languageName[version.language]} ·{" "}
                    {versionName(state, version)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            aria-label="Swap version A and version B"
            className="size-10 justify-self-center rounded-2xl text-[#21466D]"
            disabled={!left || !right}
            onClick={() =>
              pair && setPair({ leftId: pair.rightId, rightId: pair.leftId })
            }
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowLeftRight />
          </Button>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold text-[#55708F]">
              B · Compared
            </span>
            <Select
              onValueChange={(rightId) => pair && setPair({ ...pair, rightId })}
              value={right?.id}
            >
              <SelectTrigger aria-label="Version B" className={selectClass}>
                <SelectValue placeholder="Choose version B" />
              </SelectTrigger>
              <SelectContent
                className="rounded-xl border-[#D4E0F0]"
                position="popper"
              >
                {readyVersions
                  .filter(
                    (version) =>
                      version.id !== left?.id &&
                      (!left || version.language === left.language),
                  )
                  .map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {languageName[version.language]} ·{" "}
                      {versionName(state, version)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {presets.length ? (
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Common comparisons"
            >
              {presets.map((preset) => {
                const selected =
                  pair?.leftId === preset.leftId &&
                  pair?.rightId === preset.rightId;
                return (
                  <button
                    aria-pressed={selected}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-1 ${
                      selected
                        ? "border-[#21466D] bg-[#21466D] text-white"
                        : "border-[#D4E0F0] bg-white text-[#315F8A] hover:border-[#9FB7D5]"
                    }`}
                    key={preset.label}
                    onClick={() =>
                      setPair({
                        leftId: preset.leftId,
                        rightId: preset.rightId,
                      })
                    }
                    type="button"
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#315F8A]">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                checked={changedOnly}
                className="size-4 cursor-pointer accent-[#21466D]"
                onChange={(event) => setChangedOnly(event.target.checked)}
                type="checkbox"
              />
              Changed only
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                checked={highlight}
                className="size-4 cursor-pointer accent-[#21466D]"
                onChange={(event) => setHighlight(event.target.checked)}
                type="checkbox"
              />
              Highlight differences
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                checked={ignoreCaseAndPunctuation}
                className="size-4 cursor-pointer accent-[#21466D]"
                onChange={(event) =>
                  setIgnoreCaseAndPunctuation(event.target.checked)
                }
                type="checkbox"
              />
              Ignore case & punctuation
            </label>
            <span className="inline-flex gap-1">
              <Button
                aria-label="Previous difference"
                className="size-8 rounded-xl text-[#21466D]"
                disabled={!summary.changedRows}
                onClick={() => jumpToDifference(-1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronUp />
              </Button>
              <Button
                aria-label="Next difference"
                className="size-8 rounded-xl text-[#21466D]"
                disabled={!summary.changedRows}
                onClick={() => jumpToDifference(1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronDown />
              </Button>
            </span>
          </div>
        </div>
      </div>

      {loadError ? (
        <div
          className="border-b border-[#F2C7C7] bg-[#FFF5F5] px-5 py-3 text-sm text-[#8F241E]"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      <div className="sticky top-0 z-10 hidden grid-cols-[92px_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-[#D4E0F0] bg-[#F8FBFF]/95 px-5 py-2.5 backdrop-blur md:grid">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8AA2BD]">
          Time
        </span>
        {[left, right].map((version, index) => (
          <span
            className="flex min-w-0 items-center justify-between gap-2"
            key={index}
          >
            <span className="min-w-0 truncate text-xs font-semibold text-[#0B1F44]">
              {index === 0 ? "A" : "B"} ·{" "}
              {version ? versionName(state, version) : "—"}
              {version ? (
                <span className="ml-2 font-mono text-[10px] font-normal text-[#6C7F95]">
                  {lineageLabel(state, version)}
                </span>
              ) : null}
            </span>
            {version ? (
              <button
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-[#21466D] hover:bg-[#E7F0FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D]"
                onClick={() => onOpenInEditor(version.id)}
                type="button"
              >
                <PencilLine className="size-3" /> Edit
              </button>
            ) : null}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#E8EEF5] px-5 py-2 text-[11px] text-[#55708F]">
        <span className="inline-flex items-center gap-1.5">
          <del className="rounded-[4px] bg-[#FDE7E7] px-1 text-[#8F241E] decoration-[#D9534F]/70">
            removed
          </del>
          Removed or replaced in A
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ins className="rounded-[4px] bg-[#DDF3E6] px-1 text-[#145C3B] no-underline shadow-[inset_0_-1.5px_0_#2F9E68]">
            added
          </ins>
          Added or replacement in B
        </span>
        <span>Plain text is unchanged</span>
      </div>

      {!leftCues || !rightCues ? (
        <div
          className="flex min-h-72 items-center justify-center text-sm text-[#55708F]"
          role="status"
        >
          <LoaderCircle className="mr-2 size-5 motion-safe:animate-spin" />{" "}
          Loading both versions…
        </div>
      ) : !visibleRows.length ? (
        <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
          <p className="font-semibold text-[#0B1F44]">
            {changedOnly ? "No differences found" : "Both versions are empty"}
          </p>
          <p className="mt-1 text-sm text-[#6C7F95]">
            {changedOnly
              ? "These versions have the same words in every segment."
              : ""}
          </p>
        </div>
      ) : (
        <div
          className="max-h-[680px] overflow-y-auto [scrollbar-gutter:stable]"
          ref={listRef}
        >
          {visibleRows.map((row) => {
            const active = row.id === activeRow?.id;
            const statusLabel = rowStatusLabel[row.status];
            return (
              <div
                className={`grid cursor-pointer gap-2 border-b border-[#EEF3F9] px-5 py-3 text-sm leading-6 transition-colors md:grid-cols-[92px_minmax(0,1fr)_minmax(0,1fr)] md:gap-4 ${rowRail[row.status]} ${
                  active ? "bg-[#EEF6FF]" : "hover:bg-[#F8FBFF]"
                }`}
                key={row.id}
                onClick={() => onSeek(row.start)}
                ref={(node) => {
                  if (node) rowRefs.current.set(row.id, node);
                  else rowRefs.current.delete(row.id);
                }}
              >
                <div className="flex items-center gap-2 md:block">
                  <button
                    aria-label={`Play from ${formatDuration(row.start)}`}
                    className={`cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] ${
                      active
                        ? "bg-[#21466D] text-white"
                        : "bg-[#EEF3F9] text-[#21466D] hover:bg-[#DDE8F5]"
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSeek(row.start);
                    }}
                    type="button"
                  >
                    {formatDuration(row.start)}
                  </button>
                  {statusLabel ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6C7F95] md:mt-1.5 md:block">
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
                <p className="min-w-0 whitespace-pre-line break-words text-[#0B1F44]">
                  <span className="mr-1.5 text-[10px] font-bold text-[#8AA2BD] md:hidden">
                    A
                  </span>
                  <DiffText highlight={highlight} segments={row.left} />
                </p>
                <p className="min-w-0 whitespace-pre-line break-words text-[#0B1F44]">
                  <span className="mr-1.5 text-[10px] font-bold text-[#8AA2BD] md:hidden">
                    B
                  </span>
                  <DiffText highlight={highlight} segments={row.right} />
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
