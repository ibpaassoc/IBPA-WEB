import {
  Lightbulb,
  Loader2,
  Mail,
  MessageSquareText,
  TriangleAlert,
} from "lucide-react";

import {
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardTextareaClassName,
} from "@/shared/components/DashboardShared";
import type { SupportMode } from "@/components/dashboard/dashboard-types";

const SUPPORT_OPTIONS: Array<{
  key: SupportMode;
  label: string;
  description: string;
  icon: typeof MessageSquareText;
}> = [
  {
    key: "question",
    label: "Ask a question",
    description: "Get help with membership, billing, or dashboard access.",
    icon: MessageSquareText,
  },
  {
    key: "idea",
    label: "Suggest an idea",
    description: "Share improvements that would make the member experience better.",
    icon: Lightbulb,
  },
  {
    key: "problem",
    label: "Report a problem",
    description: "Flag a bug, broken workflow, or account issue for review.",
    icon: TriangleAlert,
  },
];

const SUPPORT_MODE_INDEX: Record<SupportMode, number> = {
  question: 0,
  idea: 1,
  problem: 2,
};

const floatingCardClassName =
  "rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.09)]";

const innerPanelClassName =
  "rounded-[24px] border border-[#D4E0F0] bg-[#F8FBFF] px-4 py-3";

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
  quickAnswers: _quickAnswers,
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
  const activeIndex = SUPPORT_MODE_INDEX[supportMode] ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#10203B]">
          Support
        </h1>
      </div>

      <div className={`${floatingCardClassName} p-2`}>
        <div className="relative grid gap-2 lg:grid-cols-3">
          <div
            className="pointer-events-none absolute left-0 top-0 z-0 h-[calc((100%-16px)/3)] w-full rounded-[26px] bg-[#071E41] shadow-[0_18px_45px_rgba(7,30,65,0.24)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden"
            style={{
              transform:
                activeIndex === 0
                  ? "translate3d(0, 0, 0)"
                  : activeIndex === 1
                    ? "translate3d(0, calc(100% + 8px), 0)"
                    : "translate3d(0, calc(200% + 16px), 0)",
            }}
          />

          <div
            className="pointer-events-none absolute left-0 top-0 z-0 hidden h-full w-[calc((100%-16px)/3)] rounded-[26px] bg-[#071E41] shadow-[0_18px_45px_rgba(7,30,65,0.24)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
            style={{
              transform:
                activeIndex === 0
                  ? "translate3d(0, 0, 0)"
                  : activeIndex === 1
                    ? "translate3d(calc(100% + 8px), 0, 0)"
                    : "translate3d(calc(200% + 16px), 0, 0)",
            }}
          />

          {SUPPORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = supportMode === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSupportMode(option.key)}
                className={`relative z-10 min-h-[112px] rounded-[26px] px-5 py-5 text-left transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                  isActive ? "text-white" : "text-slate-900 hover:bg-[#F8FBFF]"
                }`}
              >
                <div className="flex h-full items-start gap-4">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? "scale-105 bg-white/14 text-white shadow-sm"
                        : "scale-100 bg-[#EAF4FF] text-[#4C7D9D]"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive ? "scale-110 opacity-100" : "scale-95 opacity-80"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold leading-5">
                      {option.label}
                    </p>
                    <p
                      className={`mt-2 text-sm leading-6 transition-colors duration-300 ${
                        isActive ? "text-white/76" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSupportSubmit();
          }}
          className={floatingCardClassName}
        >
          <div className="flex items-center gap-3 border-b border-[#D4E0F0] pb-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#071E41] text-white shadow-[0_12px_28px_rgba(7,30,65,0.18)]">
              <MessageSquareText className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-semibold tracking-tight text-[#10203B]">
              {SUPPORT_OPTIONS.find((option) => option.key === supportMode)?.label ??
                "Support Request"}
            </h3>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className={innerPanelClassName}>
              <p className="text-xs font-medium text-slate-500">Member email</p>
              <p className="mt-2 truncate text-sm font-semibold text-[#10203B]">
                {dashboardContactEmail || "Unavailable"}
              </p>
            </div>

            <div className={innerPanelClassName}>
              <p className="text-xs font-medium text-slate-500">Member ID</p>
              <p className="mt-2 text-sm font-semibold text-[#10203B]">
                {memberIdDisplay}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-600">
                Phone (optional)
              </span>
              <input
                value={supportPhone}
                onChange={(event) => setSupportPhone(event.target.value)}
                placeholder="Best number for follow-up"
                className={dashboardInputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-600">
                {supportTopicLabel}
              </span>
              <textarea
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                placeholder="Share enough detail so the team can help quickly."
                className={dashboardTextareaClassName}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={supportSubmitting}
              className={dashboardPrimaryButtonClassName}
            >
              {supportSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Submit Request
            </button>

            <a
              href="mailto:support@ibpassociations.org"
              className={dashboardSecondaryButtonClassName}
            >
              Email Support Directly
            </a>
          </div>
        </form>

        <section className={floatingCardClassName}>
          <h3 className="text-lg font-semibold tracking-tight text-[#10203B]">
            FAQ
          </h3>

          <div className="mt-4 space-y-3">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-[24px] border border-[#D4E0F0] bg-[#F8FBFF] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[#10203B]">
                  {item.question}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
