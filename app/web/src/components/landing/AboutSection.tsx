"use client";
import React from "react";
import { ArrowRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

type VimeoPlayerLike = {
  play: () => Promise<unknown>;
  pause: () => Promise<unknown>;
  setVolume: (volume: number) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  destroy: () => Promise<unknown>;
};

export const AboutSection = () => {
  const { t, locale } = useI18n();
  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const editorialClassName = `${cyrillicEditorial.className} italic`;
  const accentClassName = useEnglishHomepageTypography ? homeTemplateAccent.className : editorialClassName;
  const missionVideoTitle =
    locale === "ru"
      ? "Видео о миссии IBPA"
      : locale === "uk"
        ? "Відео про місію IBPA"
        : "IBPA mission video";
  const startVideoLabel =
    locale === "ru" ? "Запустить видео" : locale === "uk" ? "Запустити відео" : "Start video";
  const videoPosterAlt =
    locale === "ru" ? "Постер видео IBPA" : locale === "uk" ? "Постер відео IBPA" : "IBPA video poster";
  const pauseLabel = locale === "ru" ? "Пауза" : locale === "uk" ? "Пауза" : "Pause";
  const playLabel = locale === "ru" ? "Воспроизвести" : locale === "uk" ? "Відтворити" : "Play";
  const unmuteLabel =
    locale === "ru" ? "Включить звук" : locale === "uk" ? "Увімкнути звук" : "Unmute";
  const muteLabel = locale === "ru" ? "Выключить звук" : locale === "uk" ? "Вимкнути звук" : "Mute";
  const videoWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const playerRef = React.useRef<VimeoPlayerLike | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  // Click-to-play facade: no Vimeo asset (iframe, player.js, media) is fetched
  // until the visitor explicitly presses play.
  const [hasStarted, setHasStarted] = React.useState(false);

  React.useEffect(() => {
    if (!hasStarted || !iframeRef.current || playerRef.current) return;

    let isCancelled = false;
    let cleanup: (() => void) | undefined;

    const setupPlayer = async () => {
      const { default: Player } = await import("@vimeo/player");
      if (isCancelled || !iframeRef.current || playerRef.current) return;

      const player = new Player(iframeRef.current) as unknown as VimeoPlayerLike;
      playerRef.current = player;
      void player.setVolume(0).catch(() => undefined);

      const handlePlay = () => {
        setIsPlaying(true);
      };
      const handlePause = () => setIsPlaying(false);
      const handleVolume = (...args: unknown[]) => {
        const event = args[0];
        if (
          event &&
          typeof event === "object" &&
          "volume" in event &&
          typeof (event as { volume?: unknown }).volume === "number"
        ) {
          setIsMuted((event as { volume: number }).volume === 0);
        }
      };

      player.on("play", handlePlay);
      player.on("pause", handlePause);
      player.on("volumechange", handleVolume);

      cleanup = () => {
        player.off("play", handlePlay);
        player.off("pause", handlePause);
        player.off("volumechange", handleVolume);
        void player.destroy();
        playerRef.current = null;
      };
    };

    void setupPlayer();

    return () => {
      isCancelled = true;
      cleanup?.();
    };
  }, [hasStarted]);

  React.useEffect(() => {
    // Pause automatically when the video scrolls out of view (only relevant
    // once the visitor has started playback).
    if (!hasStarted || !videoWrapperRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const player = playerRef.current;
        if (!player) return;

        if (!entry.isIntersecting) {
          void player.pause().catch(() => undefined);
        }
      },
      { threshold: 0.55 }
    );

    observer.observe(videoWrapperRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  const togglePlayback = async () => {
    if (!hasStarted) {
      // Mounting the iframe with autoplay=1 starts playback as soon as the
      // player is ready — nothing from Vimeo has been downloaded before this.
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      await player.pause().catch(() => undefined);
      return;
    }
    await player.play().catch(() => undefined);
  };

  const toggleMute = async () => {
    const player = playerRef.current;
    if (!player) return;
    const nextVolume = isMuted ? 1 : 0;
    await player.setVolume(nextVolume).catch(() => undefined);
    setIsMuted(nextVolume === 0);
  };

  return (
    <section className="bg-white py-20 md:py-40">
      <div className="mx-auto grid max-w-7xl items-center gap-20 px-6 lg:grid-cols-2">
        <div className="hidden w-full max-w-[26rem] justify-self-center md:block lg:order-1">
          <div
            ref={videoWrapperRef}
            className="relative aspect-[9/16] overflow-hidden rounded-[40px] bg-[#EEF5F9] shadow-[0_24px_80px_rgba(39,54,72,0.14)] md:rounded-[56px]"
          >
            {hasStarted ? (
              <iframe
                ref={iframeRef}
                src="https://player.vimeo.com/video/1175624606?app_id=122963&autoplay=1&muted=1&background=1&controls=0&title=0&byline=0&portrait=0&playsinline=1"
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                title={missionVideoTitle}
              />
            ) : (
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={startVideoLabel}
                className="absolute inset-0 z-10 block"
              >
                <Image
                  src="https://i.vimeocdn.com/video/2136510606-dc277ff305a50d246bc8394eab61d6b81695414fd357ddfb8f4a10ffcf53526d-d_540x960?region=us"
                  alt={videoPosterAlt}
                  className="h-full w-full object-cover"
                  width={540}
                  height={960}
                  sizes="(min-width: 768px) 416px, 90vw"
                  quality={70}
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/8 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-black/35 text-white shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-105 md:h-20 md:w-20">
                    <Play size={28} className="translate-x-[2px]" />
                  </span>
                </div>
              </button>
            )}
            <div className="pointer-events-none absolute inset-0 bg-black/10" />
            {hasStarted ? (
              <div className="absolute right-4 top-4 z-10 flex gap-3 md:right-5 md:top-5">
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? pauseLabel : playLabel}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/50 md:h-12 md:w-12"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? unmuteLabel : muteLabel}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/50 md:h-12 md:w-12"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-8 text-left md:space-y-12 lg:order-2">
          <h2 className={`pt-4 text-[2.75rem] uppercase leading-[0.94] tracking-normal md:pt-0 md:text-[4.85rem] ${headlineClassName}`}>
            {t.home.about.title}
          </h2>

          <div className="space-y-10">
            <p className={`max-w-xl text-[1.1rem] leading-relaxed text-gray-700 md:text-[1.32rem] ${bodyClassName}`}>
              {t.home.about.subtitle}
            </p>

            <div className="pt-4">
              <Link
                href="/about"
                className={`group inline-flex items-center gap-3 text-sm uppercase tracking-[0.14em] transition-colors hover:text-[#72A0C1] ${uiClassName}`}
              >
                {t.home.about.readMore}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <p className={`mt-6 border-l border-[#72A0C1] pl-8 text-[1.6125rem] leading-[1.35] text-slate-500 md:mt-16 md:text-[1.625rem] ${accentClassName}`}>
              {t.home.about.quote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
