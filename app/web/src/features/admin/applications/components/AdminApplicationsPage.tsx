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
  const [selectedApplication, setSelectedApplication] = useState<AdminApplicationRecord | null>(null);
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
    setSheetOpen(true);

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
            className="size-10 rounded-full"
            onClick={() => void loadApplications()}
            size="icon"
            type="button"
            variant="outline"
            aria-label="Refresh applications"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        }
        eyebrow="Atelier intake"
        subtitle="Every application lands here — member and partner. Click a card to review submitted details, files, and act on them in one focused view."
        title="Applications"
      >
        {/* Totals strip */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-vellum flex items-end justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="editorial-eyebrow text-[11px]">Members in queue</span>
              <span className="font-serif text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {memberTotal.toLocaleString("en-US")}
              </span>
            </div>
            <span className="h-1.5 w-16 rounded-full" style={{ backgroundColor: "var(--accent-copper)" }} />
          </div>
          <div className="card-vellum flex items-end justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="editorial-eyebrow text-[11px]">Partners in queue</span>
              <span className="font-serif text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {partnerTotal.toLocaleString("en-US")}
              </span>
            </div>
            <span className="h-1.5 w-16 rounded-full bg-foreground/30" />
          </div>
          <div className="card-vellum flex items-end justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="editorial-eyebrow text-[11px]">Filtered view</span>
              <span className="font-serif text-3xl font-medium tabular-nums tracking-tight text-foreground">
                {filteredApplications.length.toLocaleString("en-US")}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {isPending ? "Filtering…" : formatAdminCount(filteredApplications.length, "match")}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          <div className="lg:flex-1">
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
              <SelectTrigger className="h-10 w-40 rounded-full">
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
              <SelectTrigger className="h-10 w-44 rounded-full">
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
              <SelectTrigger className="h-10 w-40 rounded-full">
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
              className="h-10 rounded-full px-4"
              onClick={resetFilters}
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* The queue */}
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton className="h-[72px] rounded-2xl" key={i} style={{ backgroundColor: "var(--mist)" }} />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="card-vellum px-8 py-16 text-center">
            <p className="font-serif text-xl tracking-tight text-foreground">Nothing matches your filters</p>
            <p className="mt-2 text-sm text-muted-foreground">Reset the filters above to see the full queue.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
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
        onOpenChange={(next) => (next ? null : closeSheet())}
        open={sheetOpen}
        eyebrow={
          selectedApplication
            ? selectedApplication.kind === "member"
              ? "Atelier · Member intake"
              : "Atelier · Partner intake"
            : undefined
        }
        title={selectedApplication?.applicantName ?? "Application"}
        description={
          selectedApplication
            ? `${selectedApplication.applicantEmail} · ${selectedApplication.membershipPackage}`
            : undefined
        }
        size="xl"
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
