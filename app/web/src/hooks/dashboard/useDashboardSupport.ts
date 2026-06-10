"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SupportMode } from "@/components/dashboard/dashboard-types";
import { useI18n } from "@/lib/i18n";

type Params = {
  supportMode: SupportMode;
  fullName: string;
  fallbackFullName?: string | null;
  dashboardContactEmail: string;
  memberIdDisplay: string;
  membershipCategoryLabel: string;
};

export function useDashboardSupport({
  supportMode,
  fullName,
  fallbackFullName,
  dashboardContactEmail,
  memberIdDisplay,
  membershipCategoryLabel,
}: Params) {
  const { t } = useI18n();
  const dashboard = t.dashboard;
  const [supportMessage, setSupportMessage] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const supportTopicLabel = useMemo(() => {
    if (supportMode === "idea") return dashboard.support.idea;
    if (supportMode === "problem") return dashboard.support.problem;
    return dashboard.support.question;
  }, [dashboard.support.idea, dashboard.support.problem, dashboard.support.question, supportMode]);

  const faqItems = dashboard.support.faqItems;

  const handleSupportSubmit = useCallback(async () => {
    const memberName = fullName || fallbackFullName || "IBPA Member";
    const email = dashboardContactEmail;

    if (!email) {
      toast.error(dashboard.support.emailRequired);
      return;
    }

    if (supportMessage.trim().length < 20) {
      toast.error(dashboard.support.messageTooShort);
      return;
    }

    setSupportSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName,
          email,
          phone: supportPhone.trim() || undefined,
          source: `Dashboard Support - ${supportTopicLabel}`,
          message: `${supportTopicLabel}\n\nMember ID: ${memberIdDisplay}\nMembership: ${membershipCategoryLabel}\n\n${supportMessage.trim()}`,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : dashboard.support.sendError,
        );
      }

      toast.success(dashboard.support.sendSuccess);
      setSupportMessage("");
      setSupportPhone("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : dashboard.support.sendError,
      );
    } finally {
      setSupportSubmitting(false);
    }
  }, [
    dashboard.support.emailRequired,
    dashboard.support.messageTooShort,
    dashboard.support.sendError,
    dashboard.support.sendSuccess,
    dashboardContactEmail,
    fallbackFullName,
    fullName,
    memberIdDisplay,
    membershipCategoryLabel,
    supportMessage,
    supportPhone,
    supportTopicLabel,
  ]);

  return {
    supportMessage,
    setSupportMessage,
    supportPhone,
    setSupportPhone,
    supportSubmitting,
    supportTopicLabel,
    handleSupportSubmit,
    faqItems,
  };
}
