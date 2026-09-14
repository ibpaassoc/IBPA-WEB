"use client";

import { useEffect, useState } from "react";
import type { SupportMode, TabType } from "@/components/dashboard/dashboard-types";

export function useDashboardUiState() {
  // Pages outside the tab shell (e.g. the webinar player) link back with
  // ?tab=webinars. The dashboard renders a loader until Clerk is ready, so the
  // client-only initial value never causes a hydration mismatch.
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("tab") === "webinars"
      ? "webinars"
      : "dashboard",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [eventRegistrationFilter, setEventRegistrationFilter] = useState<
    "all" | "registered" | "not_registered"
  >("all");
  const [supportMode, setSupportMode] = useState<SupportMode>("question");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow =
      isMobileMenuOpen || isNotificationsOpen ? "hidden" : previousOverflow || "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen, isNotificationsOpen]);

  return {
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    eventRegistrationFilter,
    setEventRegistrationFilter,
    supportMode,
    setSupportMode,
  };
}
