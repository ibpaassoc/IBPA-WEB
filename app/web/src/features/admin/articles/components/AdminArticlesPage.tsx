"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { RefreshCw } from "lucide-react";
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

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
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
import { ArticleEditorForm } from "./ArticleEditorForm";
import { ArticlePreviewCard } from "./ArticlePreviewCard";
import { ArticlesTable } from "./ArticlesTable";

export function AdminArticlesPage() {
  const { deferredSearch, search, setFilter, setSearch, filters, resetFilters } =
    useAdminFilters<{ visibility: ArticleVisibilityFilter }>({ visibility: "all" });
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [form, setForm] = useState<ArticleEditorState>(emptyArticleEditorState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadArticles = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const data = await listContentItems();
      const nextArticles = Array.isArray(data.items)
        ? data.items.filter((item) => item.type === "news").map(normalizeArticle)
        : [];
      setArticles(nextArticles);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load articles.");
      if (!silent) {
        setArticles([]);
      }
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

  const resetForm = () => setForm({ ...emptyArticleEditorState });

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
      if (form.id === article.id) {
        resetForm();
      }
      toast.success("Article deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete article.");
    }
  };

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadArticles()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Create and manage news, updates, and announcements independently from events and partner content."
      lastSyncedAt={lastSyncedAt}
      title="Articles"
    >
      <AdminFilters>
        <AdminSearch
          onChange={setSearch}
          placeholder="Search article title, body, or CTA"
          value={search}
        />
        <Select
          onValueChange={(value) => setFilter("visibility", value as ArticleVisibilityFilter)}
          value={filters.visibility}
        >
          <SelectTrigger className="w-full lg:w-48">
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
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <AdminSectionCard
          description={formatAdminCount(visibleArticles.length, "article")}
          title="Articles list"
        >
          <ArticlesTable
            articles={visibleArticles}
            isLoading={isLoading}
            onDelete={handleDelete}
            onEdit={(article) => setForm(toArticleEditorState(article))}
            selectedId={form.id ?? null}
          />
        </AdminSectionCard>

        <div className="flex flex-col gap-6">
          <AdminSectionCard
            description="Reusable editor for news, updates, and announcements."
            title={form.id ? "Edit article" : "Create article"}
          >
            <ArticleEditorForm
              form={form}
              isSaving={isSaving}
              onChange={setForm}
              onReset={resetForm}
              onSave={handleSave}
            />
          </AdminSectionCard>

          <AdminSectionCard title="Preview">
            <ArticlePreviewCard draft={form} />
          </AdminSectionCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
