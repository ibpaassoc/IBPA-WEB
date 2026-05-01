"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Newspaper, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminUploadZone } from "@/components/AdminUploadZone";
import { ImageCropperModal } from "@/components/admin/ImageCropperModal";
import type { AdminContentItem } from "@/lib/admin-types";

type ContentType = "news" | "events";

type FormState = {
  id?: string;
  type: ContentType;
  title: string;
  body: string;
  coverImage: string;
  coverAspect: number | null;
  eventAddress: string;
  eventAllDay: boolean;
  eventDate: string;
  eventEndDate: string;
  ctaUrl: string;
  ctaLabel: string;
  isPinned: boolean;
  publishToSite: boolean;
  publishToDashboard: boolean;
};

const emptyForm: FormState = {
  type: "news",
  title: "",
  body: "",
  coverImage: "",
  coverAspect: 16 / 9,
  eventAddress: "",
  eventAllDay: false,
  eventDate: "",
  eventEndDate: "",
  ctaUrl: "",
  ctaLabel: "Open Link",
  isPinned: false,
  publishToSite: true,
  publishToDashboard: false,
};

function normalizeCoverAspect(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 16 / 9;
}

function normalizeForm(value?: Partial<FormState>): FormState {
  return {
    id: value?.id,
    type: value?.type === "events" ? "events" : "news",
    title: value?.title ?? "",
    body: value?.body ?? "",
    coverImage: value?.coverImage ?? "",
    coverAspect: normalizeCoverAspect(value?.coverAspect),
    eventAddress: value?.eventAddress ?? "",
    eventAllDay: Boolean(value?.eventAllDay),
    eventDate: value?.eventDate ?? "",
    eventEndDate: value?.eventEndDate ?? "",
    ctaUrl: value?.ctaUrl ?? "",
    ctaLabel: value?.ctaLabel ?? "Open Link",
    isPinned: Boolean(value?.isPinned),
    publishToSite: value?.publishToSite ?? true,
    publishToDashboard: Boolean(value?.publishToDashboard),
  };
}

function getCoverAspect(item: Pick<AdminContentItem, "coverAspect" | "cover_aspect">) {
  return normalizeCoverAspect(item.coverAspect ?? item.cover_aspect);
}

function formatCoverAspectLabel(value: number | null | undefined) {
  const aspect = normalizeCoverAspect(value);
  if (Math.abs(aspect - 16 / 9) < 0.01) return "16:9";
  if (Math.abs(aspect - 4 / 3) < 0.01) return "4:3";
  if (Math.abs(aspect - 1) < 0.01) return "1:1";
  if (Math.abs(aspect - 3 / 4) < 0.01) return "3:4";
  return aspect.toFixed(2);
}

function buildContentPayload(form: FormState) {
  return {
    ...form,
    coverAspect: normalizeCoverAspect(form.coverAspect),
  };
}

export default function ContentPage() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<ContentType>("news");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cropRequest, setCropRequest] = useState<{
    file: File;
    resolve: (value: { file: File; aspect?: number | null } | null) => void;
  } | null>(null);

  const loadItems = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load content");
      setItems(
        Array.isArray(data.items)
          ? data.items.map((item: AdminContentItem) => ({
              ...item,
              title: item.title ?? "",
              body: item.body ?? "",
              coverImage: item.coverImage ?? "",
              coverAspect: getCoverAspect(item),
              eventAddress: item.eventAddress ?? "",
              eventAllDay: Boolean(item.eventAllDay),
              eventDate: item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 16) : "",
              eventEndDate: item.eventEndDate ? new Date(item.eventEndDate).toISOString().slice(0, 16) : "",
              ctaUrl: item.ctaUrl ?? "",
              ctaLabel: item.ctaLabel ?? "Open Link",
              isPinned: Boolean(item.isPinned),
              publishToSite: Boolean(item.publishToSite),
              publishToDashboard: Boolean(item.publishToDashboard),
            }))
          : [],
      );
      setLastSyncedAt(new Date().toISOString());
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || "Failed to load content");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadItems({ silent: true });
    }, 30000);

    const handleFocus = () => {
      void loadItems({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadItems({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadItems]);

  const filteredItems = useMemo(
    () => items.filter((item) => item.type === filter),
    [filter, items],
  );

  const resetForm = () => setForm(normalizeForm({ ...emptyForm, type: filter }));

  const handleEdit = (item: AdminContentItem) => {
    setForm(normalizeForm({
      id: item.id,
      type: item.type === "events" ? "events" : "news",
      title: item.title ?? "",
      body: item.body ?? "",
      coverImage: item.coverImage ?? "",
      coverAspect: getCoverAspect(item),
      eventAddress: item.eventAddress ?? "",
      eventAllDay: Boolean(item.eventAllDay),
      eventDate: item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 16) : "",
      eventEndDate: item.eventEndDate ? new Date(item.eventEndDate).toISOString().slice(0, 16) : "",
      ctaUrl: item.ctaUrl ?? "",
      ctaLabel: item.ctaLabel ?? "Open Link",
      isPinned: Boolean(item.isPinned),
      publishToSite: Boolean(item.publishToSite),
      publishToDashboard: Boolean(item.publishToDashboard),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required.");
      return;
    }

    if (!form.publishToSite && !form.publishToDashboard) {
      toast.error("Choose at least one publication target.");
      return;
    }

    if (form.type === "events" && form.eventDate && form.eventEndDate) {
      const start = new Date(form.eventDate);
      const end = new Date(form.eventEndDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        toast.error("Please enter valid start and end dates.");
        return;
      }

      if (end.getTime() < start.getTime()) {
        toast.error("End date must be later than the start date.");
        return;
      }
    }

    setSaving(true);
    try {
      const url = form.id ? `/api/admin/content/${form.id}` : "/api/admin/content";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildContentPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save content");

      toast.success(form.id ? "Content updated" : "Content created");
      if (data?.item) {
        const savedItem = data.item as AdminContentItem;
        setItems((prev) => {
          const normalizedItem = {
            ...savedItem,
            coverImage: savedItem.coverImage ?? "",
            coverAspect: getCoverAspect(savedItem),
          };
          const exists = prev.some((item) => item.id === savedItem.id);
          return exists
            ? prev.map((item) => (item.id === savedItem.id ? { ...item, ...normalizedItem } : item))
            : [normalizedItem, ...prev];
        });
      } else {
        await loadItems();
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const prepareCoverImage = useCallback((file: File) => {
    return new Promise<{ file: File; aspect?: number | null } | null>((resolve) => {
      setCropRequest({ file, resolve });
    });
  }, []);

  const handleCropApply = (croppedFile: File, aspect: number) => {
    cropRequest?.resolve({ file: croppedFile, aspect });
    setCropRequest(null);
  };

  const handleCropCancel = () => {
    cropRequest?.resolve(null);
    setCropRequest(null);
  };

  const handleCoverUploaded = async (url: string, aspect?: number | null) => {
    const nextAspect = normalizeCoverAspect(aspect ?? form.coverAspect);

    setForm((prev) => ({
      ...prev,
      coverImage: url,
      coverAspect: nextAspect,
    }));
    setItems((prev) =>
      prev.map((item) =>
        item.id === form.id ? { ...item, coverImage: url, coverAspect: nextAspect } : item,
      ),
    );

    toast.success("Image uploaded. Click Save/Update to publish the new cover ratio.");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this content item?")) return;

    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete content");
      toast.success("Content deleted");
      await loadItems();
      if (form.id === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete content");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-9">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Контент</h1>
          <p className="mt-1.5 text-sm font-light text-slate-500">
            Публикация новостей и событий для сайта и личного кабинета.
          </p>
          {lastSyncedAt && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setFilter("news");
              setForm((prev) => normalizeForm({ ...prev, type: "news" }));
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
              filter === "news" ? "bg-black text-white" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <Newspaper className="h-4 w-4" />
            News
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("events");
              setForm((prev) => normalizeForm({ ...prev, type: "events" }));
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
              filter === "events" ? "bg-black text-white" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Events
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {form.id ? "Edit Content Item" : "Create New Item"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                One cover image, one title, one main text, one CTA link.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ContentType }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                >
                  <option value="news">News</option>
                  <option value="events">Events</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">CTA Button Label</label>
                <input
                  value={form.ctaLabel}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                  placeholder="Open Link"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                placeholder="Headline"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Main Text</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={10}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                placeholder="Main content text..."
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">CTA Link</label>
              <input
                value={form.ctaUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                placeholder="https://..."
              />
            </div>

            {form.type === "events" && (
              <div className="space-y-5">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.eventAllDay}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventAllDay: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
                  />
                  Hide time and use dates only
                </label>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Event Date</label>
                  <input
                    type={form.eventAllDay ? "date" : "datetime-local"}
                    value={form.eventDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">End Date</label>
                  <input
                    type={form.eventAllDay ? "date" : "datetime-local"}
                    value={form.eventEndDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventEndDate: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Address</label>
                  <input
                    value={form.eventAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventAddress: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                    placeholder="City, venue, or full address"
                  />
                </div>
              </div>
              </div>
            )}

            <div className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cover Image</p>
                  <p className="mt-1 text-xs text-slate-400">Upload a single image for the card cover or drag it into the area below.</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Current ratio: {formatCoverAspectLabel(form.coverAspect)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <AdminUploadZone
                  endpoint="contentImageUploader"
                  accept="image/*"
                  label="Drag & drop an image here"
                  helperText="PNG, JPG, WEBP up to 8MB"
                  buttonText="Choose file"
                  prepareFile={prepareCoverImage}
                  onUploaded={(url, metadata) => void handleCoverUploaded(url, metadata?.aspect)}
                  onError={(message) => toast.error(`Upload error: ${message}`)}
                />
              </div>
              {form.coverImage && (
                <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200" style={{ aspectRatio: form.coverAspect ?? 16 / 9 }}>
                  <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
                />
                Pin this item
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.publishToSite}
                  onChange={(e) => setForm((prev) => ({ ...prev, publishToSite: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
                />
                Publish on website
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.publishToDashboard}
                  onChange={(e) => setForm((prev) => ({ ...prev, publishToDashboard: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
                />
                Publish in dashboard
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#72A0C1] hover:shadow-xl hover:shadow-[#72A0C1]/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : form.id ? "Update Item" : "Publish Item"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Published Queue</h2>
            <p className="mt-1 text-sm text-slate-400">Manage existing {filter} entries.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#F8FAFC] p-8 text-center text-sm text-slate-400">
              No {filter} items yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[24px] border border-slate-100 bg-[#F8FAFC]">
                  {item.coverImage && (
                    <div style={{ aspectRatio: item.coverAspect ?? 16 / 9 }}>
                      <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.type}</p>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition-colors hover:border-red-200 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-500">{item.body}</p>
                    {item.type === "events" && (item.eventDate || item.eventAddress) && (
                      <div className="mt-4 space-y-1 text-xs text-slate-500">
                        {item.eventDate && <p><span className="font-semibold text-slate-700">Start:</span> {item.eventAllDay ? new Date(item.eventDate).toLocaleDateString() : new Date(item.eventDate).toLocaleString()}</p>}
                        {item.eventEndDate && <p><span className="font-semibold text-slate-700">End:</span> {item.eventAllDay ? new Date(item.eventEndDate).toLocaleDateString() : new Date(item.eventEndDate).toLocaleString()}</p>}
                        {item.eventAddress && <p><span className="font-semibold text-slate-700">Address:</span> {item.eventAddress}</p>}
                        {item.eventAllDay && <p><span className="font-semibold text-slate-700">Format:</span> Date only</p>}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Cover {formatCoverAspectLabel(item.coverAspect)}
                      </span>
                      {item.isPinned && (
                        <span className="rounded-full bg-[#72A0C1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                          Pinned
                        </span>
                      )}
                      {item.publishToSite && (
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                          Website
                        </span>
                      )}
                      {item.publishToDashboard && (
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                          Dashboard
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {cropRequest && (
        <ImageCropperModal
          file={cropRequest.file}
          defaultAspect={form.coverAspect ?? 16 / 9}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}
    </main>
  );
}
