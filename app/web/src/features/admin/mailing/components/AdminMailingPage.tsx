"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  Loader2,
  Mail,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSheet } from "../../shared/components/AdminSheet";
import { formatAdminDate, formatAdminDateTime } from "../../shared/utils/admin-formatters";
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
  getEmailLogRecipientCount,
  mailingTemplates,
  normalizeRecipients,
  parseCustomEmails,
  renderEmailHtml,
  resolveAudienceEmails,
} from "../server/mailing.service";
import type {
  ApplicationAudienceStatus,
  EmailLog,
  MailingAudienceKind,
  MailingDraft,
} from "../types/mailing.types";
import { MailingMemberPicker } from "./MailingMemberPicker";
import { MailingPreview } from "./MailingPreview";

const DRAFT_STORAGE_KEY = "ibpa-admin-mailing-draft";

type ComposeMode = "closed" | "compose";
type DetailMode = "closed" | "detail";

export function AdminMailingPage() {
  const [draft, setDraft] = useState<MailingDraft>(emptyMailingDraft);
  const [recipients, setRecipients] = useState<ReturnType<typeof normalizeRecipients>>([]);
  const [applicationStatusEmails, setApplicationStatusEmails] = useState<
    Record<ApplicationAudienceStatus, string[]>
  >(emptyApplicationStatusEmails);
  const [eventRegistrantEmails, setEventRegistrantEmails] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [pickedMemberEmails, setPickedMemberEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("closed");
  const [detailMode, setDetailMode] = useState<DetailMode>("closed");

  const membershipTypes = useMemo(
    () =>
      Array.from(new Set(recipients.map((recipient) => recipient.cardName).filter(Boolean))).sort(),
    [recipients],
  );

  const useMemberPicker = pickedMemberEmails.length > 0;

  const resolvedAudienceEmails = useMemo(
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

  const finalEmails = useMemo(() => {
    if (useMemberPicker) {
      const combined = new Set([...pickedMemberEmails]);
      const extra = parseCustomEmails(draft.customEmails);
      extra.forEach((email) => combined.add(email));
      return Array.from(combined);
    }
    return resolvedAudienceEmails;
  }, [useMemberPicker, pickedMemberEmails, draft.customEmails, resolvedAudienceEmails]);

  const loadMailing = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true);

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
      if (failed?.status === "rejected") throw failed.reason;
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

  const openCompose = () => setComposeMode("compose");
  const closeCompose = () => setComposeMode("closed");

  const openDetail = (email: EmailLog) => {
    setSelectedEmail(email);
    setDetailMode("detail");
  };

  const closeDetail = () => setDetailMode("closed");

  const saveDraft = () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    toast.success("Draft saved in this browser.");
  };

  const resetDraft = () => {
    setDraft(emptyMailingDraft);
    setPickedMemberEmails([]);
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleSend = async () => {
    if (!draft.subject.trim() || !draft.body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    if (finalEmails.length === 0) {
      toast.error("Choose at least one recipient.");
      return;
    }
    if (!window.confirm(`Send this email to ${finalEmails.length} recipient(s)?`)) return;

    setIsSending(true);
    try {
      const result = await sendEmailCampaign({
        emails: finalEmails,
        html: renderEmailHtml(draft.body),
        subject: draft.subject,
      });
      toast.success(`Email sent to ${result.count ?? finalEmails.length} recipient(s).`);
      resetDraft();
      closeCompose();
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
        closeDetail();
      }
      toast.success("Email history item deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete email history item.");
    }
  };

  const filteredHistory = useMemo(() => {
    const needle = historySearch.trim().toLowerCase();
    if (!needle) return history;
    return history.filter((email) =>
      `${email.subject} ${email.sender ?? ""} ${email.content ?? ""}`.toLowerCase().includes(needle),
    );
  }, [history, historySearch]);

  const patch = (next: Partial<MailingDraft>) => setDraft((current) => ({ ...current, ...next }));

  const draftSummary = draft.subject || draft.body
    ? draft.subject || "Unnamed draft"
    : "Nothing in progress";

  return (
    <>
      <AdminPageShell
        actions={
          <>
            <Button
              className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
              onClick={() => void loadMailing()}
              type="button"
              variant="outline"
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
            <Button
              className="h-10 gap-2 rounded-2xl bg-[#1F5D8F] px-5 text-sm text-white hover:bg-[#10203B]"
              onClick={openCompose}
              type="button"
            >
              <Plus className="size-4" />
              New campaign
            </Button>
          </>
        }
        eyebrow="Admin workspace"
        subtitle="Send and review every IBPA campaign. Open a card to inspect a sent campaign. Compose a new one from the top right."
        title="Mailing"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminMetricCard
            active
            description="Total campaigns delivered"
            icon={Mail}
            label="Campaigns sent"
            value={history.length}
          />
          <AdminMetricCard
            description="Members eligible to receive campaigns"
            icon={Users}
            label="Members on file"
            value={recipients.length}
          />
          <div className="flex flex-col gap-3 rounded-[28px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
              Draft in browser
            </span>
            <p
              className={cn(
                "truncate text-lg font-semibold tracking-[-0.01em]",
                draft.subject || draft.body ? "text-[#10203B]" : "text-[#8AA2BD]",
              )}
            >
              {draftSummary}
            </p>
            {draft.subject || draft.body ? (
              <Button
                className="mt-auto h-9 w-fit rounded-2xl border-[#D7E5F4] bg-white px-3 text-xs text-[#1F5D8F] hover:bg-[#EEF6FF]"
                onClick={openCompose}
                type="button"
                variant="outline"
              >
                <PenLine className="size-3" data-icon="inline-start" />
                Continue
              </Button>
            ) : null}
          </div>
        </div>

        <section className="rounded-[28px] border border-[#D7E5F4] bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="lg:flex-1">
              <AdminSearch
                onChange={setHistorySearch}
                placeholder="Search by subject, sender, or body"
                value={historySearch}
              />
            </div>
            <span className="hidden text-xs tabular-nums text-[#6C7F95] lg:inline">
              {filteredHistory.length.toLocaleString("en-US")} campaign
              {filteredHistory.length === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton className="h-44 rounded-[24px] bg-white" key={i} />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-[28px] border border-[#D7E5F4] bg-white px-8 py-16 text-center shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
            <p className="text-xl font-semibold tracking-[-0.02em] text-[#10203B]">
              {history.length === 0 ? "No campaigns yet" : "Nothing matches your search"}
            </p>
            <p className="mt-2 text-sm text-[#6C7F95]">
              {history.length === 0
                ? "When you send a campaign it will appear here as its own card."
                : "Try another keyword from a subject or sender."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredHistory.map((email) => (
              <button
                className="group flex flex-col gap-4 rounded-[24px] border border-[#D7E5F4] bg-white p-6 text-left shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFD3EA] hover:shadow-[0_22px_60px_rgba(15,46,83,0.09)]"
                key={email.id}
                onClick={() => openDetail(email)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
                    {formatAdminDate(email.sentAt || email.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFE6D4] bg-[#F2FBF7] px-2.5 py-1 text-[11px] font-semibold text-[#197A52]">
                    <span className="size-1.5 rounded-full bg-[#197A52]" />
                    {(email.status || "sent").toString()}
                  </span>
                </div>

                <h3
                  className="line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.01em] text-[#10203B]"
                  style={{ textWrap: "balance" }}
                >
                  {email.subject || "Untitled campaign"}
                </h3>

                {email.content ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-[#55708D]">
                    {email.content.replace(/<[^>]+>/g, " ").trim()}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-[#E4EEF8] pt-3 text-xs text-[#6C7F95]">
                  <span className="tabular-nums">
                    <span className="font-semibold text-[#10203B]">
                      {getEmailLogRecipientCount(email)}
                    </span>{" "}
                    recipients
                  </span>
                  <span
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-[#55708D] transition-colors hover:bg-[#FFF5F5] hover:text-[#B42318]"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteHistory(email);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </AdminPageShell>

      {/* Compose sheet */}
      <AdminSheet
        actions={
          <Button
            className="h-10 gap-2 rounded-2xl bg-[#1F5D8F] px-5 text-sm text-white hover:bg-[#10203B]"
            disabled={isSending || finalEmails.length === 0}
            onClick={() => void handleSend()}
            type="button"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send to {finalEmails.length}
          </Button>
        }
        description="Pick recipients, write the email, preview, then send. Drafts save to this browser."
        eyebrow="Compose campaign"
        onOpenChange={(next) => (next ? null : closeCompose())}
        open={composeMode === "compose"}
        size="xl"
        title="New campaign"
      >
        <Tabs className="flex flex-col gap-6" defaultValue="recipients">
          <TabsList className="self-start">
            <TabsTrigger value="recipients">
              Recipients
              {finalEmails.length > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1F5D8F] px-1.5 text-[10px] font-semibold text-white">
                  {finalEmails.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent className="m-0" value="recipients">
            <div className="flex flex-col gap-6">
              <section className="rounded-[24px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
                <header className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-[-0.01em] text-[#10203B]">
                      Choose members
                    </h3>
                    <p className="mt-1 text-xs text-[#6C7F95]">
                      Click a member card to include them. Picked members override the bulk audience.
                    </p>
                  </div>
                </header>
                <MailingMemberPicker
                  onChange={setPickedMemberEmails}
                  recipients={recipients}
                  selectedEmails={pickedMemberEmails}
                />
              </section>

              <section
                className={cn(
                  "rounded-[24px] border border-dashed border-[#CFE0F3] bg-[#F8FBFF] p-5 transition-opacity",
                  useMemberPicker && "opacity-60",
                )}
              >
                <header className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
                    Alternate: bulk audience
                  </p>
                  <h3 className="mt-1 text-base font-semibold tracking-[-0.01em] text-[#10203B]">
                    Or send to a group
                  </h3>
                  <p className="mt-1 text-xs text-[#6C7F95]">
                    Used only when no members are picked above.
                  </p>
                </header>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    onValueChange={(value) =>
                      patch({ audienceKind: value as MailingAudienceKind, audienceValue: "" })
                    }
                    value={draft.audienceKind}
                  >
                    <SelectTrigger className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#10203B]">
                      <SelectValue placeholder="Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all_users">All users</SelectItem>
                        <SelectItem value="members">Members</SelectItem>
                        <SelectItem value="partners">Partners</SelectItem>
                        <SelectItem value="event_registrants">Event registrants</SelectItem>
                        <SelectItem value="application_pending">Applications: pending</SelectItem>
                        <SelectItem value="application_approved">Applications: approved</SelectItem>
                        <SelectItem value="application_rejected">Applications: rejected</SelectItem>
                        <SelectItem value="membership_category">By membership category</SelectItem>
                        <SelectItem value="membership_type">By membership type</SelectItem>
                        <SelectItem value="custom">Custom emails</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {draft.audienceKind === "membership_category" ||
                  draft.audienceKind === "membership_type" ? (
                    <Select
                      onValueChange={(value) => patch({ audienceValue: value })}
                      value={draft.audienceValue}
                    >
                      <SelectTrigger className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#10203B]">
                        <SelectValue placeholder="Choose membership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(draft.audienceKind === "membership_type"
                            ? membershipTypes
                            : categories
                          ).map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                {draft.audienceKind === "custom" ? (
                  <Textarea
                    className="mt-3 rounded-2xl border-[#D7E5F4] bg-white text-sm text-[#10203B]"
                    onChange={(event) => patch({ customEmails: event.target.value })}
                    placeholder="Paste emails separated by commas, spaces, or new lines"
                    rows={4}
                    value={draft.customEmails}
                  />
                ) : null}
                {!useMemberPicker ? (
                  <p className="mt-3 text-xs text-[#6C7F95]">
                    Resolves to{" "}
                    <span className="font-semibold tabular-nums text-[#10203B]">
                      {resolvedAudienceEmails.length}
                    </span>{" "}
                    recipient{resolvedAudienceEmails.length === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </section>
            </div>
          </TabsContent>

          <TabsContent className="m-0" value="compose">
            <div className="flex flex-col gap-6">
              <section className="rounded-[24px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
                  Start from a template
                </p>
                <div className="flex flex-wrap gap-2">
                  {mailingTemplates.map((template) => (
                    <button
                      className="rounded-full border border-[#D7E5F4] bg-white px-4 py-1.5 text-xs font-medium text-[#1F5D8F] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
                      key={template.id}
                      onClick={() => patch({ body: template.body, subject: template.subject })}
                      type="button"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </section>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="mailing-subject">Subject</FieldLabel>
                  <Input
                    className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-sm text-[#10203B]"
                    id="mailing-subject"
                    onChange={(event) => patch({ subject: event.target.value })}
                    placeholder="Important IBPA update"
                    value={draft.subject}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="mailing-body">Email body</FieldLabel>
                  <Textarea
                    className="rounded-2xl border-[#D7E5F4] bg-white text-sm leading-7 text-[#10203B]"
                    id="mailing-body"
                    onChange={(event) => patch({ body: event.target.value })}
                    placeholder="Write the campaign body..."
                    rows={14}
                    value={draft.body}
                  />
                  <FieldDescription>Line breaks are preserved in the sent email.</FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
                  onClick={saveDraft}
                  type="button"
                  variant="outline"
                >
                  <Save data-icon="inline-start" />
                  Save draft
                </Button>
                <Button
                  className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
                  onClick={resetDraft}
                  type="button"
                  variant="ghost"
                >
                  Clear
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent className="m-0" value="preview">
            <MailingPreview draft={draft} recipientCount={finalEmails.length} />
          </TabsContent>
        </Tabs>
      </AdminSheet>

      {/* Detail sheet for a sent campaign */}
      <AdminSheet
        description={
          selectedEmail
            ? `Sent ${formatAdminDateTime(selectedEmail.sentAt || selectedEmail.createdAt)} · ${getEmailLogRecipientCount(selectedEmail)} recipients`
            : undefined
        }
        eyebrow="Sent campaign"
        onOpenChange={(next) => (next ? null : closeDetail())}
        open={detailMode === "detail" && !!selectedEmail}
        size="lg"
        title={selectedEmail?.subject ?? "Campaign"}
      >
        {selectedEmail ? (
          <div className="flex flex-col gap-6">
            <section className="rounded-[24px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
              <dl className="grid gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6C7F95]">From</dt>
                  <dd className="font-semibold text-[#10203B]">
                    {selectedEmail.sender || "IBPA Support"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6C7F95]">Recipients</dt>
                  <dd className="font-semibold tabular-nums text-[#10203B]">
                    {getEmailLogRecipientCount(selectedEmail)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6C7F95]">Created</dt>
                  <dd className="text-[#10203B]">{formatAdminDateTime(selectedEmail.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6C7F95]">Sent</dt>
                  <dd className="text-[#10203B]">
                    {formatAdminDateTime(selectedEmail.sentAt || selectedEmail.createdAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-white shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
              <header className="flex items-center justify-between border-b border-[#E4EEF8] px-6 py-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
                  Body
                </span>
                <span className="text-xs text-[#6C7F95]">Rendered preview</span>
              </header>
              <div className="bg-white p-7">
                {selectedEmail.content ? (
                  <div
                    className="prose prose-sm max-w-none text-[#10203B]"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                  />
                ) : (
                  <p className="text-sm text-[#6C7F95]">No body recorded for this campaign.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </AdminSheet>
    </>
  );
}
