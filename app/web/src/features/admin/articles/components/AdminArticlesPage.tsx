"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSheet } from "../../shared/components/AdminSheet";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  deleteArticle,
  listContentItems,
  saveArticle,
} from "../server/article-admin.repository";
import {
  emptyArticleEditorState,
  filterArticles,
  normalizeArticle,
  toArticleEditorState,
} from "../server/article-admin.service";
import type {
  AdminArticle,
  ArticleEditorState,
  ArticleVisibilityFilter,
} from "../types/article-admin.types";
import { ArticleCardGrid } from "./ArticleCardGrid";
import { ArticleEditorForm } from "./ArticleEditorForm";
import { ArticlePreviewCard } from "./ArticlePreviewCard";

type SheetMode = "closed" | "edit" | "create";

export function AdminArticlesPage() {
  const { deferredSearch, search, setFilter, setSearch, filters, resetFilters } =
    useAdminFilters<{ visibility: ArticleVisibilityFilter }>({ visibility: "all" });
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [form, setForm] = useState<ArticleEditorState>(emptyArticleEditorState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("closed");

  const loadArticles = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true);

    try {
      const data = await listContentItems();
      const nextArticles = Array.isArray(data.items)
        ? data.items.filter((item) => item.type === "news").map(normalizeArticle)
        : [];
      setArticles(nextArticles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load articles.");
      if (!silent) setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadArticles();
  }, []);

  const visibleArticles = useMemo(
    () => filterArticles(articles, { query: deferredSearch, visibility: filters.visibility }),
    [articles, deferredSearch, filters.visibility],
  );

  const openCreate = () => {
    setForm({ ...emptyArticleEditorState });
    setSheetMode("create");
  };

  const openEdit = (article: AdminArticle) => {
    setForm(toArticleEditorState(article));
    setSheetMode("edit");
  };

  const closeSheet = () => setSheetMode("closed");

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveArticle(form);
      if (response.item) {
        const saved = normalizeArticle(response.item);
        setArticles((current) => {
          const exists = current.some((article) => article.id === saved.id);
          return exists
            ? current.map((article) => (article.id === saved.id ? saved : article))
            : [saved, ...current];
        });
        setForm(toArticleEditorState(saved));
        setSheetMode("edit");
      } else {
        await loadArticles({ silent: true });
      }
      toast.success(form.id ? "Article updated." : "Article created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save article.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (article: AdminArticle) => {
    if (!window.confirm(`Delete "${article.title}"?`)) return;

    try {
      await deleteArticle(article.id);
      setArticles((current) => current.filter((item) => item.id !== article.id));
      if (form.id === article.id) closeSheet();
      toast.success("Article deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete article.");
    }
  };

  const sheetOpen = sheetMode !== "closed";
  const sheetTitle = sheetMode === "create" ? "New article" : form.title || "Edit article";

  return (
    <>
      <AdminPageShell
        actions={
          <>
            <Button
              className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
              onClick={() => void loadArticles()}
              type="button"
              variant="outline"
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
            <Button
              className="h-10 gap-2 rounded-2xl bg-[#1F5D8F] px-5 text-sm text-white hover:bg-[#10203B]"
              onClick={openCreate}
              type="button"
            >
              <Plus className="size-4" />
              Add article
            </Button>
          </>
        }
        eyebrow="Admin workspace"
        subtitle="Draft, edit, and publish every article that goes out under IBPA. One canvas, three steps: write, preview, publish."
        title="Articles"
      >
        <section className="rounded-[28px] border border-[#D7E5F4] bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="lg:flex-1">
              <AdminSearch
                onChange={setSearch}
                placeholder="Search title, body, or CTA"
                value={search}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                onValueChange={(value) => setFilter("visibility", value as ArticleVisibilityFilter)}
                value={filters.visibility}
              >
                <SelectTrigger className="h-10 w-44 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All articles</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
                onClick={resetFilters}
                type="button"
                variant="ghost"
              >
                Reset
              </Button>
            </div>
            <span className="hidden text-xs tabular-nums text-[#6C7F95] lg:inline">
              {formatAdminCount(visibleArticles.length, "article")}
            </span>
          </div>
        </section>

        <ArticleCardGrid
          articles={visibleArticles}
          isLoading={isLoading}
          onDelete={handleDelete}
          onEdit={openEdit}
          selectedId={form.id ?? null}
        />
      </AdminPageShell>

      <AdminSheet
        onOpenChange={(next) => (next ? null : closeSheet())}
        open={sheetOpen}
        eyebrow={sheetMode === "create" ? "Compose article" : "Edit article"}
        title={sheetTitle}
        description={
          sheetMode === "create"
            ? "Write a new article and choose where it shows."
            : "Edit copy and publishing settings, then preview the result."
        }
        size="xl"
      >
        <Tabs defaultValue="editor" className="flex flex-col gap-6">
          <TabsList className="self-start">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="m-0">
            <ArticleEditorForm
              form={form}
              isSaving={isSaving}
              onChange={setForm}
              onReset={() => setForm({ ...emptyArticleEditorState })}
              onSave={handleSave}
            />
          </TabsContent>
          <TabsContent value="preview" className="m-0">
            <ArticlePreviewCard draft={form} />
          </TabsContent>
        </Tabs>
      </AdminSheet>
    </>
  );
}
