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
  dashboardSubtlePanelClassName,
  dashboardTextareaClassName,
  getDashboardSelectableCardClassName,
  SectionCard,
  SectionHeader,
} from "@/components/dashboard/DashboardShared";
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
        <SectionHeader title="Support" />

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {SUPPORT_OPTIONS.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSupportMode(option.key)}
                className={getDashboardSelectableCardClassName(
                  supportMode === option.key,
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                      supportMode === option.key
                        ? "bg-white/12 text-white"
                        : "bg-slate-100 text-[#4C7D9D]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p
                      className={`mt-1 text-sm leading-6 ${
                        supportMode === option.key
                          ? "text-white/75"
                          : "text-slate-500"
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

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSupportSubmit();
            }}
            className={`${dashboardSubtlePanelClassName} p-5`}
          >
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Submit a Request
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Use the existing support workflow and the team will follow up by email.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Member email</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {dashboardContactEmail || "Unavailable"}
                </p>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Member ID</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {memberIdDisplay}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4">
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

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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

          <div className="space-y-4">
            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Quick Help
              </h3>

              <div className="mt-4 space-y-3">
                {quickAnswers.map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className={`${dashboardSubtlePanelClassName} p-5`}>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                FAQ
              </h3>

              <div className="mt-4 space-y-3">
                {faqItems.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
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
      </SectionCard>
    </div>
  );
}
