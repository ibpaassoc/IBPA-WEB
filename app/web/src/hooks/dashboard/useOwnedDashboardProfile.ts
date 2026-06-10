"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { DashboardProfileData } from "@/components/dashboard/dashboard-types";
import { useI18n } from "@/lib/i18n";

export function useOwnedDashboardProfile() {
  const { t } = useI18n();

  const [profile, setProfile] = useState<DashboardProfileData | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessBlockedMessage, setAccessBlockedMessage] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/profile", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setAccessBlocked(true);
        setAccessBlockedMessage(t.dashboard.editProfile.profileBlocked);
        setProfile(null);
        return;
      }

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : t.dashboard.editProfile.loadError,
        );
      }

      const nextProfile = (data.profile || {}) as DashboardProfileData;
      if (nextProfile.dashboardAccessType === "partner_team_member") {
        setAccessBlocked(true);
        setAccessBlockedMessage(t.dashboard.editProfile.teamMemberBlocked);
        setProfile(null);
        return;
      }

      setAccessBlocked(false);
      setAccessBlockedMessage(null);
      setProfile(nextProfile);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.dashboard.editProfile.loadError,
      );
    } finally {
      setLoading(false);
    }
  }, [
    t.dashboard.editProfile.loadError,
    t.dashboard.editProfile.profileBlocked,
    t.dashboard.editProfile.teamMemberBlocked,
  ]);

  useEffect(() => {
    // Loading the owned profile is the external synchronization this hook manages on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  return {
    profile,
    setProfile,
    accessBlocked,
    accessBlockedMessage,
    loading,
    loadProfile,
  };
}
