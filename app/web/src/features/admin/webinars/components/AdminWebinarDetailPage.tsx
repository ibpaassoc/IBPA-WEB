"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Clock3,
  Cloud,
  Columns2,
  EyeOff,
  FilePen,
  Globe,
  LoaderCircle,
  Lock,
  PencilLine,
  RefreshCw,
  Send,
  Users,
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
  generateEnglishTranslation,
  generateRussianTranscript,
  getSubtitleVersionContent,
  getWebinar,
  getWebinarPlayback,
  publishWebinar,
  restoreSubtitleRevision,
  retrySubtitleVersion,
  saveSubtitleRevision,
  setMemberSubtitleTrack,
  unpublishWebinar,
  updateWebinarAccess,
  type WebinarAccessInput,
} from "../server/webinar.repository";
import type {
  AdminWebinarDetail,
  SubtitleTrackLanguage,
  WebinarStatus,
} from "../types/webinar.types";
import {
  currentRevision,
  findVersion,
  isReadyVersion,
  languageName,
  lineageLabel,
  versionName,
} from "../utils/subtitle-versions";
import {
  findActiveCueIndex,
  parseVtt,
  serializeVtt,
  validateVttCues,
  type VttCue,
} from "../utils/vtt";
import { describeAccess } from "../utils/webinar-access";
import {
  formatDuration,
  formatWebinarDate,
  webinarStatusLabel,
} from "../utils/webinar-formatters";
import { SubtitleCompareView } from "./SubtitleCompareView";
import { SubtitleEditor } from "./SubtitleEditor";
import {
  GenerateRussianDialog,
  TranslateEnglishDialog,
} from "./SubtitleJobDialogs";
import { SubtitleRevisionHistory } from "./SubtitleRevisionHistory";
import { SubtitleTranslationNavigator } from "./SubtitleTranslationNavigator";
import { WebinarAccessDialog } from "./WebinarAccessDialog";
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
  | { type: "back" }
  | { type: "version"; versionId: string }
  | { type: "history" }
  | null;

function pickInitialVersion(detail: AdminWebinarDetail) {
  const state = detail.subtitles;
  const active = findVersion(state, state.activeVersionIds.ru);
  if (active) return active.id;
  return (
    state.versions.find((version) => isReadyVersion(version))?.id ||
    state.versions[0]?.id ||
    null
  );
}

export function AdminWebinarDetailPage({ webinarId }: { webinarId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [detail, setDetail] = useState<AdminWebinarDetail | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [cues, setCues] = useState<VttCue[]>([]);
  const [loadedRevisionId, setLoadedRevisionId] = useState<string | null>(null);
  const [contentReloadKey, setContentReloadKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubtitleLoading, setIsSubtitleLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"edit" | "compare">(
    "edit",
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [accessDialog, setAccessDialog] = useState<"publish" | "edit" | null>(
    null,
  );
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateSourceId, setTranslateSourceId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);
  // Content already in the editor after a save; skip refetching it.
  const skipContentLoadRef = useRef<string | null>(null);

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
        setSelectedVersionId((current) =>
          current && findVersion(nextDetail.subtitles, current)
            ? current
            : pickInitialVersion(nextDetail),
        );

        if (silent) return nextDetail;
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
        return nextDetail;
      } catch (loadError) {
        if (!signal?.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the webinar.",
          );
        }
        return null;
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

  const hasProcessingVersion = Boolean(
    detail?.subtitles.versions.some(
      (version) => version.status === "PROCESSING",
    ),
  );

  useEffect(() => {
    if (detail?.status !== "IMPORTING" && !hasProcessingVersion) return;
    const interval = window.setInterval(
      () => void loadDetail({ silent: detail?.status !== "IMPORTING" }),
      detail?.status === "IMPORTING" ? 4_000 : 8_000,
    );
    return () => window.clearInterval(interval);
  }, [detail?.status, hasProcessingVersion, loadDetail]);

  const selectedVersion = findVersion(detail?.subtitles, selectedVersionId);
  const selectedRevision = currentRevision(selectedVersion);
  const selectedRevisionId = selectedRevision?.id ?? null;
  const selectedReady = isReadyVersion(selectedVersion);

  useEffect(() => {
    if (!selectedVersionId || !selectedReady || !selectedRevisionId) {
      setCues([]);
      setLoadedRevisionId(null);
      setDirty(false);
      return;
    }
    if (
      skipContentLoadRef.current ===
      `${selectedVersionId}:${selectedRevisionId}`
    ) {
      skipContentLoadRef.current = null;
      return;
    }
    const controller = new AbortController();
    setIsSubtitleLoading(true);
    setSubtitleError(null);
    void getSubtitleVersionContent(webinarId, selectedVersionId, {
      signal: controller.signal,
    })
      .then((document) => {
        setCues(parseVtt(document.text));
        setLoadedRevisionId(document.revisionId);
        setDirty(false);
      })
      .catch((subtitleLoadError: unknown) => {
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
    // Background refreshes must not reload the editor; only an explicit
    // version switch, restore, or reload does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionId, selectedReady, contentReloadKey, webinarId]);

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

  const playerTracks = useMemo(
    () =>
      (detail?.subtitles.versions || [])
        .filter((version) => isReadyVersion(version))
        .map((version) => ({
          id: version.id,
          label: `${languageName[version.language]} · ${versionName(detail!.subtitles, version)}`,
        })),
    [detail],
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
    if (!selectedVersion || !detail) return;
    const validationError = validateVttCues(cues);
    if (validationError) {
      setSubtitleError(validationError);
      return;
    }
    setIsSaving(true);
    setSubtitleError(null);
    try {
      const result = await saveSubtitleRevision({
        id: webinarId,
        versionId: selectedVersion.id,
        vtt: serializeVtt(cues),
        expectedRevisionId: loadedRevisionId,
      });
      if (result.createdVersion) {
        skipContentLoadRef.current = `${result.versionId}:${result.revisionId}`;
      }
      setLoadedRevisionId(result.revisionId);
      setDirty(false);
      const refreshed = await loadDetail({ silent: true });
      if (result.createdVersion) {
        setSelectedVersionId(result.versionId);
        const created = findVersion(refreshed?.subtitles, result.versionId);
        toast.success(
          `Saved as ${created ? versionName(refreshed!.subtitles, created) : "a manual correction"}. ${versionName(detail.subtitles, selectedVersion)} is unchanged.`,
        );
      } else {
        toast.success("Revision saved.");
      }
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

  const restoreRevision = async (revisionId: string) => {
    if (!selectedVersion) return;
    setIsRestoring(true);
    try {
      await restoreSubtitleRevision({
        id: webinarId,
        versionId: selectedVersion.id,
        revisionId,
        expectedRevisionId: selectedRevisionId,
      });
      await loadDetail({ silent: true });
      setContentReloadKey((key) => key + 1);
      setHistoryOpen(false);
      toast.success("Revision restored.");
    } catch (restoreError) {
      toast.error(
        restoreError instanceof Error
          ? restoreError.message
          : "Could not restore the revision.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const runAction = async (
    key: string,
    action: () => Promise<string>,
    fallback: string,
  ) => {
    setBusyAction(key);
    try {
      const message = await action();
      await loadDetail({ silent: true });
      toast.success(message);
      return true;
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : fallback,
      );
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const startRussianTranscript = async () => {
    const started = await runAction(
      "generate",
      async () => {
        const result = await generateRussianTranscript(webinarId);
        return result.outcome === "started"
          ? "AI Russian transcript started. It appears under Russian when ready."
          : "An AI Russian transcript is already being generated.";
      },
      "Could not start the Russian AI transcript.",
    );
    if (started) setGenerateOpen(false);
  };

  const startEnglishTranslation = async (sourceVersionId: string) => {
    const source = findVersion(detail?.subtitles, sourceVersionId);
    const started = await runAction(
      "translate",
      async () => {
        const result = await generateEnglishTranslation(
          webinarId,
          sourceVersionId,
        );
        const from = source
          ? versionName(detail!.subtitles, source)
          : "the source";
        return result.outcome === "started"
          ? `English translation from ${from} started.`
          : `An English translation from ${from} is already running.`;
      },
      "Could not start the English translation.",
    );
    if (started) setTranslateOpen(false);
  };

  const retryVersion = (versionId: string) =>
    runAction(
      `retry:${versionId}`,
      async () => {
        await retrySubtitleVersion(webinarId, versionId);
        return "Job restarted.";
      },
      "Could not retry the subtitle job.",
    );

  const updateMemberTrack = (
    language: SubtitleTrackLanguage,
    versionId: string | null,
  ) =>
    runAction(
      `track:${language}`,
      async () => {
        await setMemberSubtitleTrack({ id: webinarId, language, versionId });
        const version = findVersion(detail?.subtitles, versionId);
        return version
          ? `Members now see ${versionName(detail!.subtitles, version)} for ${languageName[language]}.`
          : `${languageName[language]} subtitles are hidden from members.`;
      },
      "Could not update the member subtitle track.",
    );

  const submitAccess = async (access: WebinarAccessInput) => {
    const publishing = accessDialog === "publish";
    const saved = await runAction(
      "publication",
      async () => {
        if (publishing) {
          await publishWebinar(webinarId, access);
          return "Webinar published. Eligible members can watch it now.";
        }
        await updateWebinarAccess(webinarId, access);
        return "Access settings saved.";
      },
      publishing
        ? "Could not publish the webinar."
        : "Could not save access settings.",
    );
    if (saved) setAccessDialog(null);
  };

  const confirmUnpublish = async () => {
    const done = await runAction(
      "publication",
      async () => {
        await unpublishWebinar(webinarId);
        return "Webinar moved to draft. Members no longer see it.";
      },
      "Could not move the webinar to draft.",
    );
    if (done) setUnpublishOpen(false);
  };

  const requestBack = () => {
    if (dirty) setPendingNavigation({ type: "back" });
    else router.push("/admin/webinars");
  };

  const requestVersion = (versionId: string) => {
    if (versionId === selectedVersionId) return;
    if (dirty) setPendingNavigation({ type: "version", versionId });
    else setSelectedVersionId(versionId);
  };

  const requestHistory = () => {
    if (dirty) setPendingNavigation({ type: "history" });
    else setHistoryOpen(true);
  };

  const discardAndContinue = () => {
    const pending = pendingNavigation;
    setDirty(false);
    setPendingNavigation(null);
    if (pending?.type === "back") router.push("/admin/webinars");
    if (pending?.type === "version") setSelectedVersionId(pending.versionId);
    if (pending?.type === "history") {
      setContentReloadKey((key) => key + 1);
      setHistoryOpen(true);
    }
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

  const selectedName = selectedVersion
    ? versionName(detail.subtitles, selectedVersion)
    : "";
  const isPublished = detail.publicationStatus === "PUBLISHED";
  const canPublish = detail.status === "IMPORTED" && Boolean(detail.videoR2Key);

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
            <div className="flex flex-col items-start gap-3 xl:shrink-0 xl:items-end">
              <div className="flex flex-wrap items-center gap-2">
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
                <AdminStatusBadge tone={isPublished ? "success" : "neutral"}>
                  {isPublished ? (
                    <Globe className="size-3" />
                  ) : (
                    <FilePen className="size-3" />
                  )}
                  {isPublished ? "Published" : "Draft"}
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
              <div className="flex flex-wrap gap-2">
                {isPublished ? (
                  <>
                    <Button
                      className="h-10 rounded-2xl bg-white text-[#21466D]"
                      onClick={() => setAccessDialog("edit")}
                      type="button"
                      variant="outline"
                    >
                      <Lock data-icon="inline-start" /> Access settings
                    </Button>
                    <Button
                      className="h-10 rounded-2xl text-[#55708F] hover:text-[#0B1F44]"
                      onClick={() => setUnpublishOpen(true)}
                      type="button"
                      variant="ghost"
                    >
                      <EyeOff data-icon="inline-start" /> Move to draft
                    </Button>
                  </>
                ) : (
                  <Button
                    className="h-10 min-w-44 rounded-2xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
                    disabled={!canPublish}
                    onClick={() => setAccessDialog("publish")}
                    title={
                      canPublish
                        ? undefined
                        : "Import the recording before publishing"
                    }
                    type="button"
                  >
                    <Send data-icon="inline-start" /> Publish webinar
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#E8EEF5] pt-3 text-xs text-[#55708F]">
            <Users className="size-3.5 text-[#21466D]" />
            {isPublished ? (
              <>
                <span className="font-semibold text-[#0B1F44]">
                  {describeAccess(detail.access, detail.membershipCategories)}
                </span>
                {detail.publishedAt ? (
                  <span>
                    · Published {formatWebinarDate(detail.publishedAt)}
                  </span>
                ) : null}
              </>
            ) : (
              <span>
                Draft · Members cannot see this webinar until it is published.
                Subtitles are not required to publish.
              </span>
            )}
          </p>
          {error ? (
            <div
              className="mt-4 rounded-2xl border border-[#F2C7C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#8F241E]"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 xl:col-start-1">
            <WebinarPlayer
              cues={cues}
              onTimeChange={setCurrentTime}
              onTrackChange={requestVersion}
              selectedTrackId={selectedReady ? selectedVersionId : null}
              source={playbackUrl}
              tracks={playerTracks}
              videoRef={videoRef}
            />
          </div>

          <div className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:[scrollbar-gutter:stable]">
            <SubtitleTranslationNavigator
              busyAction={busyAction}
              canGenerateRussian={
                detail.status === "IMPORTED" && Boolean(detail.videoR2Key)
              }
              onCompare={(versionId) => {
                requestVersion(versionId);
                setWorkspaceMode("compare");
              }}
              onEdit={(versionId) => {
                setWorkspaceMode("edit");
                requestVersion(versionId);
              }}
              onGenerateRussian={() => setGenerateOpen(true)}
              onHistory={requestHistory}
              onRetry={(versionId) => void retryVersion(versionId)}
              onSelect={requestVersion}
              onSetMemberTrack={(language, versionId) =>
                void updateMemberTrack(language, versionId)
              }
              onTranslate={(sourceVersionId) => {
                setTranslateSourceId(sourceVersionId);
                setTranslateOpen(true);
              }}
              selectedVersionId={selectedVersionId}
              state={detail.subtitles}
              workspaceMode={workspaceMode}
            />
            <div className="hidden xl:block">
              <WebinarSidePanel detail={detail} />
            </div>
          </div>

          <div className="min-w-0 space-y-3 xl:col-start-1">
            <div
              aria-label="Subtitle workspace mode"
              className="inline-flex rounded-2xl border border-[#D4E0F0] bg-white p-1 shadow-[0_8px_20px_rgba(15,46,83,0.05)]"
              role="tablist"
            >
              {(
                [
                  { key: "edit", label: "Edit", icon: PencilLine },
                  { key: "compare", label: "Compare", icon: Columns2 },
                ] as const
              ).map((mode) => {
                const selected = workspaceMode === mode.key;
                return (
                  <button
                    aria-selected={selected}
                    className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] ${
                      selected
                        ? "bg-[#21466D] text-white"
                        : "text-[#315F8A] hover:bg-[#EEF6FF]"
                    }`}
                    key={mode.key}
                    onClick={() => setWorkspaceMode(mode.key)}
                    role="tab"
                    type="button"
                  >
                    <mode.icon className="size-4" /> {mode.label}
                  </button>
                );
              })}
            </div>
            {workspaceMode === "compare" ? (
              <SubtitleCompareView
                currentTime={currentTime}
                focusVersionId={selectedVersionId}
                onOpenInEditor={(versionId) => {
                  setWorkspaceMode("edit");
                  requestVersion(versionId);
                }}
                onSeek={handleSeek}
                state={detail.subtitles}
                webinarId={webinarId}
              />
            ) : (
              <SubtitleEditor
                activeCueIndex={activeCueIndex}
                cues={cues}
                currentTime={currentTime}
                dirty={dirty}
                error={subtitleError}
                isLoading={isSubtitleLoading}
                isSaving={isSaving}
                lineage={
                  selectedVersion
                    ? lineageLabel(detail.subtitles, selectedVersion)
                    : ""
                }
                onChange={handleCueChange}
                onOpenHistory={requestHistory}
                onSave={() => void saveSubtitles()}
                onSeek={handleSeek}
                revision={selectedRevision}
                version={selectedVersion}
                versionLabel={selectedName}
              />
            )}
          </div>

          <div className="min-w-0 xl:hidden">
            <WebinarSidePanel detail={detail} />
          </div>
        </div>
      </div>

      <WebinarAccessDialog
        access={detail.access}
        isSaving={busyAction === "publication"}
        membershipCategories={detail.membershipCategories}
        mode={accessDialog === "publish" ? "publish" : "edit"}
        onOpenChange={(open) => !open && setAccessDialog(null)}
        onSubmit={(access) => void submitAccess(access)}
        open={Boolean(accessDialog)}
        subtitles={detail.subtitles}
      />

      <Dialog
        open={unpublishOpen}
        onOpenChange={(open) => !open && setUnpublishOpen(false)}
      >
        <DialogContent className="max-w-md rounded-[24px] border border-[#D4E0F0] p-6">
          <DialogTitle className="text-lg font-semibold text-[#0B1F44]">
            Move this webinar to draft?
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#6C7F95]">
            Members lose access immediately. Subtitles, translations, and access
            settings are kept, so you can publish again later.
          </DialogDescription>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              className="h-10 rounded-xl"
              onClick={() => setUnpublishOpen(false)}
              type="button"
              variant="outline"
            >
              Keep published
            </Button>
            <Button
              aria-busy={busyAction === "publication"}
              className="h-10 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
              disabled={busyAction === "publication"}
              onClick={() => void confirmUnpublish()}
              type="button"
            >
              {busyAction === "publication" ? (
                <LoaderCircle className="motion-safe:animate-spin" />
              ) : (
                <EyeOff />
              )}
              Move to draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GenerateRussianDialog
        isStarting={busyAction === "generate"}
        onConfirm={() => void startRussianTranscript()}
        onOpenChange={setGenerateOpen}
        open={generateOpen}
      />

      <TranslateEnglishDialog
        initialSourceId={translateSourceId}
        isStarting={busyAction === "translate"}
        onConfirm={(sourceVersionId) =>
          void startEnglishTranslation(sourceVersionId)
        }
        onOpenChange={setTranslateOpen}
        open={translateOpen}
        state={detail.subtitles}
      />

      <SubtitleRevisionHistory
        isRestoring={isRestoring}
        onOpenChange={setHistoryOpen}
        onRestore={(revisionId) => void restoreRevision(revisionId)}
        open={historyOpen}
        version={selectedVersion}
        versionLabel={selectedName}
      />

      <Dialog
        open={Boolean(pendingNavigation)}
        onOpenChange={(open) => !open && setPendingNavigation(null)}
      >
        <DialogContent className="max-w-md rounded-[24px] border border-[#D4E0F0] p-6">
          <DialogTitle className="text-lg font-semibold text-[#0B1F44]">
            Discard subtitle changes?
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#6C7F95]">
            This version has edits that have not been saved. Discarding them
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
