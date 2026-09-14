"use client";

import {
  Captions,
  CircleAlert,
  GitBranch,
  History,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SubtitleRevision, SubtitleVersion } from "../types/webinar.types";
import { isManualKind, languageName } from "../utils/subtitle-versions";
import {
  secondsToTimecode,
  timecodeToSeconds,
  type VttCue,
} from "../utils/vtt";
import { scrollWithinContainer } from "../utils/scroll-within";

type SubtitleEditorProps = {
  activeCueIndex: number;
  cues: VttCue[];
  currentTime: number;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  version: SubtitleVersion | null;
  versionLabel: string;
  lineage: string;
  revision: SubtitleRevision | null;
  onChange: (cues: VttCue[]) => void;
  onSave: () => void;
  onSeek: (time: number) => void;
  onOpenHistory: () => void;
  dirty: boolean;
};

export function SubtitleEditor({
  activeCueIndex,
  cues,
  currentTime,
  dirty,
  error,
  isLoading,
  isSaving,
  lineage,
  onChange,
  onOpenHistory,
  onSave,
  onSeek,
  revision,
  version,
  versionLabel,
}: SubtitleEditorProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const cueRefs = useRef(new Map<string, HTMLDivElement>());
  const listRef = useRef<HTMLDivElement | null>(null);
  const visibleCues = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return cues.map((cue, index) => ({ cue, index }));
    return cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => cue.text.toLocaleLowerCase().includes(normalized));
  }, [cues, search]);

  useEffect(() => {
    if (activeCueIndex < 0 || search) return;
    const cue = cues[activeCueIndex];
    scrollWithinContainer(listRef.current, cueRefs.current.get(cue?.id || ""));
  }, [activeCueIndex, cues, search]);

  const updateCue = (index: number, values: Partial<VttCue>) => {
    onChange(
      cues.map((cue, cueIndex) =>
        cueIndex === index ? { ...cue, ...values } : cue,
      ),
    );
  };

  const addCue = () => {
    const startSeconds = Math.max(0, currentTime);
    const next: VttCue = {
      id: crypto.randomUUID(),
      start: secondsToTimecode(startSeconds),
      end: secondsToTimecode(startSeconds + 5),
      text: "",
    };
    const nextCues = [...cues, next].sort(
      (a, b) => timecodeToSeconds(a.start) - timecodeToSeconds(b.start),
    );
    onChange(nextCues);
    setSearch("");
    window.requestAnimationFrame(() =>
      scrollWithinContainer(
        listRef.current,
        cueRefs.current.get(next.id),
        "center",
      ),
    );
  };

  if (!version) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center rounded-[28px] border border-[#D4E0F0] bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
        <Captions className="size-8 text-[#8AA2BD]" />
        <h2 className="mt-4 text-lg font-semibold text-[#0B1F44]">
          No subtitles yet
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#6C7F95]">
          This recording has no Zoom transcript. Generate a Russian AI
          transcript to start editing subtitles.
        </p>
      </section>
    );
  }

  const manual = isManualKind(version.kind);
  const isReady = version.status === "READY" && Boolean(revision);

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-white shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#D4E0F0] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            Subtitle timeline · {languageName[version.language]}
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold text-[#0B1F44]">
            {versionLabel}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6C7F95]">
            <span className="tabular-nums">{cues.length} cues</span>
            {revision ? (
              <span className="tabular-nums">· Revision {revision.number}</span>
            ) : null}
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#55708F]">
              <GitBranch aria-hidden className="size-3" /> {lineage}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-56">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8AA2BD]"
            />
            <Input
              ref={searchRef}
              aria-label="Search transcript text"
              className="h-10 rounded-2xl border-[#D4E0F0] bg-[#F8FBFF] pl-9 pr-9 text-sm"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transcript"
              type="search"
              value={search}
            />
            {search ? (
              <button
                aria-label="Clear transcript search"
                className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-[#6C7F95] hover:bg-[#E7F0FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D]"
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
                type="button"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {manual && version.revisions.length > 1 ? (
            <Button
              className="h-10 rounded-2xl text-[#21466D]"
              onClick={onOpenHistory}
              type="button"
              variant="outline"
            >
              <History data-icon="inline-start" /> History
            </Button>
          ) : null}
          <Button
            className="h-10 rounded-2xl text-[#21466D]"
            disabled={!isReady}
            onClick={addCue}
            type="button"
            variant="outline"
          >
            <Plus data-icon="inline-start" /> Add cue
          </Button>
          <Button
            aria-busy={isSaving}
            className="h-10 min-w-32 rounded-2xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
            disabled={!dirty || isSaving || !isReady}
            onClick={onSave}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="motion-safe:animate-spin" />
            ) : (
              <Save />
            )}
            {isSaving
              ? "Saving…"
              : manual
                ? "Save revision"
                : "Save as manual correction"}
          </Button>
        </div>
      </div>

      {isReady && !manual ? (
        <p className="border-b border-[#D4E0F0] bg-[#F5F9FF] px-5 py-2.5 text-xs leading-5 text-[#315F8A]">
          Saving creates a new Manual {languageName[version.language]} version.{" "}
          {versionLabel} stays unchanged.
        </p>
      ) : null}

      {error ? (
        <div
          className="border-b border-[#F2C7C7] bg-[#FFF5F5] px-5 py-3 text-sm text-[#8F241E]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {version.status !== "READY" || !revision ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          {version.status === "PROCESSING" ? (
            <LoaderCircle className="size-7 text-[#21466D] motion-safe:animate-spin" />
          ) : (
            <CircleAlert className="size-7 text-[#B42318]" />
          )}
          <p className="mt-3 font-semibold text-[#0B1F44]">
            {version.status === "PROCESSING"
              ? "This version is still being generated"
              : "This version has no subtitles"}
          </p>
          <p className="mt-1 max-w-md text-sm leading-6 text-[#6C7F95]">
            {version.status === "PROCESSING"
              ? "Cues appear here when the job finishes. You can keep working with other versions."
              : version.error || "Retry the job from the subtitle navigator."}
          </p>
        </div>
      ) : isLoading ? (
        <div
          className="flex min-h-80 items-center justify-center text-sm text-[#55708F]"
          role="status"
        >
          <LoaderCircle className="mr-2 size-5 motion-safe:animate-spin" />{" "}
          Loading subtitle cues…
        </div>
      ) : !visibleCues.length ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <Search className="size-7 text-[#8AA2BD]" />
          <p className="mt-3 font-semibold text-[#0B1F44]">No matching cues</p>
          <button
            className="mt-2 cursor-pointer text-sm font-semibold text-[#21466D] hover:underline"
            onClick={() => setSearch("")}
            type="button"
          >
            Clear transcript search
          </button>
        </div>
      ) : (
        <div
          ref={listRef}
          className="max-h-[680px] overflow-y-auto p-3 [scrollbar-gutter:stable] sm:p-4"
        >
          <div className="space-y-2">
            {visibleCues.map(({ cue, index }) => {
              const active = index === activeCueIndex;
              return (
                <div
                  ref={(node) => {
                    if (node) cueRefs.current.set(cue.id, node);
                    else cueRefs.current.delete(cue.id);
                  }}
                  className={`grid gap-3 rounded-[20px] border p-3 transition-colors sm:grid-cols-[116px_1fr_auto] ${
                    active
                      ? "border-[#7EA8CF] bg-[#EEF6FF] shadow-[inset_3px_0_0_#21466D]"
                      : "border-[#E2EBF5] bg-[#FBFDFF] hover:border-[#C8D9EB]"
                  }`}
                  key={cue.id}
                >
                  <div className="space-y-2">
                    <button
                      className="w-full cursor-pointer rounded-xl bg-[#0B1F44] px-2.5 py-2 text-left text-xs font-semibold tabular-nums text-white transition hover:bg-[#21466D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6CA6D9] focus-visible:ring-offset-2"
                      onClick={() => onSeek(timecodeToSeconds(cue.start))}
                      type="button"
                    >
                      Cue {index + 1}
                    </button>
                    <Input
                      aria-label={`Cue ${index + 1} start time`}
                      className="h-8 rounded-xl border-[#D4E0F0] bg-white px-2 text-[11px] tabular-nums"
                      onChange={(event) =>
                        updateCue(index, { start: event.target.value })
                      }
                      value={cue.start}
                    />
                    <Input
                      aria-label={`Cue ${index + 1} end time`}
                      className="h-8 rounded-xl border-[#D4E0F0] bg-white px-2 text-[11px] tabular-nums"
                      onChange={(event) =>
                        updateCue(index, { end: event.target.value })
                      }
                      value={cue.end}
                    />
                  </div>
                  <Textarea
                    aria-label={`Cue ${index + 1} text`}
                    className="min-h-28 resize-none rounded-2xl border-[#D4E0F0] bg-white px-3 py-2.5 text-sm leading-6 text-[#0B1F44] focus-visible:border-[#21466D]"
                    onChange={(event) =>
                      updateCue(index, { text: event.target.value })
                    }
                    onFocus={() => {
                      // Jump the video to this cue unless it is already playing it.
                      const start = timecodeToSeconds(cue.start);
                      const end = timecodeToSeconds(cue.end);
                      if (!(currentTime >= start && currentTime < end)) {
                        onSeek(start);
                      }
                    }}
                    value={cue.text}
                  />
                  <Button
                    aria-label={`Delete cue ${index + 1}`}
                    className="size-9 rounded-xl text-[#B42318] hover:bg-[#FFF0F0] hover:text-[#8F241E]"
                    onClick={() =>
                      onChange(cues.filter((_, cueIndex) => cueIndex !== index))
                    }
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
