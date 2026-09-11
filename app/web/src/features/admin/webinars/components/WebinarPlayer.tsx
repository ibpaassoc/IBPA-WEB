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
import { useMemo, useRef, useState, type MutableRefObject } from "react";

import { Button } from "@/components/ui/button";
import {
  Select as AdminSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubtitleLanguage } from "../types/webinar.types";
import { findActiveCueIndex, type VttCue } from "../utils/vtt";
import { formatDuration } from "../utils/webinar-formatters";

const languageLabels: Record<SubtitleLanguage, string> = {
  ru: "Original",
  en: "English",
  uk: "Ukrainian",
};

type WebinarPlayerProps = {
  source: string | null;
  cues: VttCue[];
  languages: SubtitleLanguage[];
  selectedLanguage: SubtitleLanguage | null;
  onLanguageChange: (language: SubtitleLanguage) => void;
  onTimeChange: (time: number) => void;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
};

export function WebinarPlayer({
  cues,
  languages,
  onLanguageChange,
  onTimeChange,
  selectedLanguage,
  source,
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
  const activeCueIndex = useMemo(
    () => (captionsEnabled ? findActiveCueIndex(cues, currentTime) : -1),
    [captionsEnabled, cues, currentTime],
  );

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || !source) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setMediaError(
          "Playback could not start. Refresh the page to request a new private URL.",
        );
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
      setMediaError("Fullscreen is unavailable in this browser window.");
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
          onError={() =>
            setMediaError(
              "The private video could not be loaded. Refresh to request a new playback URL.",
            )
          }
          onLoadedMetadata={() => setMediaError(null)}
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
          <p className="font-semibold text-white">Video is not in R2 yet</p>
          <p className="mt-1 max-w-md text-sm leading-6">
            Import a completed Zoom MP4 from the webinar library to enable
            playback.
          </p>
        </div>
      )}

      {captionsEnabled && activeCueIndex >= 0 ? (
        <div
          className="pointer-events-none absolute inset-x-6 bottom-20 flex justify-center"
          aria-live="off"
        >
          <p className="max-w-3xl whitespace-pre-line rounded-xl bg-[#071529]/88 px-4 py-2 text-center text-[clamp(14px,2vw,20px)] font-medium leading-relaxed text-white shadow-lg backdrop-blur-md">
            {cues[activeCueIndex].text}
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
          aria-label="Video position"
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
            aria-label={isPlaying ? "Pause video" : "Play video"}
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
            aria-label={muted ? "Unmute video" : "Mute video"}
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
            aria-label="Video volume"
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
            {languages.length ? (
              <AdminSelect
                onValueChange={(value) =>
                  onLanguageChange(value as SubtitleLanguage)
                }
                value={selectedLanguage || undefined}
              >
                <SelectTrigger
                  aria-label="Subtitle language"
                  className="h-8 w-28 rounded-xl border-white/15 bg-white/10 text-xs text-white hover:bg-white/15"
                >
                  <SelectValue placeholder="Subtitles" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="min-w-[var(--radix-select-trigger-width)] rounded-xl border-[#D4E0F0]"
                >
                  {languages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {languageLabels[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </AdminSelect>
            ) : null}
            <Button
              aria-label={
                captionsEnabled ? "Turn subtitles off" : "Turn subtitles on"
              }
              aria-pressed={captionsEnabled}
              className="size-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              disabled={!languages.length}
              onClick={() => setCaptionsEnabled((value) => !value)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {captionsEnabled ? <Captions /> : <CaptionsOff />}
            </Button>
            <Button
              aria-label="Enter fullscreen"
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
