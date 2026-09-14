"use client";

import { Cloud, Video } from "lucide-react";

import type { AdminWebinarDetail } from "../types/webinar.types";
import {
  formatFileSize,
  getWebinarMp4Types,
} from "../utils/webinar-formatters";

type WebinarSidePanelProps = {
  detail: AdminWebinarDetail;
};

/** Recording and storage facts for the imported Zoom media. */
export function WebinarSidePanel({ detail }: WebinarSidePanelProps) {
  const mp4Types = getWebinarMp4Types(detail);

  return (
    <aside className="space-y-4">
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
