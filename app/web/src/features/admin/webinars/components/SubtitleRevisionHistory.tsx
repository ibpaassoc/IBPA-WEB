"use client";

import { History, LoaderCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type { SubtitleVersion } from "../types/webinar.types";
import { revisionLabel } from "../utils/subtitle-versions";

type SubtitleRevisionHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: SubtitleVersion | null;
  versionLabel: string;
  isRestoring: boolean;
  onRestore: (revisionId: string) => void;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function SubtitleRevisionHistory({
  isRestoring,
  onOpenChange,
  onRestore,
  open,
  version,
  versionLabel,
}: SubtitleRevisionHistoryProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const revisions = [...(version?.revisions || [])].reverse();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmingId(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl gap-0 rounded-[28px] border border-[#D4E0F0] p-0">
        <div className="border-b border-[#D4E0F0] p-6 pr-14">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            <History className="size-3.5" /> Revision history
          </p>
          <DialogTitle className="mt-1 text-lg font-semibold text-[#0B1F44]">
            {versionLabel}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-[#6C7F95]">
            Restoring adds a new revision with the earlier text. Nothing is
            deleted, so you can always return to any saved state.
          </DialogDescription>
        </div>
        <ol className="max-h-[60vh] space-y-2 overflow-y-auto p-4 [scrollbar-gutter:stable]">
          {revisions.map((revision) => {
            const current = revision.id === version?.currentRevisionId;
            const confirming = confirmingId === revision.id;
            return (
              <li
                className={`rounded-2xl border p-3 ${
                  current
                    ? "border-[#7EA8CF] bg-[#EEF6FF]"
                    : "border-[#E2EBF5] bg-[#FBFDFF]"
                }`}
                key={revision.id}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-semibold tabular-nums text-[#21466D] ring-1 ring-[#D4E0F0]">
                    {revision.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-[#0B1F44]">
                      {revisionLabel(revision)}
                      {current ? (
                        <AdminStatusBadge
                          className="px-1.5 py-0 text-[10px]"
                          tone="info"
                        >
                          Current
                        </AdminStatusBadge>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6C7F95]">
                      <span className="tabular-nums">
                        {dateFormat.format(new Date(revision.createdAt))}
                      </span>
                      {" · "}
                      <span className="tabular-nums">
                        {revision.cueCount} cues
                      </span>
                      {revision.createdBy ? ` · ${revision.createdBy}` : ""}
                    </p>
                  </div>
                  {!current && !confirming ? (
                    <Button
                      className="h-8 rounded-xl text-[#21466D]"
                      disabled={isRestoring}
                      onClick={() => setConfirmingId(revision.id)}
                      type="button"
                      variant="outline"
                    >
                      <RotateCcw data-icon="inline-start" /> Restore
                    </Button>
                  ) : null}
                </div>
                {confirming ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#D4E0F0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-[#315F8A]">
                      Restore revision {revision.number} as the current text?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        className="h-8 rounded-xl"
                        disabled={isRestoring}
                        onClick={() => setConfirmingId(null)}
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        aria-busy={isRestoring}
                        className="h-8 min-w-36 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
                        disabled={isRestoring}
                        onClick={() => onRestore(revision.id)}
                        type="button"
                      >
                        {isRestoring ? (
                          <LoaderCircle className="motion-safe:animate-spin" />
                        ) : (
                          <RotateCcw />
                        )}
                        Restore revision {revision.number}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
