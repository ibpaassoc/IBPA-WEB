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

function MetricCard({
  label,
  value,
  hint,
  active,
}: {
  label: string;
  value: number;
  hint?: string;
  active?: boolean;
}) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_48px_rgba(15,35,70,0.08)] backdrop-blur-2xl",
        active
          ? "border-[#BDD0E8] bg-[linear-gradient(135deg,#10203B_0%,#21466D_100%)] text-white"
          : "border-white/70 bg-white/80 text-[#10203B]",
      ].join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: active
            ? "radial-gradient(circle at 12% 0%, rgba(255,255,255,0.18), transparent 34%)"
            : "radial-gradient(circle at 12% 0%, rgba(33,70,109,0.10), transparent 34%)",
        }}
      />

      <div className="relative flex items-end justify-between gap-4">
        <div>
          <p
            className={[
              "text-[10px] font-bold uppercase tracking-[0.24em]",
              active ? "text-white/65" : "text-[#8AA2BD]",
            ].join(" ")}
          >
            {label}
          </p>
          <p className="mt-4 text-4xl font-semibold leading-none tracking-[-0.05em] tabular-nums">
            {value.toLocaleString("en-US")}
          </p>
        </div>

        {hint ? (
          <span
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold",
              active
                ? "border-white/20 bg-white/10 text-white/80"
                : "border-[#D9E4F2] bg-[#EEF5FF] text-[#21466D]",
            ].join(" ")}
          >
            {hint}
          </span>
        ) : (
          <span
            className={[
              "h-1.5 w-16 rounded-full",
              active
                ? "bg-white/45"
                : "bg-gradient-to-r from-[#21466D] via-[#4F7CB3] to-[#8AA2BD]",
            ].join(" ")}
          />
        )}
      </div>
    </section>
  );
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

  return (
    <>
      <AdminPageShell
        actions={
          <Button
            aria-label="Refresh applications"
            className="size-10 rounded-full border-[#D4E0F0] bg-white/80 text-[#21466D] shadow-sm hover:bg-white hover:text-[#0B1F44]"
            onClick={() => void loadApplications()}
            size="icon"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        }
        eyebrow="Admin workspace"
        subtitle="Review member and partner applications in one focused workspace."
        title="Applications"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard active label="Members in queue" value={memberTotal} />
          <MetricCard label="Partners in queue" value={partnerTotal} />
          <MetricCard
            hint={isPending ? "Filtering…" : formatAdminCount(filteredApplications.length, "match")}
            label="Filtered view"
            value={filteredApplications.length}
          />
        </div>

        <section className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_48px_rgba(15,35,70,0.08)] backdrop-blur-2xl">
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
                <SelectTrigger className="h-10 w-40 rounded-2xl border-[#D9E4F2] bg-[#F7FAFE] text-[#10203B]">
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
                <SelectTrigger className="h-10 w-44 rounded-2xl border-[#D9E4F2] bg-[#F7FAFE] text-[#10203B]">
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
                <SelectTrigger className="h-10 w-40 rounded-2xl border-[#D9E4F2] bg-[#F7FAFE] text-[#10203B]">
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
                className="h-10 rounded-2xl px-4 text-[#21466D]"
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
              <Skeleton className="h-[78px] rounded-[24px] bg-white/70" key={index} />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-[30px] border border-white/70 bg-white/78 px-8 py-16 text-center shadow-[0_18px_48px_rgba(15,35,70,0.08)]">
            <p className="text-xl font-semibold tracking-[-0.02em] text-[#10203B]">
              Nothing matches your filters
            </p>
            <p className="mt-2 text-sm text-[#6B7C93]">
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
            ? `${selectedApplication.applicantEmail} · ${selectedApplication.membershipPackage}`
            : undefined
        }
        eyebrow={
          selectedApplication
            ? selectedApplication.kind === "member"
              ? "Member application"
              : "Partner application"
            : undefined
        }
        leftRail={
          selectedApplication?.kind === "member" ? (
            <ApplicationMediaRail
              additionalFiles={additionalFiles}
              isLoadingFiles={isLoadingFiles}
              memberApplication={memberDetail}
              onDeleteAdditionalFile={handleDeleteAdditionalFile}
              onUploadAdditionalFile={handleUploadAdditionalFile}
            />
          ) : null
        }
        onOpenChange={(next) => (next ? null : closeSheet())}
        open={sheetOpen}
        rightRail={
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
          ) : null
        }
        size="xl"
        title={selectedApplication?.applicantName ?? "Application"}
      >
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
        />
      </AdminSheet>
    </>
  );
}
