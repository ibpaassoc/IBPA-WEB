"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Info,
  Loader2,
  Mail,
  Search,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AdminPartnerApplication,
  AdminPartnerApplicationsResponse,
  AdminPartnerApplicationsSummary,
  PartnerApplicationStatus,
  PartnerPaymentStatus,
} from "@/lib/admin-types";

const DEFAULT_SUMMARY: AdminPartnerApplicationsSummary = {
  all: 0,
  pending: 0,
  approved: 0,
  submitted: 0,
  rejected: 0,
  paid: 0,
};

const PAGE_SIZE = 20;
const APPROVAL_TIERS = ["Associate", "Community", "Premier"] as const;

const STATUS_OPTIONS: Array<{ value: "all" | PartnerApplicationStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "REJECTED", label: "Rejected" },
];

function UnifiedStatusBadge({ status, paymentStatus }: { status: PartnerApplicationStatus; paymentStatus: PartnerPaymentStatus }) {
  if (paymentStatus === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Paid
      </span>
    );
  }

  const styles = {
    PENDING: "bg-orange-50 text-orange-600 border-orange-100",
    APPROVED: "bg-blue-50 text-blue-600 border-blue-100",
    SUBMITTED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
  } as const;

  const labels = {
    PENDING: "Pending",
    APPROVED: "Approved",
    SUBMITTED: "Submitted",
    REJECTED: "Rejected",
  } as const;

  const icon = {
    PENDING: <Clock3 className="h-3 w-3" />,
    APPROVED: <ExternalLink className="h-3 w-3" />,
    SUBMITTED: <CheckCircle2 className="h-3 w-3" />,
    REJECTED: <XCircle className="h-3 w-3" />,
  } as const;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {icon[status]}
      {labels[status]}
    </span>
  );
}

export default function PartnerApplicationsPage() {
  const [items, setItems] = useState<AdminPartnerApplication[]>([]);
  const [summary, setSummary] = useState<AdminPartnerApplicationsSummary>(DEFAULT_SUMMARY);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selected, setSelected] = useState<AdminPartnerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | PartnerApplicationStatus>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvalTier, setApprovalTier] = useState<string>("Associate");
  const latestDetailRequestRef = useRef(0);

  const fetchItems = useCallback(
    async ({ append = false, offset = 0 }: { append?: boolean; offset?: number } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (debouncedSearch.trim()) {
          params.set("q", debouncedSearch.trim());
        }

        const resp = await fetch(`/api/admin/partner-applications?${params.toString()}`, { cache: "no-store" });
        const data = (await resp.json()) as AdminPartnerApplicationsResponse | { error?: string };

        if (!resp.ok) {
          throw new Error(typeof data === "object" && data && "error" in data ? data.error || "Failed to load partner applications." : "Failed to load partner applications.");
        }

        const listData = data as AdminPartnerApplicationsResponse;
        const incomingItems = Array.isArray(listData.items) ? listData.items : [];

        setItems((previous) => (append ? [...previous, ...incomingItems] : incomingItems));
        setSummary(listData.summary || DEFAULT_SUMMARY);
        setTotal(Number(listData.total) || 0);
        setHasMore(Boolean(listData.hasMore));
        setLastSyncedAt(new Date().toISOString());

      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load partner applications.");
        if (!append) {
          setItems([]);
          setSummary(DEFAULT_SUMMARY);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (selected?.requestedTier) {
      setApprovalTier(selected.requestedTier);
    } else {
      setApprovalTier("Associate");
    }
  }, [selected?.requestedTier]);

  const openItem = useCallback(async (id: string) => {
    latestDetailRequestRef.current += 1;
    const requestId = latestDetailRequestRef.current;
    setLoadingDetail(true);
    try {
      const resp = await fetch(`/api/admin/partner-applications/${id}`, { cache: "no-store" });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Failed to load partner application detail.");
      }
      if (latestDetailRequestRef.current === requestId) {
        setSelected(data as AdminPartnerApplication);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load partner application detail.");
    } finally {
      if (latestDetailRequestRef.current === requestId) {
        setLoadingDetail(false);
      }
    }
  }, []);

  const closeModal = useCallback(() => {
    latestDetailRequestRef.current += 1;
    setLoadingDetail(false);
    setSelected(null);
  }, []);

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeModal, selected]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    await fetchItems({ append: true, offset: items.length });
  };

  const handleApprove = async () => {
    if (!selected) return;

    setApprovingId(selected.id);
    try {
      const resp = await fetch("/api/admin/partner-applications/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: selected.id, tier: approvalTier }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.error || "Failed to approve partner application.");
      }

      toast.success("Partner application approved and payment link sent.");
      await fetchItems();
      await openItem(selected.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve partner application.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!selected) return;

    setRejectingId(selected.id);
    try {
      const resp = await fetch("/api/admin/partner-applications/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: selected.id }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.error || "Failed to reject partner application.");
      }

      toast.success("Partner application rejected.");
      await fetchItems();
      await openItem(selected.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject partner application.");
    } finally {
      setRejectingId(null);
    }
  };

  const handleDelete = async (applicationId: string, event?: { stopPropagation: () => void }) => {
    if (event) {
      event.stopPropagation();
    }

    if (!window.confirm("Are you sure you want to delete this partner application? This action cannot be undone.")) {
      return;
    }

    setDeletingId(applicationId);
    try {
      const resp = await fetch(`/api/admin/partner-applications/${encodeURIComponent(applicationId)}`, {
        method: "DELETE",
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data?.error || "Failed to delete partner application.");
      }

      if (selected?.id === applicationId) {
        closeModal();
      }

      await fetchItems();
      toast.success("Partner application deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete partner application.");
    } finally {
      setDeletingId(null);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: "Total", value: summary.all },
      { label: "Pending", value: summary.pending },
      { label: "Approved", value: summary.approved },
      { label: "Submitted", value: summary.submitted },
      { label: "Rejected", value: summary.rejected },
      { label: "Paid", value: summary.paid },
    ],
    [summary],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-9">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Partner Applications</h1>
          <p className="mt-1.5 max-w-2xl text-sm font-light text-slate-500">
            Review partnership submissions separately from regular membership applications.
          </p>
          {lastSyncedAt && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-55">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/15"
            />
          </div>

          <div className="relative min-w-47.5">
            <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | PartnerApplicationStatus)}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/15"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-anton lg:text-[1.9rem] text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-sm">
              <div className="flex animate-pulse items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-slate-100" />
                    <div className="h-6 w-24 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <Building2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No partner applications found</h3>
          <p className="mt-2 text-slate-500">Try changing the search query or filters.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => void openItem(item.id)}
              className="group cursor-pointer rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-sm transition-all hover:border-[#72A0C1]/30 hover:shadow-xl"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:bg-[#72A0C1]/5 group-hover:text-[#72A0C1]">
                    <span className="text-lg font-bold">{item.name[0]?.toUpperCase() || "P"}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-400 lg:text-sm">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#72A0C1]/60" />
                          {item.email}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F0F8FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#72A0C1]">
                        {item.requestedTier || "Partner"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Partner
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UnifiedStatusBadge status={item.status} paymentStatus={item.paymentStatus} />
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all group-hover:bg-slate-50 group-hover:text-slate-600">
                    <Info className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={(event) => void handleDelete(item.id, event)}
                    disabled={deletingId === item.id}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Delete application"
                  >
                    {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-[#72A0C1]/30 hover:text-[#4C7D9D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loadingMore ? "Loading..." : `Load more (${items.length} of ${total})`}
            </button>
          )}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[6px]"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[95vh] w-full max-w-4xl overflow-hidden rounded-[36px] border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(event) => void handleDelete(selected.id, event)}
              disabled={deletingId === selected.id}
              className="absolute right-[4.75rem] top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 focus:outline-none"
              title="Delete application"
            >
              {deletingId === selected.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </button>

            <div className="max-h-[95vh] overflow-y-auto p-7 md:p-9">
              {loadingDetail ? (
                <div className="flex h-[280px] items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-3xl uppercase tracking-tight font-anton text-slate-900">{selected.name}</h2>
                      <p className="mt-2 text-sm text-slate-500">{selected.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F0F8FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#72A0C1]">
                          {selected.requestedTier || "Partner"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Partner
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <UnifiedStatusBadge status={selected.status} paymentStatus={selected.paymentStatus} />
                    </div>
                  </header>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Phone</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selected.phone || "Not provided"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Submitted</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(selected.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Message</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selected.message}</p>
                  </div>

                  {(selected.status === "PENDING" || selected.status === "APPROVED") && selected.paymentStatus !== "PAID" && (
                    <div className="space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Approval Tier</span>
                        <select
                          value={approvalTier}
                          onChange={(event) => setApprovalTier(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#72A0C1]"
                        >
                          {APPROVAL_TIERS.map((tier) => (
                            <option key={tier} value={tier}>
                              {tier}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleApprove()}
                        disabled={approvingId === selected.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-60"
                      >
                        {approvingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {approvingId === selected.id ? "Approving..." : "Approve and Send Payment Link"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleReject()}
                        disabled={rejectingId === selected.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
                      >
                        {rejectingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        {rejectingId === selected.id ? "Rejecting..." : "Reject Application"}
                      </button>
                    </div>
                  )}

                  {selected.paymentStatus === "PAID" && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <p className="text-sm font-bold">Payment completed</p>
                      </div>
                      <p className="mt-2 text-xs text-emerald-700">
                        Partner account creation has been completed from Stripe webhook.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {selected.email}</p>
                    <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Updated {new Date(selected.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
