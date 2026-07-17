"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ContentImageEditor } from "@/components/content/ContentImageEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ArticleEditorState } from "../types/article-admin.types";

type ArticleEditorFormProps = {
  form: ArticleEditorState;
  isSaving: boolean;
  onChange: (form: ArticleEditorState) => void;
  onSave: () => void;
  onReset: () => void;
};

export function ArticleEditorForm({
  form,
  isSaving,
  onChange,
  onReset,
  onSave,
}: ArticleEditorFormProps) {
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false);
  const patch = (next: Partial<ArticleEditorState>) => onChange({ ...form, ...next });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (hasPendingImageChanges) {
          toast.error("Apply or cancel the current image adjustments first.");
          return;
        }
        onSave();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="article-title">Title</FieldLabel>
          <Input
            id="article-title"
            onChange={(event) => patch({ title: event.target.value })}
            placeholder="Article headline"
            value={form.title}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="article-body">Body</FieldLabel>
          <Textarea
            id="article-body"
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="Write the announcement, update, or news item..."
            rows={10}
            value={form.body}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="article-cta-label">CTA label</FieldLabel>
            <Input
              id="article-cta-label"
              onChange={(event) => patch({ ctaLabel: event.target.value })}
              placeholder="Read more"
              value={form.ctaLabel}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="article-cta-url">CTA URL</FieldLabel>
            <Input
              id="article-cta-url"
              onChange={(event) => patch({ ctaUrl: event.target.value })}
              placeholder="https://..."
              value={form.ctaUrl}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="article-cover">Cover image URL</FieldLabel>
          <Input
            id="article-cover"
            onChange={(event) => patch({ coverImage: event.target.value, imageMetadata: null })}
            placeholder="https://..."
            value={form.coverImage}
          />
          <FieldDescription>Upload a new cover or paste an existing URL.</FieldDescription>
        </Field>
      </FieldGroup>

      <ContentImageEditor
        key={`${form.id || "new-article"}:${form.coverImage}`}
        alt={form.title || "Article cover"}
        legacyAspect={form.coverAspect}
        legacyUrl={form.coverImage}
        onChange={(imageMetadata, coverAspect) =>
          patch({
            coverAspect,
            coverImage: imageMetadata?.url || "",
            imageMetadata,
          })
        }
        onDirtyChange={setHasPendingImageChanges}
        onError={(message) => toast.error(message)}
        value={form.imageMetadata}
      />

      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox
            checked={form.publishToSite}
            id="article-publish-site"
            onCheckedChange={(checked) => patch({ publishToSite: checked === true })}
          />
          <FieldContent>
            <FieldTitle>Publish to public site</FieldTitle>
            <FieldDescription>Visible in the website news/update surfaces.</FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            checked={form.publishToDashboard}
            id="article-publish-dashboard"
            onCheckedChange={(checked) => patch({ publishToDashboard: checked === true })}
          />
          <FieldContent>
            <FieldTitle>Publish to dashboard</FieldTitle>
            <FieldDescription>Visible to signed-in members.</FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            checked={form.isPinned}
            id="article-pinned"
            onCheckedChange={(checked) => patch({ isPinned: checked === true })}
          />
          <FieldContent>
            <FieldTitle>Pin article</FieldTitle>
            <FieldDescription>Prioritize this article in admin and public lists.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button
          className="h-10 rounded-2xl bg-[#1F5D8F] px-5 text-white hover:bg-[#10203B]"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {form.id ? "Update article" : "Create article"}
        </Button>
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={onReset}
          type="button"
          variant="outline"
        >
          New draft
        </Button>
        <Button
          className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={() => patch({ publishToDashboard: false, publishToSite: false })}
          type="button"
          variant="ghost"
        >
          Save as draft
        </Button>
      </div>
    </form>
  );
}
