"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  deleteProfileMembership,
  getProfile,
  listProfiles,
  removeProfileCertificate,
  resendProfileCertificate,
  saveProfileCertificate,
} from "../server/profile-admin.repository";
import {
  filterProfileRecords,
  toProfileRecord,
} from "../server/profile-admin.service";
import type {
  AdminProfileFilters,
  AdminProfileRecord,
} from "../types/profile-admin.types";
import { ProfileReviewView } from "./ProfileReviewView";
import { ProfilesTable } from "./ProfilesTable";

const initialFilters: AdminProfileFilters = {
  completion: "all",
  membership: "all",
};

export function AdminProfilesPage() {
  const {
    deferredSearch,
    filters,
    resetFilters,
    search,
    setFilter,
    setSearch,
  } = useAdminFilters(initialFilters);
  const [profiles, setProfiles] = useState<AdminProfileRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AdminProfileRecord | null>(null);
  const [pendingCertificateUrl, setPendingCertificateUrl] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadProfiles = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await listProfiles({ q: deferredSearch });
      const nextProfiles = Array.isArray(response.items)
        ? response.items.map(toProfileRecord)
        : [];
      setProfiles(nextProfiles);
      setCategories(Array.isArray(response.categories) ? response.categories : []);
      setTotalProfiles(Number(response.total) || 0);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load profiles.");
      if (!silent) {
        setProfiles([]);
        setCategories([]);
        setTotalProfiles(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const filteredProfiles = useMemo(
    () => filterProfileRecords(profiles, filters),
    [filters, profiles],
  );

  const openProfile = async (profile: AdminProfileRecord) => {
    setSelectedProfile(profile);
    setPendingCertificateUrl(null);
    setIsLoadingDetail(true);

    try {
      const detail = await getProfile(profile.id);
      setSelectedProfile(toProfileRecord(detail));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load profile.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const refreshSelected = async () => {
    if (!selectedProfile) return;
    await openProfile(selectedProfile);
    await loadProfiles({ silent: true });
  };

  const runAction = async (action: string, callback: () => Promise<void>) => {
    setBusyAction(action);
    try {
      await callback();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveCertificate = () => {
    if (!selectedProfile || !pendingCertificateUrl) return;

    void runAction("save", async () => {
      await saveProfileCertificate(selectedProfile.id, pendingCertificateUrl);
      setPendingCertificateUrl(null);
      toast.success("Certificate saved.");
      await refreshSelected();
    });
  };

  const handleRemoveCertificate = () => {
    if (!selectedProfile) return;
    if (!window.confirm("Remove this certificate PDF?")) return;

    void runAction("remove", async () => {
      await removeProfileCertificate(selectedProfile.id);
      toast.success("Certificate removed.");
      await refreshSelected();
    });
  };

  const handleResendCertificate = () => {
    if (!selectedProfile) return;

    void runAction("resend", async () => {
      await resendProfileCertificate(selectedProfile.id);
      toast.success("Certificate email sent.");
    });
  };

  const handleDelete = () => {
    if (!selectedProfile) return;
    if (!window.confirm("Delete this membership/profile record? This cannot be undone.")) return;

    void runAction("delete", async () => {
      await deleteProfileMembership(selectedProfile.id);
      setSelectedProfile(null);
      toast.success("Profile membership deleted.");
      await loadProfiles({ silent: true });
    });
  };

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadProfiles()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Review member-owned profiles, public preview readiness, services, media, certificates, and completion."
      lastSyncedAt={lastSyncedAt}
      title="Profiles"
    >
      <AdminFilters>
        <AdminSearch
          onChange={setSearch}
          placeholder="Search by name, email, certificate, or membership"
          value={search}
        />
        <Select
          onValueChange={(value) => setFilter("membership", value)}
          value={filters.membership}
        >
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Membership" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All memberships</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("completion", value as AdminProfileFilters["completion"])}
          value={filters.completion}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Completion" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All completion</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="needs_work">Needs work</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
        <AdminSectionCard
          description={formatAdminCount(totalProfiles, "profile")}
          title="Profile directory"
        >
          <ProfilesTable
            isLoading={isLoading}
            onOpen={openProfile}
            profiles={filteredProfiles}
            selectedId={selectedProfile?.id ?? null}
          />
        </AdminSectionCard>

        <ProfileReviewView
          busyAction={busyAction}
          isLoading={isLoadingDetail}
          onCertificateUploaded={setPendingCertificateUrl}
          onDelete={handleDelete}
          onRemoveCertificate={handleRemoveCertificate}
          onResendCertificate={handleResendCertificate}
          onSaveCertificate={handleSaveCertificate}
          pendingCertificateUrl={pendingCertificateUrl}
          profile={selectedProfile}
        />
      </div>
    </AdminPageShell>
  );
}
