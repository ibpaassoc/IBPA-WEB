"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ContentImageEditor } from "@/components/content/ContentImageEditor";
import { EventCard } from "@/components/content/EventCard";
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
import { useI18n } from "@/lib/i18n";

import type { EventEditorState } from "../types/event-admin.types";

type EventEditorFormProps = {
  form: EventEditorState;
  isSaving: boolean;
  onChange: (form: EventEditorState) => void;
  onReset: () => void;
  onSave: () => void;
};

export function EventEditorForm({
  form,
  isSaving,
  onChange,
  onReset,
  onSave,
}: EventEditorFormProps) {
  const { t } = useI18n();
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false);
  const patch = (next: Partial<EventEditorState>) => onChange({ ...form, ...next });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (hasPendingImageChanges) {
          toast.error(t.contentImages.unsavedChanges);
          return;
        }
        onSave();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="event-title">Event title</FieldLabel>
          <Input
            id="event-title"
            onChange={(event) => patch({ title: event.target.value })}
            placeholder="Event title"
            value={form.title}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="event-body">Event details</FieldLabel>
          <Textarea
            id="event-body"
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="Describe the event..."
            rows={8}
            value={form.body}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="event-start">Start</FieldLabel>
            <Input
              id="event-start"
              onChange={(event) => patch({ eventDate: event.target.value })}
              type="datetime-local"
              value={form.eventDate}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="event-end">End</FieldLabel>
            <Input
              id="event-end"
              onChange={(event) => patch({ eventEndDate: event.target.value })}
              type="datetime-local"
              value={form.eventEndDate}
            />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Checkbox
            checked={form.eventAllDay}
            id="event-all-day"
            onCheckedChange={(checked) => patch({ eventAllDay: checked === true })}
          />
          <FieldContent>
            <FieldTitle>All-day event</FieldTitle>
            <FieldDescription>Public cards can hide time details for this event.</FieldDescription>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="event-address">Location</FieldLabel>
          <Input
            id="event-address"
            onChange={(event) => patch({ eventAddress: event.target.value })}
            placeholder="Venue, address, or online"
            value={form.eventAddress}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="event-price">Price</FieldLabel>
          <Input
            id="event-price"
            onChange={(event) => patch({ price: event.target.value })}
            placeholder="Free, $25, Members: $10…"
            value={form.price}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="event-cta-label">CTA label</FieldLabel>
            <Input
              id="event-cta-label"
              onChange={(event) => patch({ ctaLabel: event.target.value })}
              placeholder="Register"
              value={form.ctaLabel}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="event-cta-url">Event URL</FieldLabel>
            <Input
              id="event-cta-url"
              onChange={(event) => patch({ ctaUrl: event.target.value })}
              placeholder="https://..."
              value={form.ctaUrl}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="event-cover">Cover image URL</FieldLabel>
          <Input
            id="event-cover"
            onChange={(event) => patch({ coverImage: event.target.value, imageMetadata: null })}
            placeholder="https://..."
            value={form.coverImage}
          />
        </Field>
      </FieldGroup>

      <ContentImageEditor
        key={`${form.id || "new-event"}:${form.coverImage}`}
        alt={form.title || t.contentImages.eventFallbackTitle}
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
        renderCardPreview={(imageMetadata) => (
          <EventCard
            event={{
              title: form.title || t.contentImages.eventFallbackTitle,
              description: form.body || t.contentImages.eventFallbackDescription,
              coverImage: imageMetadata.url,
              coverAspect: form.coverAspect,
              imageMetadata,
              eyebrow: t.contentImages.adminPreview,
            }}
            meta={[
              ...(form.eventDate ? [{ kind: "date" as const, value: form.eventDate }] : []),
              ...(form.eventAddress ? [{ kind: "location" as const, value: form.eventAddress }] : []),
              ...(form.price ? [{ kind: "price" as const, value: form.price }] : []),
            ]}
            variant="admin"
          />
        )}
        value={form.imageMetadata}
      />

      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox
            checked={form.publishToSite}
            id="event-publish-site"
            onCheckedChange={(checked) => patch({ publishToSite: checked === true })}
          />
          <FieldContent>
            <FieldTitle>Publish to site</FieldTitle>
            <FieldDescription>Visible on the public events page.</FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            checked={form.publishToDashboard}
            id="event-publish-dashboard"
            onCheckedChange={(checked) => patch({ publishToDashboard: checked === true })}
          />
          <FieldContent>
            <FieldTitle>Publish to member dashboard</FieldTitle>
            <FieldDescription>Allows dashboard registrations.</FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            checked={form.isPinned}
            id="event-pinned"
            onCheckedChange={(checked) => patch({ isPinned: checked === true })}
          />
          <FieldContent>
            <FieldTitle>Pin event</FieldTitle>
            <FieldDescription>Prioritize this event in event lists.</FieldDescription>
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
          {form.id ? "Update event" : "Add event"}
        </Button>
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={onReset}
          type="button"
          variant="outline"
        >
          New event
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
