"use client";

import { AudioLines, Languages, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WebinarSubtitleState } from "../types/webinar.types";
import {
  currentRevision,
  isVersionActive,
  lineageLabel,
  translationSources,
  versionName,
} from "../utils/subtitle-versions";

const dialogClass = "max-w-lg gap-0 rounded-[28px] border border-[#D4E0F0] p-0";

export function GenerateRussianDialog({
  isStarting,
  onConfirm,
  onOpenChange,
  open,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isStarting: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={dialogClass}>
        <div className="p-6 pr-14">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            <AudioLines className="size-3.5" /> Russian · AI
          </p>
          <DialogTitle className="mt-1 text-lg font-semibold text-[#0B1F44]">
            Generate an AI Russian transcript
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#6C7F95]">
            The webinar audio is transcribed into a new AI Russian version. The
            Zoom original and any manual corrections stay unchanged, and members
            keep seeing their current track until you choose another.
          </DialogDescription>
          <p className="mt-3 rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-2.5 text-xs leading-5 text-[#315F8A]">
            Runs in the background. Long recordings can take a while; you can
            keep editing other versions meanwhile.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#D4E0F0] p-4">
          <Button
            className="h-10 rounded-xl"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            aria-busy={isStarting}
            className="h-10 min-w-44 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
            disabled={isStarting}
            onClick={onConfirm}
            type="button"
          >
            {isStarting ? (
              <LoaderCircle className="motion-safe:animate-spin" />
            ) : (
              <AudioLines />
            )}
            {isStarting ? "Starting…" : "Generate transcript"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TranslateEnglishDialog({
  initialSourceId,
  isStarting,
  onConfirm,
  onOpenChange,
  open,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: WebinarSubtitleState;
  initialSourceId: string | null;
  isStarting: boolean;
  onConfirm: (sourceVersionId: string) => void;
}) {
  const sources = translationSources(state);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const selectedId =
    chosenId && sources.some((source) => source.id === chosenId)
      ? chosenId
      : initialSourceId &&
          sources.some((source) => source.id === initialSourceId)
        ? initialSourceId
        : null;

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) setChosenId(null);
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogContent className={dialogClass}>
        <div className="border-b border-[#D4E0F0] p-6 pr-14">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            <Languages className="size-3.5" /> English · AI
          </p>
          <DialogTitle className="mt-1 text-lg font-semibold text-[#0B1F44]">
            Translate to English
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#6C7F95]">
            Choose which Russian version to translate. The translation keeps
            every timestamp from that version and records where it came from.
          </DialogDescription>
        </div>
        <fieldset className="max-h-[50vh] space-y-2 overflow-y-auto p-4">
          <legend className="sr-only">Translation source</legend>
          {sources.map((source) => {
            const selected = source.id === selectedId;
            const translations = state.versions.filter(
              (version) =>
                version.kind === "EN_AI" &&
                version.origin.sourceVersionId === source.id,
            ).length;
            const revision = currentRevision(source);
            return (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-[#21466D] focus-within:ring-offset-1 ${
                  selected
                    ? "border-[#21466D] bg-[#EEF6FF]"
                    : "border-[#E1EAF4] bg-[#FBFDFF] hover:border-[#B9CEE3]"
                }`}
                key={source.id}
              >
                <input
                  checked={selected}
                  className="mt-1 size-4 cursor-pointer accent-[#21466D]"
                  name="translation-source"
                  onChange={() => setChosenId(source.id)}
                  type="radio"
                  value={source.id}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#0B1F44]">
                    {versionName(state, source)}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-[#21466D]">
                    {lineageLabel(state, source)} → EN_AI
                  </span>
                  <span className="mt-1 block text-xs text-[#6C7F95]">
                    Revision {revision?.number ?? "—"} ·{" "}
                    <span className="tabular-nums">
                      {revision?.cueCount ?? 0}
                    </span>{" "}
                    cues
                    {isVersionActive(state, source)
                      ? " · Members see this"
                      : ""}
                    {translations
                      ? ` · Already translated ${translations}×`
                      : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-[#D4E0F0] p-4">
          <Button
            className="h-10 rounded-xl"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            aria-busy={isStarting}
            className="h-10 min-w-40 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
            disabled={!selectedId || isStarting}
            onClick={() => selectedId && onConfirm(selectedId)}
            type="button"
          >
            {isStarting ? (
              <LoaderCircle className="motion-safe:animate-spin" />
            ) : (
              <Languages />
            )}
            {isStarting ? "Starting…" : "Start translation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
