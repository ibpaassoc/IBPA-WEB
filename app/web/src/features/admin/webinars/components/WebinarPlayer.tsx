"use client";

import {
  Captions,
  CaptionsOff,
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Select as AdminSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  findActiveCueIndex,
  visibleCueIndex,
  type FrameCueIndex,
  type VttCue,
} from "../utils/vtt";
import { formatDuration } from "../utils/webinar-formatters";

export type WebinarPlayerTrack = { id: string; label: string };

export type WebinarPlayerLabels = {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  volume: string;
  position: string;
  subtitlesOn: string;
  subtitlesOff: string;
  fullscreen: string;
  playbackError: string;
  loadError: string;
  fullscreenError: string;
};

const defaultLabels: WebinarPlayerLabels = {
  play: "Play video",
  pause: "Pause video",
  mute: "Mute video",
  unmute: "Unmute video",
  volume: "Video volume",
  position: "Video position",
  subtitlesOn: "Turn subtitles on",
  subtitlesOff: "Turn subtitles off",
  fullscreen: "Enter fullscreen",
  playbackError:
    "Playback could not start. Refresh the page to request a new private URL.",
  loadError:
    "The private video could not be loaded. Refresh to request a new playback URL.",
  fullscreenError: "Fullscreen is unavailable in this browser window.",
};

type WebinarPlayerProps = {
  source: string | null;
  cues: VttCue[];
  tracks: WebinarPlayerTrack[];
  selectedTrackId: string | null;
  onTrackChange: (trackId: string) => void;
  onTimeChange: (time: number) => void;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  emptyTitle?: string;
  emptyDescription?: string;
  trackSelectLabel?: string;
  labels?: Partial<WebinarPlayerLabels>;
  /** Seek here once the current source has loaded (e.g. after re-signing a URL). */
  resumeAt?: number | null;
  /** Called when the source fails; return true if a replacement is being fetched. */
  onSourceError?: () => boolean;
};

export function WebinarPlayer({
  cues,
  emptyDescription = "Import a completed Zoom MP4 from the webinar library to enable playback.",
  emptyTitle = "Video is not in R2 yet",
  labels: labelOverrides,
  onSourceError,
  onTimeChange,
  onTrackChange,
  resumeAt,
  selectedTrackId,
  source,
  trackSelectLabel = "Subtitle track",
  tracks,
  videoRef,
}: WebinarPlayerProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [frameCue, setFrameCue] = useState<FrameCueIndex | null>(null);
  const labels = { ...defaultLabels, ...labelOverrides };

  // timeupdate fires only ~4×/s; while playing, follow the video clock per
  // frame so captions switch exactly on their timestamps. State changes only
  // when the visible cue changes.
  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const index = findActiveCueIndex(cues, video.currentTime);
        setFrameCue((current) =>
          current?.cues === cues && current.index === index
            ? current
            : { cues, index },
        );
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [cues, isPlaying, videoRef]);

  const activeCueIndex = useMemo(
    () =>
      captionsEnabled
        ? visibleCueIndex({
            cues,
            currentTime,
            frame: isPlaying ? frameCue : null,
          })
        : -1,
    [captionsEnabled, cues, currentTime, frameCue, isPlaying],
  );
  const activeCue = activeCueIndex >= 0 ? cues[activeCueIndex] : null;

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || !source) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setMediaError(labels.playbackError);
      }
    } else {
      video.pause();
    }
  };

  const seek = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
    onTimeChange(value);
  };

  const setPlayerVolume = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = value;
    videoRef.current.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const enterFullscreen = async () => {
    try {
      await frameRef.current?.requestFullscreen();
    } catch {
      setMediaError(labels.fullscreenError);
    }
  };

  return (
    <div
      ref={frameRef}
      className="group relative aspect-video w-full overflow-hidden rounded-[28px] border border-[#1D3553] bg-[#071529] shadow-[0_28px_70px_rgba(11,31,68,0.22)]"
    >
      {source ? (
        <video
          ref={videoRef}
          className="size-full bg-black object-contain"
          onDurationChange={(event) =>
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : 0,
            )
          }
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            if (!onSourceError?.()) setMediaError(labels.loadError);
          }}
          onLoadedMetadata={(event) => {
            setMediaError(null);
            if (resumeAt && Number.isFinite(resumeAt)) {
              event.currentTarget.currentTime = resumeAt;
            }
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onTimeUpdate={(event) => {
            const time = event.currentTarget.currentTime;
            setCurrentTime(time);
            onTimeChange(time);
          }}
          playsInline
          preload="metadata"
          src={source}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center px-6 text-center text-white/65">
          <Play className="mb-3 size-8" />
          <p className="font-semibold text-white">{emptyTitle}</p>
          <p className="mt-1 max-w-md text-sm leading-6">{emptyDescription}</p>
        </div>
      )}

      {activeCue ? (
        <div
          className="pointer-events-none absolute inset-x-6 bottom-20 flex justify-center"
          aria-live="off"
        >
          <p className="max-w-3xl whitespace-pre-line rounded-xl bg-[#071529]/88 px-4 py-2 text-center text-[clamp(14px,2vw,20px)] font-medium leading-relaxed text-white shadow-lg backdrop-blur-md">
            {activeCue.text}
          </p>
        </div>
      ) : null}

      {mediaError ? (
        <div
          className="absolute inset-x-4 top-4 rounded-xl border border-red-300/30 bg-red-950/85 px-4 py-3 text-sm text-red-50 backdrop-blur"
          role="alert"
        >
          {mediaError}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071529] via-[#071529]/94 to-transparent px-4 pb-3 pt-9 text-white">
        <input
          aria-label={labels.position}
          className="block h-1.5 w-full cursor-pointer accent-[#7EB6E8]"
          disabled={!source}
          max={duration || 0}
          min={0}
          onChange={(event) => seek(Number(event.target.value))}
          step="0.05"
          type="range"
          value={Math.min(currentTime, duration || 0)}
        />
        <div className="mt-2 flex items-center gap-1.5">
          <Button
            aria-label={isPlaying ? labels.pause : labels.play}
            className="size-9 rounded-full border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            disabled={!source}
            onClick={() => void togglePlayback()}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isPlaying ? <Pause /> : <Play className="translate-x-px" />}
          </Button>
          <span className="min-w-28 text-xs tabular-nums text-white/75">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
          <Button
            aria-label={muted ? labels.unmute : labels.mute}
            aria-pressed={muted}
            className="size-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            disabled={!source}
            onClick={toggleMute}
            size="icon"
            type="button"
            variant="ghost"
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <input
            aria-label={labels.volume}
            className="hidden h-1 w-20 cursor-pointer accent-white sm:block"
            disabled={!source}
            max={1}
            min={0}
            onChange={(event) => setPlayerVolume(Number(event.target.value))}
            step="0.05"
            type="range"
            value={muted ? 0 : volume}
          />
          <div className="ml-auto flex items-center gap-1">
            {tracks.length ? (
              <AdminSelect
                onValueChange={onTrackChange}
                value={selectedTrackId || undefined}
              >
                <SelectTrigger
                  aria-label={trackSelectLabel}
                  className="h-8 w-32 rounded-xl border-white/15 bg-white/10 text-xs text-white hover:bg-white/15 sm:w-44"
                >
                  <SelectValue placeholder="Subtitles" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="min-w-[var(--radix-select-trigger-width)] rounded-xl border-[#D4E0F0]"
                >
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </AdminSelect>
            ) : null}
            <Button
              aria-label={
                captionsEnabled ? labels.subtitlesOff : labels.subtitlesOn
              }
              aria-pressed={captionsEnabled}
              className="size-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              disabled={!tracks.length}
              onClick={() => setCaptionsEnabled((value) => !value)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {captionsEnabled ? <Captions /> : <CaptionsOff />}
            </Button>
            <Button
              aria-label={labels.fullscreen}
              className="size-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              disabled={!source}
              onClick={() => void enterFullscreen()}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Maximize />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
