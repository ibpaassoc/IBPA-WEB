"use client";

import {
  AudioLines,
  Columns2,
  Eye,
  EyeOff,
  FileVideo,
  History,
  Languages,
  LoaderCircle,
  PencilLine,
  RotateCw,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type {
  SubtitleTrackLanguage,
  SubtitleVersion,
  WebinarSubtitleState,
} from "../types/webinar.types";
import {
  currentRevision,
  findVersion,
  isManualKind,
  isReadyVersion,
  isVersionActive,
  languageName,
  lineageKinds,
  kindCode,
  manualVersionsFrom,
  navigatorLanes,
  translationSources,
  versionName,
  type NavigatorLane,
} from "../utils/subtitle-versions";

type SubtitleTranslationNavigatorProps = {
  state: WebinarSubtitleState;
  selectedVersionId: string | null;
  workspaceMode: "edit" | "compare";
  canGenerateRussian: boolean;
  busyAction: string | null;
  onSelect: (versionId: string) => void;
  onEdit: (versionId: string) => void;
  onCompare: (versionId: string) => void;
  onHistory: () => void;
  onGenerateRussian: () => void;
  onTranslate: (sourceVersionId: string | null) => void;
  onRetry: (versionId: string) => void;
  onSetMemberTrack: (
    language: SubtitleTrackLanguage,
    versionId: string | null,
  ) => void;
};

const laneIcon: Record<NavigatorLane["key"], typeof FileVideo> = {
  source: FileVideo,
  ru: AudioLines,
  en: Languages,
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function jobLabel(version: SubtitleVersion) {
  const progress = version.job?.progress;
  if (version.job?.type === "TRANSLATION") {
    return progress?.total
      ? `Translating ${progress.completed}/${progress.total}`
      : "Translating…";
  }
  return "Transcribing audio…";
}

function VersionRow({
  onSelect,
  selected,
  state,
  version,
}: {
  state: WebinarSubtitleState;
  version: SubtitleVersion;
  selected: boolean;
  onSelect: () => void;
}) {
  const revision = currentRevision(version);
  const hasManual =
    !isManualKind(version.kind) &&
    manualVersionsFrom(state, version.id).length > 0;
  return (
    <button
      aria-pressed={selected}
      className={`group flex w-full cursor-pointer items-start gap-2.5 rounded-xl border px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-1 ${
        selected
          ? "border-[#7EA8CF] bg-[#EEF6FF] shadow-[inset_3px_0_0_#21466D]"
          : "border-transparent hover:border-[#D4E0F0] hover:bg-[#F8FBFF]"
      }`}
      onClick={onSelect}
      type="button"
    >
      <span
        aria-hidden
        className={`mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-[#21466D]" : "border-[#9FB7D5]"
        }`}
      >
        {selected ? (
          <span className="size-1.5 rounded-full bg-[#21466D]" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1">
          <span className="text-[13px] font-semibold leading-5 text-[#0B1F44]">
            {versionName(state, version)}
          </span>
          {isVersionActive(state, version) ? (
            <AdminStatusBadge
              className="gap-0.5 px-1.5 py-0 text-[10px] shadow-none"
              tone="success"
            >
              <Users className="size-2.5" /> Members
            </AdminStatusBadge>
          ) : null}
          {version.status === "PROCESSING" ? (
            <AdminStatusBadge
              className="gap-1 px-1.5 py-0 text-[10px] shadow-none"
              tone="neutral"
            >
              <LoaderCircle className="size-2.5 motion-safe:animate-spin" />{" "}
              {jobLabel(version)}
            </AdminStatusBadge>
          ) : null}
          {version.status === "FAILED" ? (
            <AdminStatusBadge
              className="px-1.5 py-0 text-[10px] shadow-none"
              tone="danger"
            >
              Failed
            </AdminStatusBadge>
          ) : null}
          {hasManual ? (
            <AdminStatusBadge
              className="px-1.5 py-0 text-[10px] shadow-none"
              tone="neutral"
            >
              Corrected
            </AdminStatusBadge>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[#6C7F95]">
          <span className="font-mono text-[10px] text-[#315F8A]">
            {lineageKinds(state, version)
              .map((kind) => kindCode[kind])
              .join(" → ")}
          </span>
          {revision ? (
            <span className="tabular-nums">
              {" "}
              · rev {revision.number} · {revision.cueCount} cues
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
  busy,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  busy?: boolean;
}) {
  return (
    <Button
      aria-busy={busy}
      className={`h-9 justify-start rounded-xl px-3 text-[13px] ${
        primary
          ? "bg-[#21466D] text-white hover:bg-[#0B1F44]"
          : "border-[#D4E0F0] bg-white text-[#21466D] hover:border-[#9FB7D5] hover:bg-[#F8FBFF]"
      }`}
      disabled={disabled || busy}
      onClick={onClick}
      type="button"
      variant={primary ? "default" : "outline"}
    >
      {children}
    </Button>
  );
}

export function SubtitleTranslationNavigator({
  busyAction,
  canGenerateRussian,
  onCompare,
  onEdit,
  onGenerateRussian,
  onHistory,
  onRetry,
  onSelect,
  onSetMemberTrack,
  onTranslate,
  selectedVersionId,
  state,
  workspaceMode,
}: SubtitleTranslationNavigatorProps) {
  const lanes = navigatorLanes(state);
  const selected = findVersion(state, selectedVersionId);
  const selectedRevision = currentRevision(selected);
  const russianJobRunning = state.versions.some(
    (version) => version.kind === "RU_AI" && version.status === "PROCESSING",
  );
  const canTranslate = translationSources(state).length > 0;

  const laneAction = (lane: NavigatorLane) => {
    if (lane.key === "ru") {
      return (
        <button
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#21466D] transition hover:bg-[#E7F0FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={
            !canGenerateRussian ||
            russianJobRunning ||
            busyAction === "generate"
          }
          onClick={onGenerateRussian}
          title={
            !canGenerateRussian
              ? "Import the recording first"
              : russianJobRunning
                ? "An AI transcript is already being generated"
                : undefined
          }
          type="button"
        >
          <AudioLines className="size-3" /> Generate AI
        </button>
      );
    }
    if (lane.key === "en") {
      return (
        <button
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#21466D] transition hover:bg-[#E7F0FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canTranslate}
          onClick={() => onTranslate(null)}
          title={
            canTranslate ? undefined : "A ready Russian version is required"
          }
          type="button"
        >
          <Languages className="size-3" /> Translate
        </button>
      );
    }
    return null;
  };

  const emptyLaneText: Record<NavigatorLane["key"], string> = {
    source: "No Zoom transcript was imported.",
    ru: "No AI or manual Russian version yet.",
    en: "No English version yet.",
  };

  return (
    <section
      aria-label="Subtitles and translation"
      className="rounded-[24px] border border-[#D4E0F0] bg-white/90 shadow-[0_14px_35px_rgba(15,46,83,0.05)] backdrop-blur-xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#E8EEF5] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0B1F44]">
            Subtitles & translation
          </h2>
          <p className="text-[11px] text-[#6C7F95]">
            Source → Russian → English
          </p>
        </div>
        <Languages aria-hidden className="size-4 text-[#21466D]" />
      </header>

      <ol className="px-3 py-3">
        {lanes.map((lane, laneIndex) => {
          const Icon = laneIcon[lane.key];
          const last = laneIndex === lanes.length - 1;
          return (
            <li className="relative pb-3 pl-8 last:pb-0" key={lane.key}>
              {!last ? (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-[13px] top-7 w-px bg-[#D4E0F0]"
                />
              ) : null}
              <span
                aria-hidden
                className="absolute left-0 top-0.5 flex size-[27px] items-center justify-center rounded-full border border-[#D4E0F0] bg-[#F5F9FF] text-[#21466D]"
              >
                <Icon className="size-3.5" />
              </span>
              <div className="flex min-h-7 items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#55708F]">
                  {lane.title}
                  <span className="ml-1.5 font-semibold tabular-nums tracking-normal text-[#8AA2BD]">
                    {lane.versions.length}
                  </span>
                </h3>
                {laneAction(lane)}
              </div>
              <div className="mt-1 space-y-0.5">
                {lane.versions.length ? (
                  lane.versions.map((version) => (
                    <VersionRow
                      key={version.id}
                      onSelect={() => onSelect(version.id)}
                      selected={version.id === selectedVersionId}
                      state={state}
                      version={version}
                    />
                  ))
                ) : (
                  <p className="px-2.5 py-1.5 text-[11px] text-[#8AA2BD]">
                    {emptyLaneText[lane.key]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {selected ? (
        <div className="border-t border-[#E8EEF5] px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8AA2BD]">
            Selected track · {languageName[selected.language]}
          </p>
          <h3 className="mt-1 text-base font-semibold text-[#0B1F44]">
            {versionName(state, selected)}
          </h3>
          <ol
            aria-label="Where this version came from"
            className="mt-2 flex flex-wrap items-center gap-1"
          >
            {lineageKinds(state, selected).map((kind, index, chain) => (
              <li className="flex items-center gap-1" key={`${kind}-${index}`}>
                <span
                  className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    index === chain.length - 1
                      ? "border-[#21466D] bg-[#21466D] text-white"
                      : "border-[#D4E0F0] bg-[#F8FBFF] text-[#315F8A]"
                  }`}
                >
                  {kindCode[kind]}
                </span>
                {index < chain.length - 1 ? (
                  <span aria-hidden className="text-[11px] text-[#8AA2BD]">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
            {selectedRevision ? (
              <>
                <dt className="text-[#8AA2BD]">Revision</dt>
                <dd className="text-right font-semibold tabular-nums text-[#315F8A]">
                  {selectedRevision.number} · {selectedRevision.cueCount} cues
                </dd>
              </>
            ) : null}
            <dt className="text-[#8AA2BD]">Created</dt>
            <dd className="text-right font-semibold text-[#315F8A]">
              {dateFormat.format(new Date(selected.createdAt))}
            </dd>
            {selected.origin.model || selected.origin.provider ? (
              <>
                <dt className="text-[#8AA2BD]">Engine</dt>
                <dd className="truncate text-right font-semibold text-[#315F8A]">
                  {selected.origin.model || selected.origin.provider}
                </dd>
              </>
            ) : null}
            {selected.createdBy ? (
              <>
                <dt className="text-[#8AA2BD]">By</dt>
                <dd className="truncate text-right font-semibold text-[#315F8A]">
                  {selected.createdBy}
                </dd>
              </>
            ) : null}
          </dl>

          {selected.status === "PROCESSING" ? (
            <p
              className="mt-3 flex items-center gap-2 rounded-xl border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-2 text-xs text-[#315F8A]"
              role="status"
            >
              <LoaderCircle className="size-3.5 motion-safe:animate-spin" />{" "}
              {jobLabel(selected)}
            </p>
          ) : null}
          {selected.error ? (
            <p
              className="mt-3 rounded-xl border border-[#F2C7C7] bg-[#FFF5F5] px-3 py-2 text-xs leading-5 text-[#8F241E]"
              role="alert"
            >
              {selected.error}
            </p>
          ) : null}

          <div className="mt-3 grid gap-1.5">
            {selected.status === "FAILED" && !selected.revisions.length ? (
              <ActionButton
                busy={busyAction === `retry:${selected.id}`}
                onClick={() => onRetry(selected.id)}
                primary
              >
                <RotateCw /> Retry
              </ActionButton>
            ) : null}
            {isReadyVersion(selected) ? (
              <>
                {isVersionActive(state, selected) ? (
                  <ActionButton
                    busy={busyAction === `track:${selected.language}`}
                    onClick={() => onSetMemberTrack(selected.language, null)}
                  >
                    <EyeOff /> Hide {languageName[selected.language]} from
                    members
                  </ActionButton>
                ) : (
                  <ActionButton
                    busy={busyAction === `track:${selected.language}`}
                    onClick={() =>
                      onSetMemberTrack(selected.language, selected.id)
                    }
                    primary
                  >
                    <Eye /> Show to members
                  </ActionButton>
                )}
                {workspaceMode !== "edit" ? (
                  <ActionButton onClick={() => onEdit(selected.id)}>
                    <PencilLine />{" "}
                    {isManualKind(selected.kind) ? "Edit" : "Correct manually"}
                  </ActionButton>
                ) : null}
                {workspaceMode !== "compare" ? (
                  <ActionButton onClick={() => onCompare(selected.id)}>
                    <Columns2 /> Compare
                  </ActionButton>
                ) : null}
                {selected.language === "ru" ? (
                  <ActionButton onClick={() => onTranslate(selected.id)}>
                    <Languages /> Translate to English
                  </ActionButton>
                ) : null}
                {isManualKind(selected.kind) &&
                selected.revisions.length > 1 ? (
                  <ActionButton onClick={onHistory}>
                    <History /> History & restore
                  </ActionButton>
                ) : null}
                {!isManualKind(selected.kind)
                  ? manualVersionsFrom(state, selected.id)
                      .slice(0, 1)
                      .map((manual) => (
                        <ActionButton
                          key={manual.id}
                          onClick={() => onSelect(manual.id)}
                        >
                          <PencilLine /> Open manual correction
                        </ActionButton>
                      ))
                  : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <footer className="border-t border-[#E8EEF5] px-4 py-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8AA2BD]">
          <Users className="size-3" /> Members see
        </p>
        <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
          {(["ru", "en"] as const).map((language) => {
            const active = findVersion(state, state.activeVersionIds[language]);
            return (
              <div className="contents" key={language}>
                <dt className="text-[#55708F]">{languageName[language]}</dt>
                <dd
                  className={`truncate text-right font-semibold ${active ? "text-[#197A52]" : "text-[#8AA2BD]"}`}
                >
                  {active ? versionName(state, active) : "Hidden"}
                </dd>
              </div>
            );
          })}
        </dl>
      </footer>
    </section>
  );
}
