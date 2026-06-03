"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SupportMode } from "@/components/dashboard/dashboard-types";

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
  const [supportMessage, setSupportMessage] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const supportTopicLabel = useMemo(() => {
    if (supportMode === "idea") return "Suggest an idea";
    if (supportMode === "problem") return "Report a problem";
    return "Ask a question";
  }, [supportMode]);

  const quickAnswers = [
    "Support replies arrive through the existing IBPA contact workflow.",
    "Public profile sharing uses your live member page link.",
    "Directory visibility depends on active paid membership.",
  ];

  const faqItems = [
    {
      question: "How do I update my public profile?",
      answer:
        "Open Edit Profile to refresh your photo, contact details, specialization, and biography.",
    },
    {
      question: "Where do certificate files appear?",
      answer:
        "Issued certificate files appear in My Certificates after administrative review and upload.",
    },
    {
      question: "How are reminders delivered?",
      answer:
        "IBPA can send reminders, updates, and invitations through the existing email workflow when those automations are enabled.",
    },
    {
      question: "Can I change my membership plan online?",
      answer:
        "Plan change and renewal actions are surfaced here, while final payment flow still follows the existing membership process.",
    },
  ];

  const handleSupportSubmit = useCallback(async () => {
    const memberName = fullName || fallbackFullName || "IBPA Member";
    const email = dashboardContactEmail;

    if (!email) {
      toast.error("A signed-in email address is required to send support requests.");
      return;
    }

    if (supportMessage.trim().length < 20) {
      toast.error(
        "Please provide at least 20 characters so the support team has enough context.",
      );
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
            : "Failed to send support request.",
        );
      }

      toast.success("Your request was sent to IBPA support.");
      setSupportMessage("");
      setSupportPhone("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send support request.",
      );
    } finally {
      setSupportSubmitting(false);
    }
  }, [
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
    quickAnswers,
    faqItems,
  };
}
