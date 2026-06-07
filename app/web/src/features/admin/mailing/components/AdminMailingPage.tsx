"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import {
  deleteEmailHistoryItem,
  listApplicationAudienceEmails,
  listEmailHistory,
  listEventRegistrantAudienceEmails,
  listMailingRecipients,
  sendEmailCampaign,
} from "../server/mailing.repository";
import {
  emptyMailingDraft,
  emptyApplicationStatusEmails,
  renderEmailHtml,
  resolveAudienceEmails,
  normalizeRecipients,
} from "../server/mailing.service";
import type { ApplicationAudienceStatus, EmailLog, MailingDraft } from "../types/mailing.types";
import { MailingDetailsView } from "./MailingDetailsView";
import { MailingEditor } from "./MailingEditor";
import { MailingPreview } from "./MailingPreview";
import { MailingTable } from "./MailingTable";

const DRAFT_STORAGE_KEY = "ibpa-admin-mailing-draft";

export function AdminMailingPage() {
  const [draft, setDraft] = useState<MailingDraft>(emptyMailingDraft);
  const [recipients, setRecipients] = useState<ReturnType<typeof normalizeRecipients>>([]);
  const [applicationStatusEmails, setApplicationStatusEmails] = useState<Record<ApplicationAudienceStatus, string[]>>(
    emptyApplicationStatusEmails,
  );
  const [eventRegistrantEmails, setEventRegistrantEmails] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const selectedEmails = useMemo(
    () =>
      resolveAudienceEmails(
        {
          applicationStatusEmails,
          eventRegistrantEmails,
          recipients,
          teamMemberEmails: [],
        },
        draft,
      ),
    [applicationStatusEmails, draft, eventRegistrantEmails, recipients],
  );

  const membershipTypes = useMemo(
    () => Array.from(new Set(recipients.map((recipient) => recipient.cardName).filter(Boolean))).sort(),
    [recipients],
  );

  const loadMailing = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const [
        recipientResult,
        historyResult,
        applicationAudienceResult,
        eventAudienceResult,
      ] = await Promise.allSettled([
        listMailingRecipients(),
        listEmailHistory(),
        listApplicationAudienceEmails(),
        listEventRegistrantAudienceEmails(),
      ] as const);

      if (recipientResult.status === "fulfilled") {
        setRecipients(normalizeRecipients(recipientResult.value.items ?? []));
        setCategories(recipientResult.value.categories ?? []);
      } else if (!silent) {
        setRecipients([]);
        setCategories([]);
      }

      if (historyResult.status === "fulfilled") {
        setHistory(Array.isArray(historyResult.value) ? historyResult.value : []);
      } else if (!silent) {
        setHistory([]);
      }

      if (applicationAudienceResult.status === "fulfilled") {
        setApplicationStatusEmails(applicationAudienceResult.value);
      } else {
        setApplicationStatusEmails(emptyApplicationStatusEmails);
      }

      if (eventAudienceResult.status === "fulfilled") {
        setEventRegistrantEmails(eventAudienceResult.value);
      } else {
        setEventRegistrantEmails([]);
      }

      const failed = [recipientResult, historyResult].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") {
        throw failed.reason;
      }

      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load mailing data.");
      if (!silent) {
        setRecipients([]);
        setHistory([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        setDraft({ ...emptyMailingDraft, ...(JSON.parse(saved) as Partial<MailingDraft>) });
      } catch {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }

    void loadMailing();
  }, []);

  const saveDraft = () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    toast.success("Draft saved in this browser.");
  };

  const handleSend = async () => {
    if (!draft.subject.trim() || !draft.body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }

    if (selectedEmails.length === 0) {
      toast.error("Choose at least one recipient.");
      return;
    }

    if (!window.confirm(`Send this email to ${selectedEmails.length} recipient(s)?`)) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendEmailCampaign({
        emails: selectedEmails,
        html: renderEmailHtml(draft.body),
        subject: draft.subject,
      });
      toast.success(`Email sent to ${result.count ?? selectedEmails.length} recipient(s).`);
      setDraft(emptyMailingDraft);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      await loadMailing({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteHistory = async (email: EmailLog) => {
    if (!window.confirm(`Delete history item "${email.subject}"?`)) return;

    try {
      await deleteEmailHistoryItem(email.id);
      setHistory((current) => current.filter((item) => item.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
      toast.success("Email history item deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete email history item.");
    }
  };

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadMailing()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Manage outgoing email campaigns, reusable templates, audience targeting, drafts, previews, and sent history."
      lastSyncedAt={lastSyncedAt}
      title="Mailing"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <div className="flex flex-col gap-6">
          <AdminSectionCard
            description="Email-only campaign composer. In-app notifications live outside this feature."
            title="Campaign editor"
          >
            <MailingEditor
              categories={categories}
              draft={draft}
              isSending={isSending}
              membershipTypes={membershipTypes}
              onChange={setDraft}
              onSaveDraft={saveDraft}
              onSend={handleSend}
              onTemplate={setDraft}
              recipientCount={selectedEmails.length}
            />
          </AdminSectionCard>

          <AdminSectionCard title="Preview">
            <MailingPreview draft={draft} recipientCount={selectedEmails.length} />
          </AdminSectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminSectionCard title="Email history">
            <MailingTable
              emails={history}
              isLoading={isLoading}
              onDelete={handleDeleteHistory}
              onOpen={setSelectedEmail}
              selectedId={selectedEmail?.id ?? null}
            />
          </AdminSectionCard>

          <MailingDetailsView email={selectedEmail} />
        </div>
      </div>
    </AdminPageShell>
  );
}
