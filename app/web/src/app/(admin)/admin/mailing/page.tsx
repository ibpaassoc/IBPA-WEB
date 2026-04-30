"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Link2, Loader2, Mail, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminClient } from "@/lib/admin-types";

type MailingTab = "email" | "dashboard";

export default function MailingPage() {
  const [activeTab, setActiveTab] = useState<MailingTab>("email");
  const [isSending, setIsSending] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState("all");

  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationCtaLabel, setNotificationCtaLabel] = useState("");
  const [notificationCtaUrl, setNotificationCtaUrl] = useState("");

  const [clients, setClients] = useState<AdminClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchClients = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoadingClients(true);
    }

    try {
      const resp = await fetch("/api/cards", { cache: "no-store" });
      if (resp.ok) {
        const data = await resp.json();
        setClients(data);
        setSelectedEmails(new Set(data.map((c: AdminClient) => c.email)));
        setLastSyncedAt(new Date().toISOString());
      }
    } catch (error) {
      if (!silent) {
        console.error("Failed to load clients", error);
      }
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchClients({ silent: true });
    }, 30000);

    const handleFocus = () => {
      void fetchClients({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchClients({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    if (audienceFilter === "all") return clients;
    return clients.filter((c) => c.membershipCategory === audienceFilter || c.cardName === audienceFilter);
  }, [clients, audienceFilter]);

  useEffect(() => {
    setSelectedEmails(new Set(filteredClients.map((c) => c.email)));
  }, [filteredClients]);

  const toggleClient = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const selectedCount = selectedEmails.size;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Пожалуйста, заполните тему и текст письма.");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Не выбран ни один получатель.");
      return;
    }

    if (!window.confirm(`Отправить email-рассылку ${selectedCount} получателям?`)) {
      return;
    }

    setIsSending(true);
    try {
      const htmlContent = emailMessage.replace(/\n/g, "<br>");

      const resp = await fetch("/api/admin/mailing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: Array.from(selectedEmails),
          subject: emailSubject,
          html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">${htmlContent}</div>`,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка при отправке");
      }

      const result = await resp.json();
      toast.success(`Письма отправлены: ${result.count}`);
      setEmailSubject("");
      setEmailMessage("");
    } catch (error: any) {
      toast.error(error.message || "Произошла ошибка при отправке рассылки.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error("Пожалуйста, заполните заголовок и текст уведомления.");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Не выбран ни один получатель.");
      return;
    }
    if ((notificationCtaLabel.trim() && !notificationCtaUrl.trim()) || (!notificationCtaLabel.trim() && notificationCtaUrl.trim())) {
      toast.error("Для CTA нужно заполнить и текст кнопки, и ссылку.");
      return;
    }

    if (!window.confirm(`Отправить уведомление в личный кабинет ${selectedCount} получателям?`)) {
      return;
    }

    setIsSending(true);
    try {
      const resp = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: Array.from(selectedEmails),
          title: notificationTitle,
          description: notificationMessage,
          ctaLabel: notificationCtaLabel.trim() || null,
          ctaUrl: notificationCtaUrl.trim() || null,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка при отправке уведомления");
      }

      const result = await resp.json();
      toast.success(`Уведомления добавлены: ${result.count}`);
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationCtaLabel("");
      setNotificationCtaUrl("");
    } catch (error: any) {
      toast.error(error.message || "Не удалось создать уведомления.");
    } finally {
      setIsSending(false);
    }
  };

  const categories = Array.from(new Set(clients.map((c) => c.membershipCategory || c.cardName))).filter(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-9">
      <div className="mb-8">
        <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Рассылки</h1>
        <p className="mt-1.5 text-sm font-light text-slate-500">
          Email-рассылки и внутренние уведомления для личного кабинета.
        </p>
        {lastSyncedAt && (
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
            Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
            activeTab === "email" ? "bg-black text-white" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
            activeTab === "dashboard" ? "bg-black text-white" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Bell className="h-4 w-4" />
          Dashboard Notifications
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8 h-fit">
          {activeTab === "email" ? (
            <>
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#72A0C1]/10 text-[#72A0C1]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Новое письмо</h2>
                  <p className="text-sm text-slate-400">Email-рассылка от имени IBPA</p>
                </div>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Тема письма</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Например: Важное обновление стандартов IBPA"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Текст сообщения</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Введите текст вашего письма здесь..."
                    rows={14}
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/20"
                  />
                  <p className="text-xs text-slate-400">Переносы строк будут автоматически сохранены.</p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSending || selectedCount === 0}
                    className="flex items-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#72A0C1] disabled:opacity-50 hover:shadow-xl hover:shadow-[#72A0C1]/20"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isSending ? "Отправка..." : `Отправить (${selectedCount})`}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#72A0C1]/10 text-[#72A0C1]">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Новое уведомление</h2>
                  <p className="text-sm text-slate-400">Появится в личном кабинете выбранных пользователей</p>
                </div>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Заголовок уведомления</label>
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="Например: Обновление по членству"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Текст уведомления</label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Напишите текст, который появится в центре уведомлений кабинета..."
                    rows={12}
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">CTA текст</label>
                    <input
                      type="text"
                      value={notificationCtaLabel}
                      onChange={(e) => setNotificationCtaLabel(e.target.value)}
                      placeholder="Например: Open Event"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">CTA ссылка</label>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      <input
                        type="url"
                        value={notificationCtaUrl}
                        onChange={(e) => setNotificationCtaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#72A0C1]/15 bg-[#72A0C1]/5 p-4 text-xs leading-relaxed text-slate-500">
                  Уведомление появится у выбранных пользователей в разделе <span className="font-semibold text-slate-700">Notifications</span> внутри dashboard.
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSending || selectedCount === 0}
                    className="flex items-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#72A0C1] disabled:opacity-50 hover:shadow-xl hover:shadow-[#72A0C1]/20"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                    {isSending ? "Отправка..." : `Добавить (${selectedCount})`}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="lg:col-span-5 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8 flex flex-col h-[760px]">
          <div className="mb-6">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-900">Аудитория</h3>
            <p className="mb-4 text-xs text-slate-400">Выберите получателей рассылки или уведомления</p>

            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              disabled={isLoadingClients}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-[#72A0C1]"
            >
              <option value="all">Все активные клиенты ({clients.length})</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat as string}>Категория: {cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-100/50 p-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Выбрано: {selectedCount}</span>
              <button
                onClick={() => setSelectedEmails(new Set(filteredClients.map((c) => c.email)))}
                className="text-[10px] font-bold uppercase tracking-wide text-[#72A0C1] hover:underline"
              >
                Выбрать всех
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
              {isLoadingClients ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Users className="mb-2 h-8 w-8 text-slate-200" />
                  <p className="text-sm text-slate-400">Нет подходящих клиентов</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <label
                    key={client.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                      selectedEmails.has(client.email)
                        ? "border-[#72A0C1]/30 bg-white shadow-sm"
                        : "border-transparent bg-transparent hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(client.email)}
                      onChange={() => toggleClient(client.email)}
                      className="h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${selectedEmails.has(client.email) ? "text-slate-900" : "text-slate-500"}`}>
                        {client.userName}
                      </p>
                      <p className="truncate text-[10px] tracking-wide text-slate-400">{client.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </main>
  );
}
