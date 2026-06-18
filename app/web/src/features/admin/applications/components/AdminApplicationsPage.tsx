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

import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSheet } from "../../shared/components/AdminSheet";
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
import { ApplicationDetailsPanel } from "./ApplicationDetailsPanel";
import { ApplicationListRow } from "./ApplicationListRow";
import { ApplicationMediaRail } from "./ApplicationMediaRail";
import { ApplicationReviewRail } from "./ApplicationReviewRail";

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
  const [selectedApplication, setSelectedApplication] =
    useState<AdminApplicationRecord | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberApplicationDetail | null>(null);
  const [partnerDetail, setPartnerDetail] = useState<PartnerApplicationDetail | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<ApplicationAdditionalFile[]>([]);
  const [selectedMembershipCategory, setSelectedMembershipCategory] = useState("");
  const [selectedPartnerTier, setSelectedPartnerTier] = useState("Associate");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadApplications = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true);

    try {
      const queue = await listApplicationQueue({ q: deferredSearch });
      setApplications(queue.records);
      setMemberTotal(queue.memberTotal);
      setPartnerTotal(queue.partnerTotal);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const filteredApplications = useMemo(
    () => filterApplicationRecords(applications, filters),
    [applications, filters],
  );

  const openApplication = async (record: AdminApplicationRecord) => {
    setSelectedApplication(record);
    setMemberDetail(null);
    setPartnerDetail(null);
    setAdditionalFiles([]);
    setIsLoadingDetail(true);
    setIsLoadingFiles(false);
    setSheetOpen(true);

    try {
      if (record.kind === "member") {
        const detail = await getMemberApplication(record.id);

        setMemberDetail(detail);
        setSelectedApplication(toMemberApplicationRecord(detail));
        setSelectedMembershipCategory(getMembershipCategory(detail.membershipCategory) ?? "");

        setIsLoadingDetail(false);
        setIsLoadingFiles(true);

        const fileResponse = await listMemberApplicationFiles(record.id);
        setAdditionalFiles(Array.isArray(fileResponse.files) ? fileResponse.files : []);
      } else {
        const detail = await getPartnerApplication(record.id);

        setPartnerDetail(detail);
        setSelectedApplication(toPartnerApplicationRecord(detail));
        setSelectedPartnerTier(detail.requestedTier || "Associate");
        setIsLoadingDetail(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load application details.",
      );
      setIsLoadingDetail(false);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const closeSheet = () => {
    setSheetOpen(false);
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
      closeSheet();
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

  const activeKey = selectedKey(selectedApplication);
  const renderMediaRail = () =>
    selectedApplication?.kind === "member" ? (
      <ApplicationMediaRail
        additionalFiles={additionalFiles}
        isLoadingFiles={isLoadingFiles}
        memberApplication={memberDetail}
        onDeleteAdditionalFile={handleDeleteAdditionalFile}
        onUploadAdditionalFile={handleUploadAdditionalFile}
      />
    ) : null;

  const renderReviewRail = () =>
    selectedApplication ? (
      <ApplicationReviewRail
        busyAction={busyAction}
        memberApplication={memberDetail}
        onApprove={handleApprove}
        onDelete={handleDelete}
        onMembershipCategoryChange={setSelectedMembershipCategory}
        onPartnerTierChange={setSelectedPartnerTier}
        onReject={handleReject}
        onResendPaymentLink={handleResendPaymentLink}
        onReview={handleReview}
        onSaveMembershipCategory={handleSaveMembershipCategory}
        partnerApplication={partnerDetail}
        record={selectedApplication}
        selectedMembershipCategory={selectedMembershipCategory}
        selectedPartnerTier={selectedPartnerTier}
      />
    ) : null;

  return (
    <>
      <AdminPageShell
        actions={
          <Button
            aria-label="Refresh applications"
            className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
            onClick={() => void loadApplications()}
            type="button"
            variant="outline"
          >
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        }
        eyebrow="Admin workspace"
        title="Applications"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminMetricCard active label="Members in queue" value={memberTotal} />
          <AdminMetricCard label="Partners in queue" value={partnerTotal} />
          <AdminMetricCard
            hint={isPending ? "Filtering..." : formatAdminCount(filteredApplications.length, "match")}
            label="Filtered view"
            value={filteredApplications.length}
          />
        </div>

        <section className="rounded-[28px] border border-[#D7E5F4] bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="xl:flex-1">
              <AdminSearch
                onChange={setSearch}
                placeholder="Search by name, email, package, or type"
                value={search}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                onValueChange={(value) =>
                  setFilter("applicantType", value as AdminApplicationFilters["applicantType"])
                }
                value={filters.applicantType}
              >
                <SelectTrigger className="h-10 w-40 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
                  <SelectValue placeholder="Applicant" />
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
                onValueChange={(value) =>
                  setFilter("status", value as AdminApplicationFilters["status"])
                }
                value={filters.status}
              >
                <SelectTrigger className="h-10 w-44 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
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
                onValueChange={(value) =>
                  setFilter("paymentStatus", value as AdminApplicationFilters["paymentStatus"])
                }
                value={filters.paymentStatus}
              >
                <SelectTrigger className="h-10 w-40 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
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

              <Button
                className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
                onClick={resetFilters}
                type="button"
                variant="ghost"
              >
                Reset
              </Button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton className="h-[78px] rounded-[24px] bg-white" key={index} />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-[28px] border border-[#D7E5F4] bg-white px-8 py-16 text-center shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
            <p className="text-xl font-semibold tracking-[-0.02em] text-[#10203B]">
              Nothing matches your filters
            </p>
            <p className="mt-2 text-sm text-[#6C7F95]">
              Reset the filters above to see the full queue.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredApplications.map((record, index) => (
              <ApplicationListRow
                index={index}
                isActive={selectedKey(record) === activeKey && sheetOpen}
                key={selectedKey(record) ?? `${record.kind}:${record.id}`}
                onOpen={openApplication}
                record={record}
              />
            ))}
          </div>
        )}
      </AdminPageShell>

      <AdminSheet
        description={
          selectedApplication
            ? `${selectedApplication.applicantEmail} - ${selectedApplication.membershipPackage}`
            : undefined
        }
        eyebrow={
          selectedApplication
            ? selectedApplication.kind === "member"
              ? "Member application"
              : "Partner application"
            : undefined
        }
        leftRail={renderMediaRail()}
        onOpenChange={(next) => (next ? null : closeSheet())}
        open={sheetOpen}
        rightRail={renderReviewRail()}
        size="xl"
        title={selectedApplication?.applicantName ?? "Application"}
      >
        <div className="space-y-5">
          <ApplicationDetailsPanel
            additionalFiles={additionalFiles}
            busyAction={busyAction}
            isLoading={isLoadingDetail}
            isLoadingFiles={isLoadingFiles}
            layout="inline"
            memberApplication={memberDetail}
            onApprove={handleApprove}
            onDelete={handleDelete}
            onDeleteAdditionalFile={handleDeleteAdditionalFile}
            onMembershipCategoryChange={setSelectedMembershipCategory}
            onPartnerTierChange={setSelectedPartnerTier}
            onReject={handleReject}
            onResendPaymentLink={handleResendPaymentLink}
            onReview={handleReview}
            onSaveMembershipCategory={handleSaveMembershipCategory}
            onUploadAdditionalFile={handleUploadAdditionalFile}
            partnerApplication={partnerDetail}
            record={selectedApplication}
            selectedMembershipCategory={selectedMembershipCategory}
            selectedPartnerTier={selectedPartnerTier}
            showMembershipSummary="mobile"
          />

          {selectedApplication?.kind === "member" ? (
            <div className="space-y-5 xl:hidden">{renderMediaRail()}</div>
          ) : null}
        </div>
      </AdminSheet>
    </>
  );
}
