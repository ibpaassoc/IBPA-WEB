"use client";

import {
  ArrowRight,
  CalendarDays,
  Captions,
  Clock3,
  Play,
  RotateCw,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { dashboardSecondaryButtonClassName } from "@/shared/components/DashboardShared";
import { useI18n } from "@/lib/i18n";
import { getLocaleNumberFormat } from "@/lib/locale";
import type { MemberWebinar } from "../types";
import { formatWebinarDay, formatWebinarRuntime } from "../utils";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: MemberWebinar[] };

async function fetchMemberWebinars(
  signal: AbortSignal,
  fallbackError: string,
): Promise<LoadState> {
  try {
    const response = await fetch("/api/dashboard/webinars", {
      cache: "no-store",
      signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        status: "error",
        message: typeof data?.error === "string" ? data.error : fallbackError,
      };
    }
    return {
      status: "ready",
      items: Array.isArray(data.items) ? data.items : [],
    };
  } catch {
    return { status: "error", message: fallbackError };
  }
}

export function DashboardWebinars() {
  const { locale, t } = useI18n();
  const copy = t.dashboard.webinars;
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMemberWebinars(controller.signal, copy.loadError).then((next) => {
      if (!controller.signal.aborted) setState(next);
    });
    return () => controller.abort();
  }, [copy.loadError, reloadKey]);

  const monthFormat = new Intl.DateTimeFormat(getLocaleNumberFormat(locale), {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10203B]">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {copy.description}
        </p>
      </div>

      {state.status === "loading" ? (
        <div aria-busy className="grid gap-5 md:grid-cols-2" role="status">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white"
              key={index}
            >
              <div className="aspect-[16/9] bg-[#E9EEF5] motion-safe:animate-pulse" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-4/5 rounded-full bg-slate-100 motion-safe:animate-pulse" />
                <div className="h-4 w-1/2 rounded-full bg-slate-100 motion-safe:animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : state.status === "error" ? (
        <div
          className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(11,31,68,0.08)]"
          role="alert"
        >
          <p className="text-sm text-slate-600">{state.message}</p>
          <button
            className={`${dashboardSecondaryButtonClassName} mt-4`}
            onClick={() => {
              setState({ status: "loading" });
              setReloadKey((key) => key + 1);
            }}
            type="button"
          >
            <RotateCw className="h-4 w-4" /> {copy.retry}
          </button>
        </div>
      ) : state.items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-white/90 p-10 text-center shadow-[0_18px_45px_rgba(11,31,68,0.08)]">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FA] text-[#4C7D9D]">
            <Video className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[#10203B]">
            {copy.emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {copy.emptyDescription}
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {state.items.map((webinar) => {
            const recorded = new Date(webinar.recordedAt);
            const validDate = !Number.isNaN(recorded.getTime());
            return (
              <li key={webinar.id}>
                <Link
                  className="group block h-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:border-[#4C7D9D]/40 hover:shadow-[0_18px_42px_rgba(16,32,59,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C7D9D] focus-visible:ring-offset-2"
                  href={`/dashboard/webinars/${webinar.id}`}
                >
                  <div className="relative flex aspect-[16/9] flex-col justify-between bg-[#10203B] p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      {validDate ? (
                        <div className="leading-none">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                            {monthFormat.format(recorded)}
                          </p>
                          <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">
                            {String(recorded.getDate()).padStart(2, "0")}
                          </p>
                        </div>
                      ) : (
                        <span />
                      )}
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition group-hover:bg-white group-hover:text-[#10203B]">
                        <Play className="h-5 w-5 translate-x-px" />
                      </span>
                    </div>
                    <div className="border-t border-white/15 pt-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-white/70">
                        <span className="tabular-nums">
                          {formatWebinarRuntime(webinar.durationSeconds)}
                        </span>
                        <span className="flex gap-1">
                          {webinar.subtitleLanguages.map((language) => (
                            <span
                              className="rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85"
                              key={language}
                            >
                              {language}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-[#10203B]">
                      {webinar.title}
                    </h2>
                    <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                      <div className="inline-flex items-center gap-1.5">
                        <dt className="sr-only">{t.dashboard.events.date}</dt>
                        <CalendarDays
                          aria-hidden
                          className="h-4 w-4 text-[#4C7D9D]"
                        />
                        <dd>{formatWebinarDay(webinar.recordedAt, locale)}</dd>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <dt className="sr-only">{copy.duration}</dt>
                        <Clock3
                          aria-hidden
                          className="h-4 w-4 text-[#4C7D9D]"
                        />
                        <dd className="tabular-nums">
                          {formatWebinarRuntime(webinar.durationSeconds)}
                        </dd>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <dt className="sr-only">{copy.subtitles}</dt>
                        <Captions
                          aria-hidden
                          className="h-4 w-4 text-[#4C7D9D]"
                        />
                        <dd>
                          {webinar.subtitleLanguages.length
                            ? webinar.subtitleLanguages
                                .map((language) => copy.languageNames[language])
                                .join(", ")
                            : copy.noSubtitles}
                        </dd>
                      </div>
                    </dl>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#10203B]">
                      {copy.watch}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
