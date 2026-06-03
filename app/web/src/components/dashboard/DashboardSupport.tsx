import { CheckCircle2, Loader2, Mail } from "lucide-react";

import { SectionCard, SectionHeader } from "@/components/dashboard/DashboardShared";
import type { SupportMode } from "@/components/dashboard/dashboard-types";

export function DashboardSupport({
  supportMode,
  setSupportMode,
  dashboardContactEmail,
  memberIdDisplay,
  supportPhone,
  setSupportPhone,
  supportTopicLabel,
  supportMessage,
  setSupportMessage,
  handleSupportSubmit,
  supportSubmitting,
  quickAnswers,
  faqItems,
}: {
  supportMode: SupportMode;
  setSupportMode: (mode: SupportMode) => void;
  dashboardContactEmail: string;
  memberIdDisplay: string;
  supportPhone: string;
  setSupportPhone: (value: string) => void;
  supportTopicLabel: string;
  supportMessage: string;
  setSupportMessage: (value: string) => void;
  handleSupportSubmit: () => Promise<void>;
  supportSubmitting: boolean;
  quickAnswers: string[];
  faqItems: {
    question: string;
    answer: string;
  }[];
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Support / Requests"
          title="Need help from IBPA?"
          description="Use the existing contact workflow directly from your cabinet to ask a question, suggest an idea, or report a problem."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
            <div className="flex flex-wrap gap-3">
              {[
                { key: "question" as const, label: "Ask a question" },
                { key: "idea" as const, label: "Suggest an idea" },
                { key: "problem" as const, label: "Report a problem" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSupportMode(option.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    supportMode === option.key
                      ? "bg-[#10203B] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Member email
                </p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">
                  {dashboardContactEmail || "Unavailable"}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Member ID
                </p>
                <p className="mt-2 text-sm font-medium text-[#10203B]">
                  {memberIdDisplay}
                </p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Phone (optional)
              </span>
              <input
                value={supportPhone}
                onChange={(event) => setSupportPhone(event.target.value)}
                placeholder="Best number for follow-up"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#10203B] outline-none transition focus:border-[#4C7D9D]"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {supportTopicLabel}
              </span>
              <textarea
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                placeholder="Share enough detail so the team can help quickly."
                className="mt-2 min-h-[170px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-[#10203B] outline-none transition focus:border-[#4C7D9D]"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleSupportSubmit()}
                disabled={supportSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {supportSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send request
              </button>

              <a
                href="mailto:support@ibpassociations.org"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
              >
                Email support directly
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                Quick answers
              </p>

              <div className="mt-4 space-y-3">
                {quickAnswers.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                FAQ
              </p>

              <div className="mt-4 space-y-3">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-sm font-medium text-[#10203B]">
                      {item.question}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
