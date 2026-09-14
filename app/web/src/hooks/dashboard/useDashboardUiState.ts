"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  SupportMode,
  TabType,
} from "@/components/dashboard/dashboard-types";

export function useDashboardUiState() {
  // Pages outside the tab shell (e.g. the webinar player) link back with
  // ?tab=webinars. Search params are available during SSR too, so the initial
  // tab is identical on server and client.
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    searchParams?.get("tab") === "webinars" ? "webinars" : "dashboard",
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
      isMobileMenuOpen || isNotificationsOpen
        ? "hidden"
        : previousOverflow || "";

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
