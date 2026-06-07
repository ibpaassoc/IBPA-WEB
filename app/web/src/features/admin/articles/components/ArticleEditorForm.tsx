"use client";

import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
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
  const patch = (next: Partial<ArticleEditorState>) => onChange({ ...form, ...next });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
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
            onChange={(event) => patch({ coverImage: event.target.value })}
            placeholder="https://..."
            value={form.coverImage}
          />
          <FieldDescription>Upload a new cover or paste an existing URL.</FieldDescription>
        </Field>
      </FieldGroup>

      <AdminUploadZone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        buttonText="Choose image"
        endpoint="contentImageUploader"
        helperText="JPG, PNG, WEBP up to 16 MB."
        label="Upload article cover"
        onError={(message) => toast.error(message)}
        onUploaded={(url, metadata) => patch({ coverAspect: metadata?.aspect ?? form.coverAspect, coverImage: url })}
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
        <Button disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {form.id ? "Update article" : "Create article"}
        </Button>
        <Button onClick={onReset} type="button" variant="outline">
          New draft
        </Button>
        <Button
          onClick={() => patch({ publishToDashboard: false, publishToSite: false })}
          type="button"
          variant="ghost"
        >
          Save as draft
        </Button>
        <Button
          onClick={() => patch({ publishToSite: true })}
          type="button"
          variant="secondary"
        >
          Publish
        </Button>
        <Button type="button" variant="ghost">
          <UploadCloud data-icon="inline-start" />
          Preview below
        </Button>
      </div>
    </form>
  );
}
