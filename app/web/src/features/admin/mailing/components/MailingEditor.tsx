"use client";

import { Loader2, Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { MailingDraft } from "../types/mailing.types";
import { MailingAudienceSelector } from "./MailingAudienceSelector";
import { MailingTemplateSelector } from "./MailingTemplateSelector";

type MailingEditorProps = {
  categories: string[];
  draft: MailingDraft;
  isSending: boolean;
  membershipTypes: string[];
  onChange: (draft: MailingDraft) => void;
  onSaveDraft: () => void;
  onSend: () => void;
  onTemplate: (draft: MailingDraft) => void;
  recipientCount: number;
};

export function MailingEditor({
  categories,
  draft,
  isSending,
  membershipTypes,
  onChange,
  onSaveDraft,
  onSend,
  onTemplate,
  recipientCount,
}: MailingEditorProps) {
  const patch = (next: Partial<MailingDraft>) => onChange({ ...draft, ...next });

  return (
    <div className="flex flex-col gap-5">
      <MailingTemplateSelector
        onSelect={(template) => onTemplate({ ...draft, body: template.body, subject: template.subject })}
      />

      <MailingAudienceSelector
        categories={categories}
        draft={draft}
        membershipTypes={membershipTypes}
        onChange={onChange}
        recipientCount={recipientCount}
      />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="mailing-subject">Subject</FieldLabel>
          <Input
            id="mailing-subject"
            onChange={(event) => patch({ subject: event.target.value })}
            placeholder="Important IBPA update"
            value={draft.subject}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="mailing-body">Email body</FieldLabel>
          <Textarea
            id="mailing-body"
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="Write the campaign body..."
            rows={12}
            value={draft.body}
          />
          <FieldDescription>Line breaks are preserved in the sent email.</FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button disabled={isSending || recipientCount === 0} onClick={onSend} type="button">
          {isSending ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Send data-icon="inline-start" />
          )}
          Send email
        </Button>
        <Button onClick={onSaveDraft} type="button" variant="outline">
          <Save data-icon="inline-start" />
          Save draft
        </Button>
      </div>
    </div>
  );
}
