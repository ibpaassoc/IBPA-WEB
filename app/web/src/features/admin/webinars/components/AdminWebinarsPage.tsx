"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileVideo,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select as AdminSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import {
  getImportOptions,
  importWebinarRecording,
  listWebinars,
  syncZoomRecordings,
} from "../server/webinar.repository";
import type {
  AdminWebinar,
  WebinarImportOption,
  WebinarListResponse,
  WebinarStatus,
} from "../types/webinar.types";
import {
  formatDuration,
  formatFileSize,
  formatWebinarDate,
  getWebinarMp4Size,
  getWebinarMp4Types,
  webinarStatusLabel,
} from "../utils/webinar-formatters";

const PAGE_SIZE = 20;

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  return { from: dateInputValue(from), to: dateInputValue(to) };
}

const statusTone: Record<
  WebinarStatus,
  "neutral" | "info" | "success" | "danger"
> = {
  AVAILABLE: "info",
  IMPORTING: "neutral",
  IMPORTED: "success",
  FAILED: "danger",
};

export function AdminWebinarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [defaults] = useState(defaultDateRange);
  const from = searchParams.get("from") || defaults.from;
  const to = searchParams.get("to") || defaults.to;
  const status = searchParams.get("status") || "all";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const committedQuery = searchParams.get("query") || "";
  const [query, setQuery] = useState(committedQuery);
  const [data, setData] = useState<WebinarListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [busyWebinarId, setBusyWebinarId] = useState<string | null>(null);
  const [options, setOptions] = useState<WebinarImportOption[]>([]);
  const [optionWebinar, setOptionWebinar] = useState<AdminWebinar | null>(null);
  const [selectedFileId, setSelectedFileId] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isComposingRef = useRef(false);

  const updateParams = useCallback(
    (
      updates: Record<string, string | null>,
      method: "push" | "replace" = "push",
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all" || (key === "page" && value === "1"))
          next.delete(key);
        else next.set(key, value);
      }
      router[method](
        `/admin/webinars${next.size ? `?${next.toString()}` : ""}`,
        {
          scroll: false,
        },
      );
    },
    [router, searchParams],
  );

  useEffect(() => setQuery(committedQuery), [committedQuery]);

  useEffect(() => {
    if (isComposingRef.current || query === committedQuery) return;
    const timer = window.setTimeout(() => {
      updateParams({ query: query.trim() || null, page: null }, "replace");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [committedQuery, query, updateParams]);

  const apiSearch = useMemo(() => {
    const params = new URLSearchParams({
      from,
      to,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (status !== "all") params.set("status", status);
    if (committedQuery) params.set("query", committedQuery);
    return `?${params.toString()}`;
  }, [committedQuery, from, page, status, to]);

  const load = useCallback(
    async (options: { silent?: boolean; signal?: AbortSignal } = {}) => {
      if (!options.silent) setIsLoading(true);
      try {
        const result = await listWebinars(apiSearch, options.signal);
        setData(result);
        setError(null);
      } catch (loadError) {
        if (options.signal?.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load webinars.",
        );
      } finally {
        if (!options.signal?.aborted) setIsLoading(false);
      }
    },
    [apiSearch],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!data?.items.some((item) => item.status === "IMPORTING")) return;
    const interval = window.setInterval(
      () => void load({ silent: true }),
      4_000,
    );
    return () => window.clearInterval(interval);
  }, [data?.items, load]);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await syncZoomRecordings({ from, to });
      toast.success(
        result.discovered
          ? `Zoom sync complete: ${result.created} new, ${result.updated} updated.`
          : "Zoom sync complete. No recordings found in this range.",
      );
      await load({ silent: true });
    } catch (syncError) {
      const message =
        syncError instanceof Error
          ? syncError.message
          : "Could not sync Zoom recordings.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  };

  const startImport = async (
    webinar: AdminWebinar,
    recordingFileId: string,
  ) => {
    setBusyWebinarId(webinar.id);
    setError(null);
    try {
      await importWebinarRecording(webinar.id, recordingFileId);
      setOptionWebinar(null);
      toast.success(
        "Recording import started. You can keep working while it transfers to R2.",
      );
      await load({ silent: true });
    } catch (importError) {
      const message =
        importError instanceof Error
          ? importError.message
          : "Could not start the import.";
      setError(message);
      toast.error(message);
    } finally {
      setBusyWebinarId(null);
    }
  };

  const inspectImport = async (webinar: AdminWebinar) => {
    setBusyWebinarId(webinar.id);
    setError(null);
    try {
      const result = await getImportOptions(webinar.id);
      if (!result.files.length) {
        throw new Error(
          "Zoom did not return a completed MP4 for this recording.",
        );
      }
      if (result.files.length === 1) {
        await startImport(webinar, result.files[0].id);
        return;
      }
      setOptions(result.files);
      setSelectedFileId(result.files[0].id);
      setOptionWebinar(webinar);
    } catch (inspectError) {
      const message =
        inspectError instanceof Error
          ? inspectError.message
          : "Could not inspect the recording.";
      setError(message);
      toast.error(message);
    } finally {
      setBusyWebinarId(null);
    }
  };

  const clearFilters = () => {
    setQuery("");
    router.push("/admin/webinars", { scroll: false });
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateParams({ query: query.trim() || null, page: null });
  };

  const items = data?.items || [];
  const firstItem = data?.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = data?.total ? Math.min(page * PAGE_SIZE, data.total) : 0;

  return (
    <>
      <AdminPageShell
        actions={
          <Button
            aria-busy={isSyncing}
            className="h-10 min-w-32 rounded-2xl bg-[#21466D] px-5 text-white hover:bg-[#0B1F44]"
            disabled={isSyncing}
            onClick={() => void handleSync()}
            type="button"
          >
            <RefreshCw
              className={isSyncing ? "motion-safe:animate-spin" : ""}
              data-icon="inline-start"
            />
            {isSyncing ? "Syncing…" : "Sync Zoom"}
          </Button>
        }
        eyebrow="Content library"
        subtitle="Bring completed Zoom cloud recordings into private R2 storage and prepare subtitle tracks."
        title="Webinars"
      >
        <section className="rounded-[28px] border border-[#D4E0F0] bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
          <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_auto_auto_auto] xl:items-end">
            <form className="min-w-0" noValidate onSubmit={submitSearch}>
              <label
                className="mb-1.5 block text-xs font-semibold text-[#55708F]"
                htmlFor="webinar-search"
              >
                Search recordings
              </label>
              <div className="relative">
                <Search
                  aria-hidden
                  className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8AA2BD]"
                />
                <Input
                  ref={searchInputRef}
                  className="h-10 rounded-2xl border-[#D4E0F0] bg-[#F8FBFF] pl-10 pr-10 text-sm text-[#0B1F44] placeholder:text-[#8AA2BD] focus-visible:border-[#21466D] focus-visible:ring-[#21466D]/15"
                  id="webinar-search"
                  onChange={(event) => setQuery(event.target.value)}
                  onCompositionEnd={(event) => {
                    isComposingRef.current = false;
                    setQuery(event.currentTarget.value);
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  placeholder="Search by webinar title"
                  type="search"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label="Clear webinar search"
                    className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-[#6C7F95] transition hover:bg-[#E7F0FA] hover:text-[#0B1F44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D]"
                    onClick={() => {
                      setQuery("");
                      updateParams({ query: null, page: null }, "replace");
                      searchInputRef.current?.focus();
                    }}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            </form>

            <div className="grid grid-cols-2 gap-2">
              {/* Native English date pickers are the documented admin filter owner. */}
              <label
                className="text-xs font-semibold text-[#55708F]"
                htmlFor="webinar-from"
              >
                From
                <Input
                  className="mt-1.5 h-10 min-w-36 rounded-2xl border-[#D4E0F0] bg-[#F8FBFF] text-sm text-[#0B1F44]"
                  id="webinar-from"
                  max={to}
                  onChange={(event) =>
                    updateParams({ from: event.target.value, page: null })
                  }
                  type="date"
                  value={from}
                />
              </label>
              <label
                className="text-xs font-semibold text-[#55708F]"
                htmlFor="webinar-to"
              >
                To
                <Input
                  className="mt-1.5 h-10 min-w-36 rounded-2xl border-[#D4E0F0] bg-[#F8FBFF] text-sm text-[#0B1F44]"
                  id="webinar-to"
                  min={from}
                  onChange={(event) =>
                    updateParams({ to: event.target.value, page: null })
                  }
                  type="date"
                  value={to}
                />
              </label>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-semibold text-[#55708F]"
                id="webinar-status-label"
              >
                Import status
              </label>
              <AdminSelect
                onValueChange={(value) =>
                  updateParams({ status: value, page: null })
                }
                value={status}
              >
                <SelectTrigger
                  aria-labelledby="webinar-status-label"
                  className="h-10 w-full min-w-40 rounded-2xl border-[#D4E0F0] bg-[#F8FBFF] text-[#0B1F44]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="min-w-[var(--radix-select-trigger-width)] rounded-2xl border border-[#D4E0F0]"
                >
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IMPORTING">Importing</SelectItem>
                  <SelectItem value="IMPORTED">Imported</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </AdminSelect>
            </div>

            <Button
              className="h-10 rounded-2xl px-4 text-[#21466D] hover:bg-[#EEF6FF]"
              onClick={clearFilters}
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          </div>
        </section>

        {error && data ? (
          <div
            className="flex items-start gap-3 rounded-[22px] border border-[#F2C7C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#8F241E]"
            role="alert"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Webinar action failed</p>
              <p className="mt-0.5 leading-5">{error}</p>
            </div>
            <Button
              className="h-8 rounded-xl"
              onClick={() => void load()}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-white shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
          <div className="flex min-h-14 items-center justify-between border-b border-[#D4E0F0] px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1F44]">
              <CalendarRange className="size-4 text-[#21466D]" />
              Cloud recordings
            </div>
            <p
              className="text-xs tabular-nums text-[#6C7F95]"
              aria-live="polite"
            >
              {data
                ? `${firstItem}–${lastItem} of ${data.total}`
                : isLoading
                  ? "Loading recordings"
                  : "Recordings unavailable"}
            </p>
          </div>

          {isLoading && !data ? (
            <div
              className="flex min-h-72 items-center justify-center text-[#55708F]"
              role="status"
            >
              <LoaderCircle className="mr-2 size-5 motion-safe:animate-spin" />
              Loading recordings…
            </div>
          ) : error && !data ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
              <CircleAlert className="size-7 text-[#B42318]" />
              <h2 className="mt-3 font-semibold text-[#0B1F44]">
                Recordings could not be loaded
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-[#6C7F95]">
                {error} Check the webinar service configuration or migration,
                then retry this request.
              </p>
              <Button
                className="mt-4 h-9 rounded-xl"
                onClick={() => void load()}
                type="button"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          ) : !items.length ? (
            <div className="p-5">
              <AdminEmptyState
                actionLabel={
                  committedQuery || status !== "all"
                    ? "Clear filters"
                    : "Sync Zoom"
                }
                description={
                  committedQuery || status !== "all"
                    ? "No webinars match the current filters."
                    : "Sync a date range to load completed Zoom cloud recordings."
                }
                icon={FileVideo}
                onAction={
                  committedQuery || status !== "all"
                    ? clearFilters
                    : () => void handleSync()
                }
                title={
                  committedQuery || status !== "all"
                    ? "No matching webinars"
                    : "No webinars synced yet"
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto [scrollbar-gutter:stable]">
              <Table>
                <caption className="sr-only">
                  Completed Zoom cloud recordings available for webinar import
                </caption>
                <TableHeader className="bg-[#F6FAFF]">
                  <TableRow className="border-b-[#D4E0F0] hover:bg-transparent">
                    {[
                      "Webinar",
                      "Recording",
                      "Host",
                      "MP4 available",
                      "Transcript",
                      "Status",
                      "",
                    ].map((label) => (
                      <TableHead
                        className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6C7F95]"
                        key={label || "actions"}
                      >
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((webinar) => {
                    const types = getWebinarMp4Types(webinar);
                    const busy = busyWebinarId === webinar.id;
                    return (
                      <TableRow
                        className="border-b-[#E4EEF8] align-top hover:bg-[#F8FBFF]"
                        key={webinar.id}
                      >
                        <TableCell className="min-w-64 py-4">
                          <Link
                            className="font-semibold text-[#0B1F44] hover:text-[#21466D] hover:underline"
                            href={`/admin/webinars/${webinar.id}`}
                          >
                            {webinar.title}
                          </Link>
                          <p className="mt-1 text-xs tabular-nums text-[#8AA2BD]">
                            Zoom {webinar.zoomMeetingId}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-44 py-4 text-sm text-[#315F8A]">
                          <p>{formatWebinarDate(webinar.recordedAt)}</p>
                          <p className="mt-1 tabular-nums text-xs text-[#6C7F95]">
                            {formatDuration(webinar.durationSeconds)}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-48 py-4 text-sm text-[#315F8A]">
                          <span className="break-all">
                            {webinar.zoomMetadata.hostEmail || "Unknown host"}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-44 py-4 text-sm text-[#315F8A]">
                          <p className="max-w-56 capitalize">
                            {types.length
                              ? types.join(", ")
                              : "No completed MP4"}
                          </p>
                          <p className="mt-1 text-xs tabular-nums text-[#6C7F95]">
                            {formatFileSize(getWebinarMp4Size(webinar))}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 text-sm text-[#315F8A]">
                          {webinar.transcriptStatus === "NOT_AVAILABLE"
                            ? "No VTT"
                            : "Zoom VTT"}
                        </TableCell>
                        <TableCell className="py-4">
                          <AdminStatusBadge tone={statusTone[webinar.status]}>
                            {webinar.status === "IMPORTING" ? (
                              <LoaderCircle className="size-3 motion-safe:animate-spin" />
                            ) : null}
                            {webinarStatusLabel(webinar.status)}
                          </AdminStatusBadge>
                          {webinar.status === "IMPORTED" ? (
                            <AdminStatusBadge
                              className="mt-1.5"
                              tone={
                                webinar.publicationStatus === "PUBLISHED"
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {webinar.publicationStatus === "PUBLISHED"
                                ? "Published"
                                : "Draft"}
                            </AdminStatusBadge>
                          ) : null}
                          {webinar.status === "FAILED" &&
                          webinar.zoomMetadata.importError ? (
                            <p className="mt-1.5 max-w-56 text-xs leading-4 text-[#B42318]">
                              {webinar.zoomMetadata.importError}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {webinar.status === "IMPORTED" ? (
                            <Link
                              className={buttonVariants({
                                className: "h-9 rounded-xl text-[#21466D]",
                                variant: "outline",
                              })}
                              href={`/admin/webinars/${webinar.id}`}
                            >
                              Open <ExternalLink data-icon="inline-end" />
                            </Link>
                          ) : (
                            <Button
                              aria-busy={busy}
                              className="h-9 min-w-24 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
                              disabled={
                                busy ||
                                webinar.status === "IMPORTING" ||
                                !types.length
                              }
                              onClick={() => void inspectImport(webinar)}
                              type="button"
                            >
                              {busy ? (
                                <LoaderCircle className="motion-safe:animate-spin" />
                              ) : null}
                              {webinar.status === "FAILED"
                                ? "Retry import"
                                : "Import"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <nav
            aria-label="Webinar pagination"
            className="flex min-h-16 items-center justify-between border-t border-[#D4E0F0] px-5"
          >
            <p className="text-xs text-[#6C7F95]">20 recordings per page</p>
            <div className="flex items-center gap-2">
              <Button
                aria-label="Previous webinar page"
                className="size-9 rounded-xl"
                disabled={page <= 1 || isLoading}
                onClick={() => updateParams({ page: String(page - 1) })}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-20 text-center text-xs tabular-nums text-[#315F8A]">
                Page {page} of {data?.pageCount || 1}
              </span>
              <Button
                aria-label="Next webinar page"
                className="size-9 rounded-xl"
                disabled={page >= (data?.pageCount || 1) || isLoading}
                onClick={() => updateParams({ page: String(page + 1) })}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronRight />
              </Button>
            </div>
          </nav>
        </section>
      </AdminPageShell>

      <Dialog
        open={Boolean(optionWebinar)}
        onOpenChange={(open) => !open && setOptionWebinar(null)}
      >
        <DialogContent className="max-h-[min(640px,calc(100dvh-2rem))] max-w-xl overflow-y-auto rounded-[28px] border border-[#D4E0F0] p-6">
          <DialogTitle className="text-xl font-semibold text-[#0B1F44]">
            Choose a Zoom recording
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#6C7F95]">
            Zoom created multiple useful MP4 versions for “
            {optionWebinar?.title}.” Choose the rendition to store in R2.
          </DialogDescription>
          <div className="mt-2 space-y-2">
            {options.map((option) => (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  selectedFileId === option.id
                    ? "border-[#21466D] bg-[#EEF6FF]"
                    : "border-[#D4E0F0] bg-white hover:bg-[#F8FBFF]"
                }`}
                key={option.id}
              >
                <input
                  checked={selectedFileId === option.id}
                  className="mt-1 accent-[#21466D]"
                  name="zoom-recording-file"
                  onChange={() => setSelectedFileId(option.id)}
                  type="radio"
                />
                <span className="min-w-0">
                  <span className="block font-semibold capitalize text-[#0B1F44]">
                    {option.recordingType.replaceAll("_", " ")}
                  </span>
                  <span className="mt-1 block text-xs tabular-nums text-[#6C7F95]">
                    {formatFileSize(option.fileSize)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              className="h-10 rounded-xl"
              onClick={() => setOptionWebinar(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="h-10 min-w-36 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
              disabled={
                !optionWebinar ||
                !selectedFileId ||
                busyWebinarId === optionWebinar.id
              }
              onClick={() =>
                optionWebinar && void startImport(optionWebinar, selectedFileId)
              }
              type="button"
            >
              Import recording
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
