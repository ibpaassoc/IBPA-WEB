"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

import { getProfile, listProfiles, saveProfileCertificate, removeProfileCertificate, resendProfileCertificate, deleteProfileMembership } from "../../profiles/server/profile-admin.repository";
import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import { filterMemberRecords, toMemberRecord } from "../server/members-admin.service";
import type { AdminMemberFilters, AdminMemberRecord, MemberTab } from "../types/members-admin.types";
import { MemberExpandableRow } from "./MemberExpandableRow";

const baseFilters: AdminMemberFilters = {
  certificate: "all",
  membership: "all",
};

// Initial page size — further rows stream in via "Load more" so the first
// paint of the directory stays small and fast.
const PAGE_SIZE = 30;

function readTabParam(value: string | null): MemberTab {
  if (value === "membership" || value === "certificate") return value;
  return "profile";
}

function memberId(member?: AdminMemberRecord | null) {
  return member?.id ?? null;
}

export function AdminMembersPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialTab = readTabParam(searchParams.get("tab"));

  const { deferredSearch, filters, isPending, resetFilters, search, setFilter, setSearch } =
    useAdminFilters<AdminMemberFilters>(baseFilters, initialQuery);

  const [members, setMembers] = useState<AdminMemberRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedMember, setSelectedMember] = useState<AdminMemberRecord | null>(null);
  const [detailedMember, setDetailedMember] = useState<AdminMemberRecord | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const openMemberIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<MemberTab>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadMembers = async ({
    silent = false,
    limit,
  }: { silent?: boolean; limit?: number } = {}) => {
    if (!silent) setIsLoading(true);

    try {
      const response = await listProfiles({
        limit: limit ?? PAGE_SIZE,
        q: deferredSearch,
      });
      const nextMembers = Array.isArray(response.items)
        ? response.items.map(toMemberRecord)
        : [];
      setMembers(nextMembers);
      setCategories(Array.isArray(response.categories) ? response.categories : []);
      setTotal(typeof response.total === "number" ? response.total : nextMembers.length);
      setHasMore(Boolean(response.hasMore));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load members.");
      if (!silent) {
        setMembers([]);
        setCategories([]);
        setTotal(0);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);

    try {
      const response = await listProfiles({
        limit: PAGE_SIZE,
        offset: members.length,
        q: deferredSearch,
      });
      const nextMembers = Array.isArray(response.items)
        ? response.items.map(toMemberRecord)
        : [];
      setMembers((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...nextMembers.filter((m) => !seen.has(m.id))];
      });
      setTotal(typeof response.total === "number" ? response.total : total);
      setHasMore(Boolean(response.hasMore));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load more members.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Silent refresh keeps the currently loaded window instead of collapsing
  // back to the first page after an action.
  const refreshLoaded = () =>
    loadMembers({ silent: true, limit: Math.max(PAGE_SIZE, members.length) });

  const loadMemberDetail = (id: string) => {
    openMemberIdRef.current = id;
    setDetailedMember(null);
    setIsLoadingDetail(true);

    getProfile(id)
      .then((detail) => {
        if (openMemberIdRef.current !== id) return;
        setDetailedMember(toMemberRecord(detail));
      })
      .catch(() => {
        // Fall back to the (slimmer) list record already on screen.
      })
      .finally(() => {
        if (openMemberIdRef.current === id) setIsLoadingDetail(false);
      });
  };

  useEffect(() => {
    void loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const filteredMembers = useMemo(
    () => filterMemberRecords(members, filters),
    [members, filters],
  );

  const openMember = (member: AdminMemberRecord, tab?: MemberTab) => {
    const alreadyOpen = memberId(selectedMember) === member.id;

    if (alreadyOpen && tab) {
      // Just switch tab — keep panel open
      setActiveTab(tab);
      return;
    }

    if (alreadyOpen && !tab) {
      // Toggle closed
      setSelectedMember(null);
      openMemberIdRef.current = null;
      setDetailedMember(null);
      return;
    }

    // Open a new member, optionally on a specific tab
    if (tab) setActiveTab(tab);
    setSelectedMember(member);
    setSelectedCategory(member.membershipCategory ?? "");
    // The list ships only slim rows — bio, services, and portfolio load here.
    loadMemberDetail(member.id);
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

  const handleSaveCategory = () => {
    if (!selectedMember) return;

    void runAction("membership", async () => {
      if (!selectedCategory) throw new Error("Select a membership package first.");
      await refreshLoaded();
      toast.success("Membership category updated.");
    });
  };

  const handleDeleteMembership = () => {
    if (!selectedMember) return;
    if (!window.confirm("Delete this member's membership? This cannot be undone.")) return;

    void runAction("delete_membership", async () => {
      await deleteProfileMembership(selectedMember.id);
      setSelectedMember(null);
      openMemberIdRef.current = null;
      setDetailedMember(null);
      toast.success("Membership deleted.");
      await refreshLoaded();
    });
  };

  const handleIssueCertificate = (
    url: string,
    metadata?: { fileKey?: string | null },
  ) => {
    if (!selectedMember) return;

    void runAction("issue_cert", async () => {
      await saveProfileCertificate(selectedMember.id, url);
      toast.success("Certificate saved.");
      await refreshLoaded();
      loadMemberDetail(selectedMember.id);
    });
  };

  const handleResendCertificate = () => {
    if (!selectedMember) return;

    void runAction("resend", async () => {
      await resendProfileCertificate(selectedMember.id);
      toast.success("Certificate email sent.");
    });
  };

  const handleRemoveCertificate = () => {
    if (!selectedMember) return;
    if (!window.confirm("Remove the certificate from this member's profile?")) return;

    void runAction("remove_cert", async () => {
      await removeProfileCertificate(selectedMember.id);
      toast.success("Certificate removed.");
      await refreshLoaded();
      loadMemberDetail(selectedMember.id);
    });
  };

  const hasClientFilters =
    filters.membership !== "all" || filters.certificate !== "all";
  const totalLabel = hasClientFilters
    ? `${formatAdminCount(filteredMembers.length, "member")} shown${isPending ? " · filtering" : ""}`
    : `${formatAdminCount(total || filteredMembers.length, "member")}${isPending ? " · filtering" : ""}`;

  return (
    <AdminPageShell
      actions={
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={() => void loadMembers()}
          type="button"
          variant="outline"
        >
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      title="Members"
    >
      <AdminFilters>
        <AdminSearch
          onChange={setSearch}
          placeholder="Search by name, email, or membership"
          value={search}
        />
        <Select
          onValueChange={(value) => setFilter("membership", value)}
          value={filters.membership}
        >
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-52">
            <SelectValue placeholder="Membership" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All memberships</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) =>
            setFilter("certificate", value as AdminMemberFilters["certificate"])
          }
          value={filters.certificate}
        >
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-44">
            <SelectValue placeholder="Certificate" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All certificates</SelectItem>
              <SelectItem value="issued">Certificate issued</SelectItem>
              <SelectItem value="not_issued">Not issued</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={resetFilters}
          type="button"
          variant="ghost"
        >
          Reset
        </Button>
      </AdminFilters>

      <AdminSectionCard description={totalLabel} noPadding title="Member directory">
        {isLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                className="flex items-center gap-3 border-b border-[#E4EEF8] px-5 py-3"
                key={i}
              >
                <Skeleton className="size-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#6C7F95]">
            No members match the current filters.
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Column headers */}
            <div className="flex items-center gap-4 border-b border-[#D7E5F4] bg-[#F6FAFF] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]">
              <span className="w-10 shrink-0" />
              <span className="flex-1">Member</span>
              <span className="hidden shrink-0 md:block w-[150px]">Certificate</span>
              <span className="hidden shrink-0 md:block w-[110px]">Expiry</span>
              <span className="hidden shrink-0 lg:block w-[150px]">Membership</span>
              <span className="w-9 shrink-0" />
            </div>

            {filteredMembers.map((member) => {
              const isOpen = memberId(selectedMember) === member.id;
              return (
                <MemberExpandableRow
                  activeTab={activeTab}
                  busyAction={busyAction}
                  detail={isOpen ? detailedMember : null}
                  isLoadingDetail={isOpen && isLoadingDetail}
                  isOpen={isOpen}
                  key={member.id}
                  member={member}
                  onCategoryChange={setSelectedCategory}
                  onDeleteMembership={handleDeleteMembership}
                  onIssueCertificate={handleIssueCertificate}
                  onRemoveCertificate={handleRemoveCertificate}
                  onResendCertificate={handleResendCertificate}
                  onSaveCategory={handleSaveCategory}
                  onTabChange={setActiveTab}
                  onToggle={openMember}
                  selectedCategory={selectedCategory}
                />
              );
            })}

            {hasMore ? (
              <div className="border-t border-[#E4EEF8] p-4">
                <Button
                  className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
                  disabled={isLoadingMore}
                  onClick={() => void loadMore()}
                  type="button"
                  variant="outline"
                >
                  {isLoadingMore
                    ? "Loading…"
                    : `Load more (${members.length} of ${total})`}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </AdminSectionCard>
    </AdminPageShell>
  );
}
