"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Clock3,
  Cloud,
  LoaderCircle,
  RefreshCw,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import {
  createEnglishTestTrack,
  getWebinar,
  getWebinarPlayback,
  getWebinarSubtitle,
  saveWebinarSubtitle,
} from "../server/webinar.repository";
import type {
  AdminWebinarDetail,
  SubtitleLanguage,
  WebinarStatus,
} from "../types/webinar.types";
import {
  findActiveCueIndex,
  parseVtt,
  serializeVtt,
  validateVttCues,
  type VttCue,
} from "../utils/vtt";
import {
  formatDuration,
  formatWebinarDate,
  webinarStatusLabel,
} from "../utils/webinar-formatters";
import { SubtitleEditor } from "./SubtitleEditor";
import { WebinarPlayer } from "./WebinarPlayer";
import { WebinarSidePanel } from "./WebinarSidePanel";

const statusTone: Record<
  WebinarStatus,
  "neutral" | "info" | "success" | "danger"
> = {
  AVAILABLE: "info",
  IMPORTING: "neutral",
  IMPORTED: "success",
  FAILED: "danger",
};

type PendingNavigation =
  { type: "back" } | { type: "track"; language: SubtitleLanguage } | null;

export function AdminWebinarDetailPage({ webinarId }: { webinarId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [detail, setDetail] = useState<AdminWebinarDetail | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SubtitleLanguage | null>(null);
  const [cues, setCues] = useState<VttCue[]>([]);
  const [etag, setEtag] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubtitleLoading, setIsSubtitleLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);

  const loadDetail = useCallback(
    async ({
      signal,
      silent = false,
    }: { signal?: AbortSignal; silent?: boolean } = {}) => {
      if (!silent) setIsLoading(true);
      try {
        const nextDetail = await getWebinar(webinarId, signal);
        setDetail(nextDetail);
        setError(null);

        const existingTracks = nextDetail.tracks
          .filter((track) => track.exists)
          .map((track) => track.language);
        setSelectedLanguage((current) =>
          current && existingTracks.includes(current)
            ? current
            : existingTracks.includes("ru")
              ? "ru"
              : existingTracks[0] || null,
        );

        if (nextDetail.status === "IMPORTED" && nextDetail.videoR2Key) {
          try {
            const playback = await getWebinarPlayback(webinarId, signal);
            setPlaybackUrl(playback.url);
          } catch (playbackError) {
            if (!signal?.aborted) {
              setPlaybackUrl(null);
              setError(
                playbackError instanceof Error
                  ? playbackError.message
                  : "Could not prepare playback.",
              );
            }
          }
        } else {
          setPlaybackUrl(null);
        }
      } catch (loadError) {
        if (!signal?.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the webinar.",
          );
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [webinarId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDetail]);

  useEffect(() => {
    if (detail?.status !== "IMPORTING") return;
    const interval = window.setInterval(
      () => void loadDetail({ silent: true }),
      4_000,
    );
    return () => window.clearInterval(interval);
  }, [detail?.status, loadDetail]);

  useEffect(() => {
    if (!selectedLanguage) {
      setCues([]);
      setEtag(null);
      setDirty(false);
      return;
    }
    const controller = new AbortController();
    setIsSubtitleLoading(true);
    setSubtitleError(null);
    void getWebinarSubtitle(webinarId, selectedLanguage, controller.signal)
      .then((document) => {
        setCues(parseVtt(document.text));
        setEtag(document.etag);
        setDirty(false);
      })
      .catch((subtitleLoadError) => {
        if (!controller.signal.aborted) {
          setCues([]);
          setSubtitleError(
            subtitleLoadError instanceof Error
              ? subtitleLoadError.message
              : "Could not load subtitles.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSubtitleLoading(false);
      });
    return () => controller.abort();
  }, [selectedLanguage, webinarId]);

  useEffect(() => {
    if (!dirty) return;
    const protectUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnload);
    return () => window.removeEventListener("beforeunload", protectUnload);
  }, [dirty]);

  const activeCueIndex = useMemo(
    () => findActiveCueIndex(cues, currentTime),
    [cues, currentTime],
  );
  const availableLanguages = useMemo(
    () =>
      detail?.tracks
        .filter((track) => track.exists)
        .map((track) => track.language) || [],
    [detail?.tracks],
  );

  const handleCueChange = (nextCues: VttCue[]) => {
    setCues(nextCues);
    setDirty(true);
    setSubtitleError(null);
  };

  const handleSeek = (time: number) => {
    if (!Number.isFinite(time)) return;
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const saveSubtitles = async () => {
    if (!selectedLanguage) return;
    const validationError = validateVttCues(cues);
    if (validationError) {
      setSubtitleError(validationError);
      return;
    }
    setIsSaving(true);
    setSubtitleError(null);
    try {
      const result = await saveWebinarSubtitle({
        id: webinarId,
        language: selectedLanguage,
        vtt: serializeVtt(cues),
        expectedEtag: etag,
      });
      setEtag(result.etag);
      setDirty(false);
      toast.success("Subtitles saved.");
      await loadDetail({ silent: true });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Could not save subtitles.";
      setSubtitleError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const translateEnglish = async () => {
    setIsTranslating(true);
    setSubtitleError(null);
    try {
      await createEnglishTestTrack(webinarId);
      await loadDetail({ silent: true });
      setSelectedLanguage("en");
      toast.success(
        "English test track created with the original Russian text.",
      );
    } catch (translationError) {
      const message =
        translationError instanceof Error
          ? translationError.message
          : "Could not create the English track.";
      setSubtitleError(message);
      toast.error(message);
    } finally {
      setIsTranslating(false);
    }
  };

  const requestBack = () => {
    if (dirty) setPendingNavigation({ type: "back" });
    else router.push("/admin/webinars");
  };

  const requestLanguage = (language: SubtitleLanguage) => {
    if (language === selectedLanguage) return;
    if (dirty) setPendingNavigation({ type: "track", language });
    else setSelectedLanguage(language);
  };

  const discardAndContinue = () => {
    const pending = pendingNavigation;
    setDirty(false);
    setPendingNavigation(null);
    if (pending?.type === "back") router.push("/admin/webinars");
    if (pending?.type === "track") setSelectedLanguage(pending.language);
  };

  if (isLoading && !detail) {
    return (
      <div
        className="flex min-h-[560px] items-center justify-center rounded-[28px] border border-[#D4E0F0] bg-white text-[#55708F]"
        role="status"
      >
        <LoaderCircle className="mr-2 size-5 motion-safe:animate-spin" />{" "}
        Loading webinar workspace…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-[28px] border border-[#D4E0F0] bg-white p-10 text-center">
        <CircleAlert className="mx-auto size-8 text-[#B42318]" />
        <h1 className="mt-4 text-xl font-semibold text-[#0B1F44]">
          Webinar unavailable
        </h1>
        <p className="mt-2 text-sm text-[#6C7F95]">
          {error || "This webinar could not be found."}
        </p>
        <Button
          className="mt-5 rounded-2xl"
          onClick={requestBack}
          type="button"
          variant="outline"
        >
          <ArrowLeft /> Back to webinars
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <header className="rounded-[28px] border border-[#D4E0F0] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)] lg:p-6">
          <button
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl text-sm font-semibold text-[#55708F] transition hover:text-[#0B1F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-2"
            onClick={requestBack}
            type="button"
          >
            <ArrowLeft className="size-4" /> Back to webinars
          </button>
          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8AA2BD]">
                Media workspace
              </p>
              <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-[-0.03em] text-[#0B1F44] lg:text-3xl">
                {detail.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6C7F95]">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" />{" "}
                  {formatWebinarDate(detail.recordedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock3 className="size-4" />{" "}
                  {formatDuration(detail.durationSeconds)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge tone={statusTone[detail.status]}>
                <Video className="size-3" /> Zoom{" "}
                {webinarStatusLabel(detail.status)}
              </AdminStatusBadge>
              <AdminStatusBadge
                tone={detail.storage.video ? "success" : "neutral"}
              >
                <Cloud className="size-3" /> R2{" "}
                {detail.storage.video ? "Stored" : "Pending"}
              </AdminStatusBadge>
              <AdminStatusBadge
                tone={
                  detail.transcriptStatus === "IMPORTED"
                    ? "success"
                    : detail.transcriptStatus === "FAILED"
                      ? "danger"
                      : "neutral"
                }
              >
                Transcript{" "}
                {detail.transcriptStatus.replaceAll("_", " ").toLowerCase()}
              </AdminStatusBadge>
              <Button
                aria-label="Refresh webinar workspace"
                className="size-8 rounded-full"
                onClick={() => void loadDetail()}
                size="icon"
                type="button"
                variant="outline"
              >
                <RefreshCw />
              </Button>
            </div>
          </div>
          {error ? (
            <div
              className="mt-4 rounded-2xl border border-[#F2C7C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#8F241E]"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </header>

        <WebinarPlayer
          cues={cues}
          languages={availableLanguages}
          onLanguageChange={requestLanguage}
          onTimeChange={setCurrentTime}
          selectedLanguage={selectedLanguage}
          source={playbackUrl}
          videoRef={videoRef}
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SubtitleEditor
            activeCueIndex={activeCueIndex}
            cues={cues}
            currentTime={currentTime}
            dirty={dirty}
            error={subtitleError}
            isLoading={isSubtitleLoading}
            isSaving={isSaving}
            language={selectedLanguage}
            onChange={handleCueChange}
            onSave={() => void saveSubtitles()}
            onSeek={handleSeek}
          />
          <WebinarSidePanel
            detail={detail}
            isTranslating={isTranslating}
            onSelectLanguage={requestLanguage}
            onTranslateEnglish={() => void translateEnglish()}
            selectedLanguage={selectedLanguage}
          />
        </div>
      </div>

      <Dialog
        open={Boolean(pendingNavigation)}
        onOpenChange={(open) => !open && setPendingNavigation(null)}
      >
        <DialogContent className="max-w-md rounded-[24px] border border-[#D4E0F0] p-6">
          <DialogTitle className="text-lg font-semibold text-[#0B1F44]">
            Discard subtitle changes?
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#6C7F95]">
            This track has edits that have not been saved to R2. Discarding them
            cannot be undone.
          </DialogDescription>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              className="h-10 rounded-xl"
              onClick={() => setPendingNavigation(null)}
              type="button"
              variant="outline"
            >
              Keep editing
            </Button>
            <Button
              className="h-10 rounded-xl"
              onClick={discardAndContinue}
              type="button"
              variant="destructive"
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
