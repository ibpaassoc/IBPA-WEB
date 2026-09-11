"use client";

import {
  Check,
  Cloud,
  FileText,
  Languages,
  LoaderCircle,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type {
  AdminWebinarDetail,
  SubtitleLanguage,
} from "../types/webinar.types";
import {
  formatFileSize,
  getWebinarMp4Types,
} from "../utils/webinar-formatters";

const trackLabels: Record<SubtitleLanguage, { name: string; detail: string }> =
  {
    ru: { name: "Original", detail: "Zoom transcript · Russian" },
    en: { name: "English", detail: "Editable English track" },
    uk: { name: "Ukrainian", detail: "Editable Ukrainian track" },
  };

type WebinarSidePanelProps = {
  detail: AdminWebinarDetail;
  isTranslating: boolean;
  onSelectLanguage: (language: SubtitleLanguage) => void;
  onTranslateEnglish: () => void;
  selectedLanguage: SubtitleLanguage | null;
};

export function WebinarSidePanel({
  detail,
  isTranslating,
  onSelectLanguage,
  onTranslateEnglish,
  selectedLanguage,
}: WebinarSidePanelProps) {
  const russian = detail.tracks.find((track) => track.language === "ru");
  const english = detail.tracks.find((track) => track.language === "en");
  const mp4Types = getWebinarMp4Types(detail);

  return (
    <aside className="space-y-4">
      <section className="rounded-[24px] border border-[#D4E0F0] bg-white p-4 shadow-[0_14px_35px_rgba(15,46,83,0.05)]">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[#21466D]" />
          <h2 className="font-semibold text-[#0B1F44]">Subtitle tracks</h2>
        </div>
        <div className="mt-4 space-y-2">
          {detail.tracks.map((track) => {
            const selected = selectedLanguage === track.language;
            const isTest =
              track.language === "en" &&
              track.metadata?.translation === "test-copy";
            return (
              <button
                aria-pressed={selected}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-2 ${
                  track.exists
                    ? selected
                      ? "cursor-pointer border-[#7EA8CF] bg-[#EEF6FF]"
                      : "cursor-pointer border-[#E1EAF4] bg-[#FBFDFF] hover:border-[#B9CEE3]"
                    : "cursor-not-allowed border-[#E8EEF5] bg-[#F8FAFC] opacity-65"
                }`}
                disabled={!track.exists}
                key={track.language}
                onClick={() => onSelectLanguage(track.language)}
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
                      {trackLabels[track.language].name}
                    </span>
                    {isTest ? (
                      <AdminStatusBadge
                        className="px-1.5 py-0 text-[9px]"
                        tone="warning"
                      >
                        Test copy
                      </AdminStatusBadge>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#6C7F95]">
                    {track.exists
                      ? trackLabels[track.language].detail
                      : "Not created"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D4E0F0] bg-white p-4 shadow-[0_14px_35px_rgba(15,46,83,0.05)]">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-[#21466D]" />
          <h2 className="font-semibold text-[#0B1F44]">Translation</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#6C7F95]">
          Test mode copies the Russian cue text into a new English track while
          preserving every timestamp.
        </p>
        <Button
          aria-busy={isTranslating}
          className="mt-4 h-10 w-full rounded-2xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
          disabled={!russian?.exists || english?.exists || isTranslating}
          onClick={onTranslateEnglish}
          type="button"
        >
          {isTranslating ? (
            <LoaderCircle className="motion-safe:animate-spin" />
          ) : (
            <Languages />
          )}
          {english?.exists
            ? "English track exists"
            : isTranslating
              ? "Creating test track…"
              : "Translate to English"}
        </Button>
        {!russian?.exists ? (
          <p className="mt-2 text-xs text-[#B42318]">
            A Russian <code>ru.vtt</code> track is required.
          </p>
        ) : null}
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
