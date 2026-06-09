"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMembershipCategory } from "@/lib/membership";

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  addMemberApplicationFiles,
  approveMemberApplication,
  approvePartnerApplication,
  deleteMemberApplication,
  deleteMemberApplicationFile,
  deletePartnerApplication,
  getMemberApplication,
  getPartnerApplication,
  listMemberApplicationFiles,
  moveMemberApplicationToReview,
  rejectMemberApplication,
  rejectPartnerApplication,
  resendMemberPaymentLink,
  updateMemberApplication,
} from "../server/application-admin.repository";
import {
  filterApplicationRecords,
  listApplicationQueue,
  toMemberApplicationRecord,
  toPartnerApplicationRecord,
} from "../server/application-admin.service";
import type {
  AdminApplicationFilters,
  AdminApplicationRecord,
  ApplicationAdditionalFile,
  MemberApplicationDetail,
  PartnerApplicationDetail,
} from "../types/application-admin.types";
import { ApplicationExpandableRow } from "./ApplicationExpandableRow";

const baseFilters: AdminApplicationFilters = {
  applicantType: "all",
  paymentStatus: "all",
  status: "all",
};

function selectedKey(record?: AdminApplicationRecord | null) {
  return record ? `${record.kind}:${record.id}` : null;
}

function readApplicantTypeParam(value: string | null): "all" | "member" | "partner" {
  return value === "member" || value === "partner" ? value : "all";
}

export function AdminApplicationsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialFilters: AdminApplicationFilters = {
    ...baseFilters,
    applicantType: readApplicantTypeParam(searchParams.get("applicantType")),
  };

  const {
    deferredSearch,
    filters,
    isPending,
    resetFilters,
    search,
    setFilter,
    setSearch,
  } = useAdminFilters(initialFilters, initialQuery);
  const [applications, setApplications] = useState<AdminApplicationRecord[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [partnerTotal, setPartnerTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdminApplicationRecord | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberApplicationDetail | null>(null);
  const [partnerDetail, setPartnerDetail] = useState<PartnerApplicationDetail | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<ApplicationAdditionalFile[]>([]);
  const [selectedMembershipCategory, setSelectedMembershipCategory] = useState("");
  const [selectedPartnerTier, setSelectedPartnerTier] = useState("Associate");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadApplications = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const queue = await listApplicationQueue({ q: deferredSearch });
      setApplications(queue.records);
      setMemberTotal(queue.memberTotal);
      setPartnerTotal(queue.partnerTotal);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load applications.");
      if (!silent) {
        setApplications([]);
        setMemberTotal(0);
        setPartnerTotal(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
    // loadApplications is intentionally scoped to the latest deferred search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const filteredApplications = useMemo(
    () => filterApplicationRecords(applications, filters),
    [applications, filters],
  );

  const openApplication = async (record: AdminApplicationRecord) => {
    if (selectedApplication && selectedKey(selectedApplication) === selectedKey(record)) {
      setSelectedApplication(null);
      return;
    }
    setSelectedApplication(record);
    setMemberDetail(null);
    setPartnerDetail(null);
    setAdditionalFiles([]);
    setIsLoadingDetail(true);

    try {
      if (record.kind === "member") {
        const detail = await getMemberApplication(record.id);
        setMemberDetail(detail);
        setSelectedApplication(toMemberApplicationRecord(detail));
        setSelectedMembershipCategory(getMembershipCategory(detail.membershipCategory) ?? "");
        setIsLoadingFiles(true);
        const fileResponse = await listMemberApplicationFiles(record.id);
        setAdditionalFiles(Array.isArray(fileResponse.files) ? fileResponse.files : []);
      } else {
        const detail = await getPartnerApplication(record.id);
        setPartnerDetail(detail);
        setSelectedApplication(toPartnerApplicationRecord(detail));
        setSelectedPartnerTier(detail.requestedTier || "Associate");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load application details.");
    } finally {
      setIsLoadingDetail(false);
      setIsLoadingFiles(false);
    }
  };

  const refreshSelectedApplication = async () => {
    if (!selectedApplication) return;
    await openApplication(selectedApplication);
    await loadApplications({ silent: true });
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

  const handleApprove = () => {
    if (!selectedApplication) return;

    void runAction("approve", async () => {
      if (selectedApplication.kind === "member") {
        const result = await approveMemberApplication(selectedApplication.id);
        setMemberDetail((current) =>
          current
            ? {
                ...current,
                certificateNumber: result.certificateNumber ?? current.certificateNumber,
                checkoutUrl: result.checkoutUrl ?? current.checkoutUrl,
                status: "approved",
              }
            : current,
        );
        toast.success("Member application approved.");
      } else {
        await approvePartnerApplication(selectedApplication.id, selectedPartnerTier);
        toast.success("Partner application approved and payment link sent.");
      }

      await refreshSelectedApplication();
    });
  };

  const handleReject = () => {
    if (!selectedApplication) return;
    if (!window.confirm("Reject this application?")) return;

    void runAction("reject", async () => {
      if (selectedApplication.kind === "member") {
        await rejectMemberApplication(selectedApplication.id);
        toast.success("Member application rejected.");
      } else {
        await rejectPartnerApplication(selectedApplication.id);
        toast.success("Partner application rejected.");
      }

      await refreshSelectedApplication();
    });
  };

  const handleReview = () => {
    if (!selectedApplication || selectedApplication.kind !== "member") return;

    void runAction("review", async () => {
      await moveMemberApplicationToReview(selectedApplication.id);
      toast.success("Application moved to additional review.");
      await refreshSelectedApplication();
    });
  };

  const handleSaveMembershipCategory = () => {
    if (!selectedApplication || selectedApplication.kind !== "member") return;

    void runAction("membership", async () => {
      if (!selectedMembershipCategory) {
        throw new Error("Choose a membership package first.");
      }

      const result = await updateMemberApplication(selectedApplication.id, {
        membershipCategory: selectedMembershipCategory,
      });
      if (result.application) {
        setMemberDetail(result.application);
      }
      toast.success("Membership package saved.");
      await refreshSelectedApplication();
    });
  };

  const handleResendPaymentLink = () => {
    if (!selectedApplication || selectedApplication.kind !== "member") return;
    if (!window.confirm("Send a fresh payment link to this applicant?")) return;

    void runAction("resend", async () => {
      const result = await resendMemberPaymentLink(selectedApplication.id);
      const paymentLink = result.paymentLinkUrl || result.checkoutUrl;
      if (paymentLink) {
        await navigator.clipboard?.writeText(paymentLink).catch(() => undefined);
      }
      toast.success("Payment link sent.");
      await refreshSelectedApplication();
    });
  };

  const handleDelete = () => {
    if (!selectedApplication) return;
    if (!window.confirm("Delete this application record? This cannot be undone.")) return;

    void runAction("delete", async () => {
      if (selectedApplication.kind === "member") {
        await deleteMemberApplication(selectedApplication.id);
      } else {
        await deletePartnerApplication(selectedApplication.id);
      }

      setSelectedApplication(null);
      setMemberDetail(null);
      setPartnerDetail(null);
      setAdditionalFiles([]);
      toast.success("Application deleted.");
      await loadApplications({ silent: true });
    });
  };

  const handleUploadAdditionalFile = async (
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => {
    if (!selectedApplication || selectedApplication.kind !== "member") return;

    try {
      const result = await addMemberApplicationFiles(selectedApplication.id, [
        {
          fileKey: metadata?.fileKey || null,
          fileName: metadata?.fileName || url.split("/").pop() || "Uploaded file",
          fileType: metadata?.fileType || "",
          fileUrl: url,
        },
      ]);
      setAdditionalFiles((current) => [...(result.files ?? []), ...current]);
      toast.success("Additional file added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save uploaded file.");
    }
  };

  const handleDeleteAdditionalFile = (fileId: string) => {
    if (!selectedApplication || selectedApplication.kind !== "member") return;
    if (!window.confirm("Delete this uploaded file?")) return;

    void runAction(`file:${fileId}`, async () => {
      await deleteMemberApplicationFile(selectedApplication.id, fileId);
      setAdditionalFiles((current) => current.filter((file) => file.id !== fileId));
      toast.success("File deleted.");
    });
  };

  const totalsLabel = `${formatAdminCount(memberTotal, "member application")} · ${formatAdminCount(
    partnerTotal,
    "partner application",
  )}`;

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadApplications()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Review member and partner applications without mixing in profile-management workflows."
      lastSyncedAt={lastSyncedAt}
      title="Applications"
    >
      <AdminFilters>
        <AdminSearch
          onChange={setSearch}
          placeholder="Search by applicant, email, package, or type"
          value={search}
        />
        <Select
          onValueChange={(value) => setFilter("applicantType", value as AdminApplicationFilters["applicantType"])}
          value={filters.applicantType}
        >
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Applicant type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All applicants</SelectItem>
              <SelectItem value="member">Members</SelectItem>
              <SelectItem value="partner">Partners</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("status", value as AdminApplicationFilters["status"])}
          value={filters.status}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="review">Additional review</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("paymentStatus", value as AdminApplicationFilters["paymentStatus"])}
          value={filters.paymentStatus}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="not_requested">Not requested</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <AdminSectionCard
        description={`${totalsLabel}${isPending ? " · filtering" : ""}`}
        noPadding
        title="Application queue"
      >
        {isLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="flex items-center gap-3 border-b border-border px-4 py-3" key={i}>
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No applications match the current filters.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span className="w-8 shrink-0" />
              <span className="flex-1">Applicant</span>
              <span className="hidden w-28 shrink-0 sm:block">Type</span>
              <span className="hidden w-20 shrink-0 sm:block">Status</span>
              <span className="hidden w-20 shrink-0 text-right lg:block">Submitted</span>
              <span className="w-6 shrink-0" />
            </div>
            {filteredApplications.map((record) => {
              const key = selectedKey(record);
              const isOpen = key === selectedKey(selectedApplication);
              return (
                <ApplicationExpandableRow
                  additionalFiles={additionalFiles}
                  busyAction={busyAction}
                  isLoadingDetail={isLoadingDetail}
                  isLoadingFiles={isLoadingFiles}
                  isOpen={isOpen}
                  key={key}
                  memberDetail={memberDetail}
                  onApprove={handleApprove}
                  onDelete={handleDelete}
                  onDeleteAdditionalFile={handleDeleteAdditionalFile}
                  onMembershipCategoryChange={setSelectedMembershipCategory}
                  onPartnerTierChange={setSelectedPartnerTier}
                  onReject={handleReject}
                  onResendPaymentLink={handleResendPaymentLink}
                  onReview={handleReview}
                  onSaveMembershipCategory={handleSaveMembershipCategory}
                  onToggle={openApplication}
                  onUploadAdditionalFile={handleUploadAdditionalFile}
                  partnerDetail={partnerDetail}
                  record={record}
                  selectedMembershipCategory={selectedMembershipCategory}
                  selectedPartnerTier={selectedPartnerTier}
                />
              );
            })}
          </div>
        )}
      </AdminSectionCard>
    </AdminPageShell>
  );
}
