"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, Handshake } from "lucide-react";
import { toast } from "sonner";
import { AdminUploadZone } from "@/components/AdminUploadZone";
import type { AdminContentItem } from "@/lib/admin-types";

type PartnerForm = {
  id?: string;
  title: string;
  body: string;
  coverImage: string;
};

const emptyForm: PartnerForm = {
  title: "",
  body: "",
  coverImage: "",
};

function normalizeForm(value?: Partial<PartnerForm>): PartnerForm {
  return {
    id: value?.id,
    title: value?.title ?? "",
    body: value?.body ?? "",
    coverImage: value?.coverImage ?? "",
  };
}

export default function PartnersPage() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadItems = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load partners");
      }

      setItems(
        Array.isArray(data.items)
          ? data.items
              .filter((item: AdminContentItem) => item.type === "partners")
              .map((item: AdminContentItem) => ({
                ...item,
                title: item.title ?? "",
                body: item.body ?? "",
                coverImage: item.coverImage ?? "",
                publishToSite: Boolean(item.publishToSite),
                publishToDashboard: Boolean(item.publishToDashboard),
                isPinned: Boolean(item.isPinned),
              }))
          : [],
      );
      setLastSyncedAt(new Date().toISOString());
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || "Failed to load partners");
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

    return () => window.clearInterval(intervalId);
  }, [loadItems]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (Number(b.isPinned) - Number(a.isPinned)) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items],
  );

  const resetForm = () => setForm(normalizeForm(emptyForm));

  const handleEdit = (item: AdminContentItem) => {
    setForm(
      normalizeForm({
        id: item.id,
        title: item.title ?? "",
        body: item.body ?? "",
        coverImage: item.coverImage ?? "",
      }),
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim() || !form.coverImage.trim()) {
      toast.error("Name, description, and logo are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: "partners",
        title: form.title.trim(),
        body: form.body.trim(),
        coverImage: form.coverImage.trim(),
        isPinned: false,
        publishToSite: true,
        publishToDashboard: false,
      };

      const url = form.id ? `/api/admin/content/${form.id}` : "/api/admin/content";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: form.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save partner");

      toast.success(form.id ? "Partner updated" : "Partner created");
      await loadItems();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save partner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this partner?")) return;

    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete partner");
      toast.success("Partner deleted");
      await loadItems();
      if (form.id === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete partner");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-9">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Партнёры</h1>
          <p className="mt-1.5 text-sm font-light text-slate-500">
            Логотип, название и описание для страницы Partnership и блока партнёров на главной.
          </p>
          {lastSyncedAt && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {form.id ? "Edit Partner" : "Create New Partner"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Upload a logo, choose a name, and write the partner description.
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
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Partner Name</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                placeholder="TEORA beauty"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={8}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1]"
                placeholder="Short partner description..."
              />
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Partner Logo</p>
                  <p className="mt-1 text-xs text-slate-400">Upload one image file. It will appear on the homepage and the Partnership page.</p>
                </div>
              </div>
              <div className="mt-4">
                <AdminUploadZone
                  endpoint="contentImageUploader"
                  accept="image/*"
                  label="Drag & drop partner logo"
                  helperText="PNG, JPG, WEBP up to 8MB"
                  buttonText="Choose file"
                  onUploaded={(url) => {
                    setForm((prev) => ({ ...prev, coverImage: url }));
                    toast.success("Logo uploaded");
                  }}
                  onError={(message) => toast.error(`Upload error: ${message}`)}
                />
              </div>
              {form.coverImage && (
                <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6">
                  <img src={form.coverImage} alt="Logo preview" className="mx-auto h-24 w-auto object-contain" />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#72A0C1] hover:shadow-xl hover:shadow-[#72A0C1]/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : form.id ? "Update Partner" : "Publish Partner"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Published Partners</h2>
            <p className="mt-1 text-sm text-slate-400">These items feed the main partner block and the Partnership page.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#F8FAFC] p-8 text-center text-sm text-slate-400">
              No partners yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[24px] border border-slate-100 bg-[#F8FAFC]">
                  {item.coverImage && <img src={item.coverImage} alt={item.title} className="h-40 w-full object-cover" />}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">partner</p>
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Website
                      </span>
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
    </main>
  );
}
