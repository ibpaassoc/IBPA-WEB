"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { 
  Users, 
  Sparkles, 
  Search, 
  Trash2, 
  Loader2, 
  X, 
  Printer, 
  Mail, 
  ShieldAlert, 
  Key, 
  Copy, 
  FileText, 
  ChevronRight,
  CheckCircle2,
  Upload,
  Undo2
} from "lucide-react";
import { AdminCardsResponse, AdminClient } from "@/lib/admin-types";
import { toast } from "sonner";
import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { formatApplicationValue, getApplicationFieldLabel } from "@/lib/application-fields";

const CLIENTS_PAGE_SIZE = 20;

function getSubscriptionStatus(expiresAt?: string | null) {
  if (!expiresAt) {
     return { label: "Active (No expiration)", colorClass: "bg-green-50 text-green-600 border-green-100/50" };
  }
  const expDate = new Date(expiresAt);
  const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Expired", colorClass: "bg-red-50 text-red-600 border-red-100/50" };
  } else if (diffDays <= 30) {
    return { label: "Expiring soon", colorClass: "bg-orange-50 text-orange-600 border-orange-100/50" };
  } else {
    return { label: "Active", colorClass: "bg-green-50 text-green-600 border-green-100/50" };
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"manage" | "profile">("manage");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState(0);
  const [hasMoreClients, setHasMoreClients] = useState(false);
  const [pendingCertificateUrl, setPendingCertificateUrl] = useState<string | null>(null);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [isRemovingCertificate, setIsRemovingCertificate] = useState(false);

  const readErrorMessage = async (resp: Response) => {
    try {
      const data = await resp.json();
      if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
        return data.error;
      }
    } catch {
      try {
        const text = await resp.text();
        if (text) return text;
      } catch {}
    }

    return "Could not complete the request.";
  };

  const fetchClients = useCallback(async ({
    silent = false,
    append = false,
    offset = 0,
    limit,
  }: { silent?: boolean; append?: boolean; offset?: number; limit?: number } = {}) => {
    if (append) {
      setIsLoadingMore(true);
    } else if (!silent) {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(limit ?? CLIENTS_PAGE_SIZE),
        offset: String(offset),
      });

      const query = debouncedSearchQuery.trim();
      if (query) {
        params.set("q", query);
      }

      const resp = await fetch(`/api/cards?${params.toString()}`, { cache: "no-store" });
      const data = (await resp.json()) as AdminCardsResponse | { error?: string };

      if (!resp.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Could not load clients.";
        throw new Error(message);
      }

      if (!data || !Array.isArray((data as AdminCardsResponse).items)) {
        throw new Error("The server returned an invalid client list format.");
      }

      const listData = data as AdminCardsResponse;
      setClients((prev) => append ? [...prev, ...listData.items] : listData.items);
      setTotalClients(Number(listData.total) || 0);
      setHasMoreClients(Boolean(listData.hasMore));
      setLastSyncedAt(new Date().toISOString());
    } catch (error: any) {
      console.error("[fetchClients] Client-side fetch failed:", error, { name: error?.name, message: error?.message });
      if (!silent) {
        setClients([]);
        setTotalClients(0);
        setHasMoreClients(false);
        toast.error(`Failed to load clients: ${error?.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchClients({ silent: true, limit: Math.max(CLIENTS_PAGE_SIZE, clients.length) });
    }, 30000);

    const handleFocus = () => {
      void fetchClients({ silent: true, limit: Math.max(CLIENTS_PAGE_SIZE, clients.length) });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchClients({ silent: true, limit: Math.max(CLIENTS_PAGE_SIZE, clients.length) });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchClients, clients.length]);

  const handleLoadMore = () => {
    void fetchClients({ append: true, offset: clients.length });
  };

  const handleOpenClient = async (client: AdminClient) => {
    setSelectedClient(client);
    setActiveTab("manage");
    setPendingCertificateUrl(null);
    setIsLoadingDetail(true);

    try {
      const resp = await fetch(`/api/cards/${client.id}`, { cache: "no-store" });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Could not load client details.");
      }
      setSelectedClient(data as AdminClient);
    } catch (error) {
      console.error("Failed to load client detail", error);
      toast.error(error instanceof Error ? error.message : "Failed to load client details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCertificateUpload = async (orderId: string, url: string) => {
    setPendingCertificateUrl(url);
    toast.success("File uploaded. Review and confirm saving.");
  };

  const handleCertificateSave = async (orderId: string) => {
    if (!pendingCertificateUrl) return;

    setIsSavingCertificate(true);
    try {
      const resp = await fetch(`/api/admin/orders/${orderId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pendingCertificateUrl }),
      });
      if (resp.ok) {
        toast.success("Certificate confirmed and saved.");
        setClients(prev => prev.map(c => c.id === orderId ? { ...c, certificateUrl: pendingCertificateUrl } : c));
        if (selectedClient && selectedClient.id === orderId) {
          setSelectedClient({ ...selectedClient, certificateUrl: pendingCertificateUrl });
        }
        setPendingCertificateUrl(null);
      } else {
        const message = await readErrorMessage(resp);
        toast.error(message);
      }
    } catch (e) {
      toast.error("Failed to save certificate.");
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const handleRemoveCertificate = async (orderId: string) => {
    if (!window.confirm("Remove the current certificate and make room for a new file?")) return;

    setIsRemovingCertificate(true);
    try {
      const resp = await fetch(`/api/admin/orders/${orderId}/certificate`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const message = await readErrorMessage(resp);
        toast.error(message);
        return;
      }

      setClients(prev => prev.map(c => c.id === orderId ? { ...c, certificateUrl: null } : c));
      if (selectedClient && selectedClient.id === orderId) {
        setSelectedClient({ ...selectedClient, certificateUrl: null });
      }
      setPendingCertificateUrl(null);
      toast.success("Certificate removed. You can upload a new file.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove certificate.");
    } finally {
      setIsRemovingCertificate(false);
    }
  };

  const handleResendPdf = async (orderId: string) => {
    setIsResending(orderId);
    try {
      const resp = await fetch(`/api/admin/orders/${orderId}/resend-pdf`, {
        method: "POST",
      });
      if (resp.ok) {
        toast.success("Certificate email sent successfully.");
      } else {
        const errorData = await resp.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to send email.");
      }
    } catch (e) {
      toast.error("Network error while sending email.");
    } finally {
      setIsResending(null);
    }
  };

  const handleDelete = async (clientId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;

    setIsDeleting(clientId);
    try {
      const resp = await fetch(`/api/admin/orders/${clientId}`, { method: "DELETE" });
      if (resp.ok) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setTotalClients((prev) => Math.max(prev - 1, 0));
        if (selectedClient?.id === clientId) setSelectedClient(null);
        toast.success("Client deleted.");
      } else {
        const message = await readErrorMessage(resp);
        toast.error(message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied.");
  };

  // Helper to parse questionnaire data (payload might be stored in applicationPayload)
  const getQuestionnaireData = (payload: any) => {
    if (!payload) return [];
    let data = payload;
    if (typeof payload === 'string') {
      try { data = JSON.parse(payload); } catch { return []; }
    }
    return Object.entries(data)
      .map(([key, value]) => ({
        label: getApplicationFieldLabel(key),
        value: formatApplicationValue(key, value)
      }))
      .filter(item => item.value);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-9">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Clients</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-light">Approved and paid association members</p>
          {lastSyncedAt && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
        
        <div className="relative max-w-md w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or certificate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#72A0C1]/20 focus:border-[#72A0C1] transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-[24px] border border-slate-100 bg-white p-4 lg:p-5 shadow-sm">
              <div className="flex animate-pulse flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-slate-100" />
                  <div className="space-y-3">
                    <div className="h-4 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-24 rounded-full bg-slate-100" />
                  <div className="h-8 w-28 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">The list is empty</h3>
          <p className="text-slate-500 mt-2">Clients will appear here after successful membership payment.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => void handleOpenClient(client)}
              className="group cursor-pointer rounded-[24px] border border-slate-100 bg-white p-4 lg:p-5 shadow-sm transition-all hover:border-[#72A0C1]/30 hover:shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#72A0C1]/10 text-[#72A0C1] font-bold">
                    {client.userName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 lg:text-base">{client.userName}</h3>
                    <p className="text-xs text-slate-400 lg:text-sm">{client.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Category</span>
                    <span className="text-xs font-medium text-slate-600 lg:text-sm">{client.cardName || "Professional"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Certificate</span>
                    <span className="text-xs font-mono font-bold text-[#72A0C1] lg:text-sm">{client.certificateNumber}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Status</span>
                    <span className={`px-2 py-0.5 mt-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${getSubscriptionStatus(client.expiresAt).colorClass}`}>
                      {getSubscriptionStatus(client.expiresAt).label}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(client.id, e)}
                    disabled={isDeleting === client.id}
                    className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    {isDeleting === client.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {hasMoreClients && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-[#72A0C1]/30 hover:text-[#4C7D9D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoadingMore ? "Loading..." : `Load more (${clients.length} of ${totalClients})`}
            </button>
          )}
        </div>
      )}

      {/* CLIENT PROFILE MODAL */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[800px] h-[600px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={() => { setSelectedClient(null); setPendingCertificateUrl(null); }}
              className="absolute right-8 top-8 z-10 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* HEADER */}
            <header className="p-8 md:p-10 pb-4">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#B9D9EB] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner">
                  {selectedClient.userName[0]?.toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-anton uppercase text-slate-900 tracking-tight">{selectedClient.userName}</h2>
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${getSubscriptionStatus(selectedClient.expiresAt).colorClass}`}>
                      {getSubscriptionStatus(selectedClient.expiresAt).label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                    {selectedClient.cardName || "Professional Membership"}
                  </p>
                </div>
              </div>

              {/* TABS */}
              <div className="flex gap-8 mt-8 border-b border-slate-100">
                <button
                  onClick={() => setActiveTab("manage")}
                  className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${
                    activeTab === "manage" ? "text-slate-900 border-slate-900" : "text-slate-300 border-transparent hover:text-slate-500"
                  }`}
                >
                  Manage
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${
                    activeTab === "profile" ? "text-slate-900 border-slate-900" : "text-slate-300 border-transparent hover:text-slate-500"
                  }`}
                >
                  Application
                </button>
              </div>
            </header>

            {/* CONTENT */}
            <div className="flex-grow overflow-hidden relative">
              {isLoadingDetail && (
                <div className="absolute inset-x-8 top-2 z-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400 shadow-sm backdrop-blur">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading full client details
                </div>
              )}
              {activeTab === "manage" ? (
                <div className="p-8 md:p-10 pt-4 grid grid-cols-2 gap-6 h-full content-start">
                  {/* CARD 1: CERTIFICATE */}
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-slate-400 mb-4">
                        <Printer size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Certificate</span>
                      </div>
                      <p className="font-mono text-lg font-black text-slate-900 leading-none">
                        {selectedClient.certificateNumber || "NOT ISSUED"}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-slate-400">Issued: {new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                        {selectedClient.expiresAt && (
                          <p className="text-[11px] font-medium text-slate-500">
                            Valid until: {new Date(selectedClient.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedClient.certificateUrl ? (
                      <div className="mt-4 space-y-3">
                        <a href={selectedClient.certificateUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all">
                          <FileText size={14} /> Open PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertificate(selectedClient.id)}
                          disabled={isRemovingCertificate}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 disabled:opacity-60"
                        >
                          {isRemovingCertificate ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Remove PDF
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {!pendingCertificateUrl ? (
                          <AdminUploadZone
                            endpoint="certificateUploader"
                            accept=".pdf,application/pdf"
                            label="Upload certificate PDF"
                            helperText="The file will not be saved automatically. Confirm the attachment first."
                            buttonText="Choose file"
                            onUploaded={(url) => handleCertificateUpload(selectedClient.id, url)}
                            onError={(message) => toast.error(`Upload failed: ${message}`)}
                          />
                        ) : (
                          <div className="rounded-[20px] border border-[#72A0C1]/20 bg-white p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-full bg-[#72A0C1]/10 p-2 text-[#72A0C1]">
                                <Upload size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800">File uploaded but not attached yet</p>
                                <p className="mt-1 break-all text-xs leading-relaxed text-slate-500">{pendingCertificateUrl}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                              <button
                                type="button"
                                onClick={() => handleCertificateSave(selectedClient.id)}
                                disabled={isSavingCertificate}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:opacity-60"
                              >
                                {isSavingCertificate ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingCertificateUrl(null)}
                                disabled={isSavingCertificate}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-60"
                              >
                                <Undo2 size={14} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CARD 2: CONTACTS */}
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-400 mb-6">
                      <Mail size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Contacts</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="truncate pr-4">
                          <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Email</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{selectedClient.email}</p>
                        </div>
                        <button onClick={() => handleCopy(selectedClient.email)} className="p-2 bg-white rounded-lg text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                         <div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Phone</p>
                            <p className="text-sm font-bold text-slate-700">{selectedClient.phone || (selectedClient.applicationPayload as any)?.phone || "Not provided"}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: CLERK ACCESS */}
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-slate-400 mb-4">
                        <Key size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard Access</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {selectedClient.hasDashboardAccess ? "Connected" : "Pending member sign-in"}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {selectedClient.hasDashboardAccess
                          ? "This client already has a linked personal cabinet, so the public directory can use their profile data."
                          : "The client is paid and valid for admin work, but their public profile will appear only after they sign in with the same email and create the linked personal cabinet."}
                      </p>
                    </div>
                  </div>

                  {/* CARD 4: ACTIONS */}
                  <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-400 mb-4">
                      <ShieldAlert size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Admin Actions</span>
                    </div>
                    <div className="space-y-3 mt-auto">
                       <button 
                         onClick={() => handleResendPdf(selectedClient.id)}
                         disabled={isResending === selectedClient.id || !selectedClient.certificateUrl}
                         className="flex w-full items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#72A0C1] disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
                       >
                         {isResending === selectedClient.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                         Send PDF by email
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 md:p-10 pt-4 h-full overflow-y-auto custom-scrollbar space-y-8">
                  {/* Public Profile Section */}
                  {(selectedClient.bio || selectedClient.instagramUrl || selectedClient.specialization || selectedClient.country) && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center gap-2">
                        <Sparkles size={16} className="text-[#72A0C1]" /> Public Profile
                      </h3>
                      <div className="grid gap-6 sm:grid-cols-2 bg-[#F8FAFC] border border-slate-100 rounded-3xl p-6">
                        {selectedClient.country && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Location</p>
                            <p className="text-sm font-medium text-slate-700">{selectedClient.country}{selectedClient.city ? `, ${selectedClient.city}` : ""}</p>
                          </div>
                        )}
                        {selectedClient.specialization && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Specialization</p>
                            <p className="text-sm font-medium text-slate-700">{selectedClient.specialization}</p>
                          </div>
                        )}
                        {selectedClient.experienceYears && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Experience</p>
                            <p className="text-sm font-medium text-slate-700">{selectedClient.experienceYears} years</p>
                          </div>
                        )}
                        {selectedClient.instagramUrl && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Instagram</p>
                            <a href={selectedClient.instagramUrl.startsWith('http') ? selectedClient.instagramUrl : `https://${selectedClient.instagramUrl}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#72A0C1] hover:underline">
                              {selectedClient.instagramUrl.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}
                            </a>
                          </div>
                        )}
                        {selectedClient.education && (
                          <div className="space-y-1 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Education / Certificates</p>
                            <p className="text-sm font-medium text-slate-700">{selectedClient.education}</p>
                          </div>
                        )}
                        {selectedClient.bio && (
                          <div className="space-y-1 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">About (Bio)</p>
                            <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedClient.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Application Payload Section */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center gap-2">
                       <FileText size={16} className="text-[#72A0C1]" /> Original Application
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {(selectedClient as any).applicationPayload ? (
                        getQuestionnaireData((selectedClient as any).applicationPayload).map((item) => (
                          <div key={item.label} className="space-y-1 py-3 border-b border-slate-50">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">
                              {item.label}
                            </p>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed break-words">
                              {item.value}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-10 text-center text-slate-400 font-serif italic">
                           Application data from registration is not available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </main>
  );
}
