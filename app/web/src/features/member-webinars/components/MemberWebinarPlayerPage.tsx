"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  CalendarDays,
  Captions,
  Clock3,
  Loader2,
  Lock,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { WebinarPlayer } from "@/features/admin/webinars/components/WebinarPlayer";
import { parseVtt, type VttCue } from "@/features/admin/webinars/utils/vtt";
import { useI18n } from "@/lib/i18n";
import {
  dashboardPrimaryButtonClassName,
  dashboardStandalonePageContainerClassName,
  getDashboardFilterButtonClassName,
  SectionCard,
} from "@/shared/components/DashboardShared";
import type { MemberSubtitleLanguage, MemberWebinar } from "../types";
import { formatWebinarDay, formatWebinarRuntime } from "../utils";

type TrackChoice = MemberSubtitleLanguage | "off";

type PageState =
  | { status: "loading" }
  | { status: "ready"; webinar: MemberWebinar }
  | { status: "not-found" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

const REFRESH_COOLDOWN_MS = 20_000;
const BACK_HREF = "/dashboard?tab=webinars";

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

/** Prefer subtitles in the interface language, then Russian, then anything. */
function defaultTrack(
  languages: MemberSubtitleLanguage[],
  locale: string,
): TrackChoice {
  const preferred: MemberSubtitleLanguage = locale === "en" ? "en" : "ru";
  if (languages.includes(preferred)) return preferred;
  return languages[0] ?? "off";
}

export function MemberWebinarPlayerPage({ webinarId }: { webinarId: string }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { locale, t } = useI18n();
  const copy = t.dashboard.webinars;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTimeRef = useRef(0);
  const lastRefreshRef = useRef(0);

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [chosenTrack, setChosenTrack] = useState<TrackChoice | null>(null);
  const [subtitles, setSubtitles] = useState<{
    language: MemberSubtitleLanguage;
    cues: VttCue[];
  } | null>(null);
  const [subtitleError, setSubtitleError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    const controller = new AbortController();
    const base = `/api/dashboard/webinars/${encodeURIComponent(webinarId)}`;

    void (async () => {
      try {
        const response = await fetch(base, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await readJson(response);
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          router.replace("/sign-in");
          return;
        }
        if (response.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        if (response.status === 403 && data.code === "WEBINAR_ACCESS_DENIED") {
          setState({ status: "forbidden" });
          return;
        }
        if (!response.ok || !data.webinar) {
          setState({
            status: "error",
            message:
              typeof data.error === "string" ? data.error : copy.loadError,
          });
          return;
        }
        setState({ status: "ready", webinar: data.webinar as MemberWebinar });

        const playback = await fetch(`${base}/playback`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const playbackData = await readJson(playback);
        if (controller.signal.aborted) return;
        if (playback.ok && typeof playbackData.url === "string") {
          lastRefreshRef.current = Date.now();
          setPlaybackUrl(playbackData.url);
        } else {
          setPlaybackFailed(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: copy.loadError });
        }
      }
    })();

    return () => controller.abort();
  }, [copy.loadError, isLoaded, isSignedIn, router, webinarId]);

  const webinar = state.status === "ready" ? state.webinar : null;
  const languages = useMemo(() => webinar?.subtitleLanguages ?? [], [webinar]);
  const track: TrackChoice =
    chosenTrack && (chosenTrack === "off" || languages.includes(chosenTrack))
      ? chosenTrack
      : defaultTrack(languages, locale);

  useEffect(() => {
    if (!webinar || track === "off") return;
    const controller = new AbortController();
    void fetch(
      `/api/dashboard/webinars/${encodeURIComponent(webinar.id)}/subtitles/${track}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const data = await readJson(response);
        if (controller.signal.aborted) return;
        if (!response.ok || typeof data.text !== "string") {
          setSubtitleError(true);
          setSubtitles(null);
          return;
        }
        setSubtitleError(false);
        setSubtitles({ language: track, cues: parseVtt(data.text) });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSubtitleError(true);
          setSubtitles(null);
        }
      });
    return () => controller.abort();
  }, [track, webinar]);

  const cues =
    track !== "off" && subtitles?.language === track ? subtitles.cues : [];

  /** Signed URLs expire; fetch a fresh one and continue from the same moment. */
  const refreshPlayback = () => {
    if (!webinar || Date.now() - lastRefreshRef.current < REFRESH_COOLDOWN_MS) {
      return false;
    }
    lastRefreshRef.current = Date.now();
    setResumeAt(lastTimeRef.current || null);
    void fetch(
      `/api/dashboard/webinars/${encodeURIComponent(webinar.id)}/playback`,
      {
        cache: "no-store",
      },
    )
      .then(readJson)
      .then((data) => {
        if (typeof data.url === "string") setPlaybackUrl(data.url);
        else setPlaybackFailed(true);
      })
      .catch(() => setPlaybackFailed(true));
    return true;
  };

  const trackLabel = (choice: TrackChoice) =>
    choice === "off" ? copy.subtitlesOff : copy.languageNames[choice];

  if (!isLoaded || state.status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#F4F7FB]"
        role="status"
      >
        <Loader2 className="h-10 w-10 text-[#4C7D9D] motion-safe:animate-spin" />
      </div>
    );
  }

  if (state.status !== "ready") {
    const title =
      state.status === "forbidden"
        ? copy.accessDeniedTitle
        : state.status === "not-found"
          ? copy.notFoundTitle
          : copy.loadError;
    const description =
      state.status === "forbidden"
        ? copy.accessDeniedDescription
        : state.status === "not-found"
          ? copy.notFoundDescription
          : state.message;
    return (
      <main className="min-h-screen bg-[#F4F7FB]">
        <div className={dashboardStandalonePageContainerClassName}>
          <SectionCard className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FA] text-[#4C7D9D]">
              {state.status === "forbidden" ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Video className="h-5 w-5" />
              )}
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#10203B]">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {description}
            </p>
            <Link
              className={`${dashboardPrimaryButtonClassName} mt-6`}
              href={BACK_HREF}
            >
              <ArrowLeft className="h-4 w-4" /> {copy.backToWebinars}
            </Link>
          </SectionCard>
        </div>
      </main>
    );
  }

  const trackChoices: TrackChoice[] = ["off", ...languages];

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <div className={`${dashboardStandalonePageContainerClassName} space-y-6`}>
        <div className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C7D9D]"
            href={BACK_HREF}
          >
            <ArrowLeft className="h-4 w-4" /> {copy.backToWebinars}
          </Link>
          <UserButton />
        </div>

        <header className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#10203B] md:text-3xl">
            {state.webinar.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4 text-[#4C7D9D]" />
              {formatWebinarDay(state.webinar.recordedAt, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock3 aria-hidden className="h-4 w-4 text-[#4C7D9D]" />
              {formatWebinarRuntime(state.webinar.durationSeconds)}
            </span>
          </p>
        </header>

        <WebinarPlayer
          cues={cues}
          emptyDescription={
            playbackFailed ? copy.videoUnavailableDescription : ""
          }
          emptyTitle={playbackFailed ? copy.videoUnavailableTitle : ""}
          labels={copy.player}
          onSourceError={refreshPlayback}
          onTimeChange={(time) => {
            lastTimeRef.current = time;
          }}
          onTrackChange={(value) => setChosenTrack(value as TrackChoice)}
          resumeAt={resumeAt}
          selectedTrackId={languages.length ? track : null}
          source={playbackUrl}
          trackSelectLabel={copy.subtitleTrack}
          tracks={
            languages.length
              ? trackChoices.map((choice) => ({
                  id: choice,
                  label: trackLabel(choice),
                }))
              : []
          }
          videoRef={videoRef}
        />
      </div>
    </main>
  );
}
