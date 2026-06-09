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
import { motion } from "motion/react";
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
  parseCustomEmails,
  renderEmailHtml,
  resolveAudienceEmails,
  normalizeRecipients,
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
  const [applicationStatusEmails, setApplicationStatusEmails] = useState<Record<ApplicationAudienceStatus, string[]>>(
    emptyApplicationStatusEmails,
  );
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
    () => Array.from(new Set(recipients.map((recipient) => recipient.cardName).filter(Boolean))).sort(),
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

  const openCompose = () => {
    setComposeMode("compose");
  };

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

  return (
    <>
      <AdminPageShell
        actions={
          <>
            <Button
              className="size-10 rounded-full"
              onClick={() => void loadMailing()}
              size="icon"
              type="button"
              variant="outline"
              aria-label="Refresh mailing"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              className="group h-10 gap-2 rounded-full px-5 text-sm shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-px hover:shadow-[var(--shadow-lift)]"
              onClick={openCompose}
              type="button"
            >
              <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
              New campaign
            </Button>
          </>
        }
        eyebrow="Editorial dispatch"
        subtitle="Every campaign IBPA sends, kept as its own card. Click any campaign to inspect what went out. Compose a new one from the top right."
        title="Mailing"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-vellum flex items-end justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="editorial-eyebrow text-[11px]">Campaigns sent</span>
              <span className="font-serif text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {history.length.toLocaleString("en-US")}
              </span>
            </div>
            <Mail className="size-5 text-foreground/30" strokeWidth={1.25} />
          </div>
          <div className="card-vellum flex items-end justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="editorial-eyebrow text-[11px]">Members on file</span>
              <span className="font-serif text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {recipients.length.toLocaleString("en-US")}
              </span>
            </div>
            <Users className="size-5 text-foreground/30" strokeWidth={1.25} />
          </div>
          <div className="card-vellum flex items-end justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="editorial-eyebrow text-[11px]">Draft in browser</span>
              <span
                className={cn(
                  "font-serif text-xl font-medium tracking-tight text-foreground",
                  !draft.subject && !draft.body && "text-muted-foreground",
                )}
              >
                {draft.subject || draft.body ? draft.subject || "Unnamed draft" : "Nothing in progress"}
              </span>
            </div>
            {draft.subject || draft.body ? (
              <Button
                className="h-8 gap-1.5 rounded-full px-3 text-xs"
                onClick={openCompose}
                type="button"
                variant="outline"
              >
                <PenLine className="size-3" />
                Continue
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <span className="editorial-eyebrow text-sm">Recently sent</span>
          <span className="h-px flex-1 bg-[var(--hairline)]" />
          <div className="w-64">
            <AdminSearch
              onChange={setHistorySearch}
              placeholder="Search subject…"
              value={historySearch}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton className="h-44 rounded-3xl" key={i} style={{ backgroundColor: "var(--mist)" }} />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="card-vellum px-8 py-16 text-center">
            <p className="font-serif text-xl tracking-tight text-foreground">
              {history.length === 0 ? "No campaigns yet" : "Nothing matches your search"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {history.length === 0
                ? "When you send a campaign, it will appear here as its own card."
                : "Try another keyword from a subject or sender."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredHistory.map((email, index) => (
              <motion.button
                key={email.id}
                type="button"
                onClick={() => openDetail(email)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(0.04 + index * 0.04, 0.4),
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="card-premium group flex flex-col gap-4 p-6 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="editorial-eyebrow text-[11px]">
                    {formatAdminDate(email.sentAt || email.createdAt)}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "var(--tone-success-tint)",
                      borderColor: "rgba(74,122,71,0.20)",
                      color: "var(--tone-success)",
                    }}
                  >
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: "var(--tone-success)" }} />
                    {(email.status || "sent").toString()}
                  </span>
                </div>

                <h3
                  className="line-clamp-2 font-serif text-xl font-medium leading-snug text-foreground"
                  style={{ textWrap: "balance" }}
                >
                  {email.subject || "Untitled campaign"}
                </h3>

                {email.content ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {email.content.replace(/<[^>]+>/g, " ").trim()}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-[var(--hairline)] pt-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    <span className="font-medium text-foreground">
                      {getEmailLogRecipientCount(email)}
                    </span>{" "}
                    recipients
                  </span>
                  <span
                    className="inline-flex cursor-pointer items-center gap-1 text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteHistory(email);
                    }}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground transition-colors hover:text-destructive" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AdminPageShell>

      {/* Compose sheet */}
      <AdminSheet
        onOpenChange={(next) => (next ? null : closeCompose())}
        open={composeMode === "compose"}
        eyebrow="Dispatch · Compose"
        title="New campaign"
        description="Pick recipients, write the email, preview, then send. Drafts save to this browser."
        size="xl"
        actions={
          <Button
            className="group h-10 gap-2 rounded-full px-5 text-sm"
            disabled={isSending || finalEmails.length === 0}
            onClick={() => void handleSend()}
            type="button"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            )}
            Send to {finalEmails.length}
          </Button>
        }
      >
        <Tabs defaultValue="recipients" className="flex flex-col gap-6">
          <TabsList className="self-start">
            <TabsTrigger value="recipients">
              Recipients
              {finalEmails.length > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-medium text-[var(--primary-foreground)]">
                  {finalEmails.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="recipients" className="m-0">
            <div className="flex flex-col gap-7">
              {/* Primary: member picker */}
              <section className="flex flex-col gap-3">
                <header className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-col">
                    <span className="editorial-eyebrow text-xs">Primary</span>
                    <h3 className="font-serif text-xl font-medium tracking-tight text-foreground">
                      Choose members
                    </h3>
                    <p className="text-xs text-muted-foreground">
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

              {/* Secondary: bulk audiences (fall back when nothing picked) */}
              <section
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--hairline)] p-5",
                  useMemberPicker && "opacity-50",
                )}
              >
                <header className="flex flex-col">
                  <span className="editorial-eyebrow text-xs">Alternate · Bulk audience</span>
                  <h3 className="font-serif text-lg font-medium tracking-tight text-foreground">
                    Or send to a group
                  </h3>
                  <p className="text-xs text-muted-foreground">
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
                    <SelectTrigger className="h-10 rounded-full">
                      <SelectValue placeholder="Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all_users">All users</SelectItem>
                        <SelectItem value="members">Members</SelectItem>
                        <SelectItem value="partners">Partners</SelectItem>
                        <SelectItem value="event_registrants">Event registrants</SelectItem>
                        <SelectItem value="application_pending">Applications · pending</SelectItem>
                        <SelectItem value="application_approved">Applications · approved</SelectItem>
                        <SelectItem value="application_rejected">Applications · rejected</SelectItem>
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
                      <SelectTrigger className="h-10 rounded-full">
                        <SelectValue placeholder="Choose membership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(draft.audienceKind === "membership_type" ? membershipTypes : categories).map(
                            (item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                {draft.audienceKind === "custom" ? (
                  <Textarea
                    onChange={(event) => patch({ customEmails: event.target.value })}
                    placeholder="Paste emails separated by commas, spaces, or new lines"
                    rows={4}
                    value={draft.customEmails}
                  />
                ) : null}
                {!useMemberPicker ? (
                  <p className="text-xs text-muted-foreground">
                    Resolves to{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {resolvedAudienceEmails.length}
                    </span>{" "}
                    recipient{resolvedAudienceEmails.length === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="compose" className="m-0">
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-2">
                <span className="editorial-eyebrow text-xs">Start from a template</span>
                <div className="flex flex-wrap gap-2">
                  {mailingTemplates.map((template) => (
                    <button
                      className="rounded-full border border-[var(--hairline)] bg-white px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:-translate-y-px hover:border-[var(--hairline-strong)] hover:shadow-[var(--shadow-soft)]"
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
                    rows={14}
                    value={draft.body}
                  />
                  <FieldDescription>Line breaks are preserved in the sent email.</FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveDraft} type="button" variant="outline">
                  <Save data-icon="inline-start" />
                  Save draft
                </Button>
                <Button onClick={resetDraft} type="button" variant="ghost">
                  Clear
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="m-0">
            <MailingPreview draft={draft} recipientCount={finalEmails.length} />
          </TabsContent>
        </Tabs>
      </AdminSheet>

      {/* Detail sheet for a sent campaign */}
      <AdminSheet
        onOpenChange={(next) => (next ? null : closeDetail())}
        open={detailMode === "detail" && !!selectedEmail}
        eyebrow="Dispatch · Sent"
        title={selectedEmail?.subject ?? "Campaign"}
        description={
          selectedEmail
            ? `Sent ${formatAdminDateTime(selectedEmail.sentAt || selectedEmail.createdAt)} · ${getEmailLogRecipientCount(selectedEmail)} recipients`
            : undefined
        }
        size="lg"
      >
        {selectedEmail ? (
          <div className="flex flex-col gap-6">
            <section className="card-vellum p-6">
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium text-foreground">
                    {selectedEmail.sender || "IBPA Support"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Recipients</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {getEmailLogRecipientCount(selectedEmail)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">{formatAdminDateTime(selectedEmail.createdAt)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="text-foreground">
                    {formatAdminDateTime(selectedEmail.sentAt || selectedEmail.createdAt)}
                  </span>
                </div>
              </div>
            </section>

            <section className="card-premium overflow-hidden">
              <header className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
                <span className="editorial-eyebrow text-xs">Body</span>
                <span className="text-xs text-muted-foreground">Rendered preview</span>
              </header>
              <div className="bg-white p-7">
                {selectedEmail.content ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No body recorded for this campaign.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </AdminSheet>
    </>
  );
}
