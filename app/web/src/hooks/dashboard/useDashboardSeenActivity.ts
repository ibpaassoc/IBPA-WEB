"use client";

import { useEffect, useMemo, useState } from "react";
import type { TabType } from "@/components/dashboard/dashboard-types";

const DASHBOARD_NEWS_SEEN_KEY = "ibpa-dashboard-news-seen";
const DASHBOARD_EVENTS_SEEN_KEY = "ibpa-dashboard-events-seen";

type Params = {
  activeTab: TabType;
  dashboardNews: any[];
  dashboardEvents: any[];
};

export function useDashboardSeenActivity({
  activeTab,
  dashboardNews,
  dashboardEvents,
}: Params) {
  const [lastSeenEventsAt, setLastSeenEventsAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setLastSeenEventsAt(window.localStorage.getItem(DASHBOARD_EVENTS_SEEN_KEY));
  }, []);

  useEffect(() => {
    if (activeTab === "events" && typeof window !== "undefined") {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(DASHBOARD_EVENTS_SEEN_KEY, timestamp);
      setLastSeenEventsAt(timestamp);
    }

    if (
      activeTab === "dashboard" &&
      typeof window !== "undefined" &&
      dashboardNews.length > 0
    ) {
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(DASHBOARD_NEWS_SEEN_KEY, timestamp);
    }
  }, [activeTab, dashboardNews.length]);

  const latestEventsAt = dashboardEvents[0]?.createdAt || null;

  const hasNewEvents = useMemo(
    () =>
      Boolean(
        latestEventsAt &&
          (!lastSeenEventsAt ||
            new Date(latestEventsAt).getTime() >
              new Date(lastSeenEventsAt).getTime()),
      ),
    [latestEventsAt, lastSeenEventsAt],
  );

  return {
    hasNewEvents,
  };
}
