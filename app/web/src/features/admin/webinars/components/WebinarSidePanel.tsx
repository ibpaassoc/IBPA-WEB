"use client";

import { Check, Cloud, FileText, Video } from "lucide-react";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type { AdminWebinarDetail } from "../types/webinar.types";
import {
  isVersionActive,
  lineageLabel,
  versionName,
} from "../utils/subtitle-versions";
import {
  formatFileSize,
  getWebinarMp4Types,
} from "../utils/webinar-formatters";

const statusTone = {
  READY: "success",
  PROCESSING: "neutral",
  FAILED: "danger",
} as const;

type WebinarSidePanelProps = {
  detail: AdminWebinarDetail;
  onSelectVersion: (versionId: string) => void;
  selectedVersionId: string | null;
};

export function WebinarSidePanel({
  detail,
  onSelectVersion,
  selectedVersionId,
}: WebinarSidePanelProps) {
  const state = detail.subtitles;
  const mp4Types = getWebinarMp4Types(detail);

  return (
    <aside className="space-y-4">
      <section className="rounded-[24px] border border-[#D4E0F0] bg-white p-4 shadow-[0_14px_35px_rgba(15,46,83,0.05)]">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[#21466D]" />
          <h2 className="font-semibold text-[#0B1F44]">Subtitle versions</h2>
        </div>
        <div className="mt-4 space-y-2">
          {state.versions.length ? (
            state.versions.map((version) => {
              const selected = selectedVersionId === version.id;
              return (
                <button
                  aria-pressed={selected}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-2 ${
                    selected
                      ? "border-[#7EA8CF] bg-[#EEF6FF]"
                      : "border-[#E1EAF4] bg-[#FBFDFF] hover:border-[#B9CEE3]"
                  }`}
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  type="button"
                >
                  <span
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-[#21466D] text-white" : "bg-white text-[#55708F]"}`}
                  >
                    {selected ? (
                      <Check className="size-3.5" />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#0B1F44]">
                        {versionName(state, version)}
                      </span>
                      {version.status !== "READY" ? (
                        <AdminStatusBadge
                          className="px-1.5 py-0 text-[9px]"
                          tone={statusTone[version.status]}
                        >
                          {version.status === "PROCESSING" ? "Processing" : "Failed"}
                        </AdminStatusBadge>
                      ) : null}
                      {isVersionActive(state, version) ? (
                        <AdminStatusBadge
                          className="px-1.5 py-0 text-[9px]"
                          tone="success"
                        >
                          Members
                        </AdminStatusBadge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] leading-4 text-[#6C7F95]">
                      {lineageLabel(state, version)}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-3 py-4 text-center text-xs leading-5 text-[#6C7F95]">
              No subtitle versions yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D4E0F0] bg-white p-4 shadow-[0_14px_35px_rgba(15,46,83,0.05)]">
        <div className="flex items-center gap-2">
          <Cloud className="size-4 text-[#21466D]" />
          <h2 className="font-semibold text-[#0B1F44]">Recording & storage</h2>
        </div>
        <dl className="mt-4 space-y-3 text-xs">
          <MetadataRow label="Zoom meeting" value={detail.zoomMeetingId} />
          <MetadataRow
            label="Host"
            value={detail.zoomMetadata.hostEmail || "Unknown"}
          />
          <MetadataRow
            label="MP4 type"
            value={mp4Types.join(", ") || "Not available"}
            capitalize
          />
          <MetadataRow
            label="Stored size"
            value={formatFileSize(detail.storage.video?.contentLength || 0)}
          />
          <MetadataRow
            label="R2 object"
            value={detail.videoR2Key || "Not imported"}
            code
          />
          <MetadataRow
            label="Video ETag"
            value={detail.storage.video?.etag || "—"}
            code
          />
          <MetadataRow
            label="Last modified"
            value={
              detail.storage.video?.lastModified
                ? new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(detail.storage.video.lastModified))
                : "—"
            }
          />
        </dl>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-2.5 text-xs text-[#315F8A]">
          <Video className="size-4" />
          Private R2 playback uses a temporary signed URL.
        </div>
      </section>
    </aside>
  );
}

function MetadataRow({
  capitalize,
  code,
  label,
  value,
}: {
  capitalize?: boolean;
  code?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 border-b border-[#E8EEF5] pb-3 last:border-0 last:pb-0">
      <dt className="text-[#8AA2BD]">{label}</dt>
      <dd
        className={`min-w-0 break-words text-right font-semibold text-[#315F8A] ${capitalize ? "capitalize" : ""} ${code ? "font-mono text-[10px]" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
