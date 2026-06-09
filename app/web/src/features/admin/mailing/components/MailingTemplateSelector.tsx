"use client";

import { mailingTemplates } from "../server/mailing.service";
import type { MailingTemplate } from "../types/mailing.types";

type MailingTemplateSelectorProps = {
  onSelect: (template: MailingTemplate) => void;
};

export function MailingTemplateSelector({ onSelect }: MailingTemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {mailingTemplates.map((template) => (
        <button
          className="rounded-full border border-[#D7E5F4] bg-white px-4 py-1.5 text-xs font-medium text-[#1F5D8F] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
          key={template.id}
          onClick={() => onSelect(template)}
          type="button"
        >
          {template.name}
        </button>
      ))}
    </div>
  );
}
