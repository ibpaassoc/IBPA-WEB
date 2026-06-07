"use client";

import { Button } from "@/components/ui/button";

import { mailingTemplates } from "../server/mailing.service";
import type { MailingTemplate } from "../types/mailing.types";

type MailingTemplateSelectorProps = {
  onSelect: (template: MailingTemplate) => void;
};

export function MailingTemplateSelector({ onSelect }: MailingTemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {mailingTemplates.map((template) => (
        <Button
          key={template.id}
          onClick={() => onSelect(template)}
          type="button"
          variant="outline"
        >
          {template.name}
        </Button>
      ))}
    </div>
  );
}
