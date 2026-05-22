"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock3, Loader2, Mail, Search, XCircle } from "lucide-react";
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
  rejected: 0,
  paid: 0,
};

const PAGE_SIZE = 20;
const APPROVAL_TIERS = ["Associate", "Community", "Premier"] as const;

function StatusBadge({ status }: { status: PartnerApplicationStatus }) {
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-blue-50 text-blue-700 border-blue-100",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
  } as const;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: PartnerPaymentStatus }) {
  const styles = {
    UNPAID: "bg-slate-100 text-slate-600 border-slate-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-100",
    FAILED: "bg-rose-50 text-rose-700 border-rose-100",
  } as const;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function PartnerApplicationsPage() {
  const [items, setItems] = useState<AdminPartnerApplication[]>([]);
  const [summary, setSummary] = useState<AdminPartnerApplicationsSummary>(DEFAULT_SUMMARY);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selected, setSelected] = useState<AdminPartnerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | PartnerApplicationStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PartnerPaymentStatus>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvalTier, setApprovalTier] = useState<string>("Associate");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: "0",
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (paymentFilter !== "all") {
        params.set("paymentStatus", paymentFilter);
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
      setItems(Array.isArray(listData.items) ? listData.items : []);
      setSummary(listData.summary || DEFAULT_SUMMARY);
      setTotal(Number(listData.total) || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load partner applications.");
      setItems([]);
      setSummary(DEFAULT_SUMMARY);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, paymentFilter, statusFilter]);

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
    setLoadingDetail(true);
    try {
      const resp = await fetch(`/api/admin/partner-applications/${id}`, { cache: "no-store" });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Failed to load partner application detail.");
      }
      setSelected(data as AdminPartnerApplication);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load partner application detail.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

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

  const summaryCards = useMemo(
    () => [
      { label: "Total", value: summary.all },
      { label: "Pending", value: summary.pending },
      { label: "Approved", value: summary.approved },
      { label: "Rejected", value: summary.rejected },
      { label: "Paid", value: summary.paid },
    ],
    [summary],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-9">
      <div className="mb-8">
        <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Partner Applications</h1>
        <p className="mt-1.5 text-sm font-light text-slate-500">
          Review partnership submissions separately from regular membership applications.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 grid gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-[#72A0C1]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | PartnerApplicationStatus)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#72A0C1]"
              >
                <option value="all">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value as "all" | PartnerPaymentStatus)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#72A0C1]"
              >
                <option value="all">All payments</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No partner applications found.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openItem(item.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                    selected?.id === item.id
                      ? "border-[#72A0C1] bg-[#F4F9FC]"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="truncate text-xs text-slate-500">{item.email}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <PaymentBadge status={item.paymentStatus} />
                    <p className="text-[11px] font-semibold text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
              <p className="px-1 pt-1 text-xs text-slate-400">{total} total</p>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          {!selected ? (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center text-center text-slate-400">
              <Building2 className="mb-3 h-7 w-7" />
              <p className="text-sm">Select a partner application to view details.</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex h-full min-h-[340px] items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={selected.status} />
                  <PaymentBadge status={selected.paymentStatus} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.phone || "Not provided"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Requested Tier</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.requestedTier || "Not selected"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Submitted</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Paid At</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selected.paidAt ? new Date(selected.paidAt).toLocaleString() : "Not paid"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Message</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selected.message}</p>
              </div>

              {selected.stripeCheckoutSessionId && (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Stripe Checkout Session</p>
                  <p className="mt-2 break-all text-xs font-medium text-slate-600">{selected.stripeCheckoutSessionId}</p>
                </div>
              )}

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
                    onClick={handleApprove}
                    disabled={approvingId === selected.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-60"
                  >
                    {approvingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {approvingId === selected.id ? "Approving..." : "Approve and Send Payment Link"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
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
                    Partner account creation has been triggered from webhook for this application.
                  </p>
                </div>
              )}

              <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {selected.email}</p>
                <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Updated {new Date(selected.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
