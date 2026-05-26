"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Search,
  Sparkles,
  X,
  Loader2,
  Trash2,
  Copy,
  ShieldAlert,
  XCircle,
  FileText,
} from "lucide-react";
import { OrderStatus } from "@/lib/types";
import { AdminOrder, AdminOrdersResponse, AdminOrderSummary, ApplicationAdditionalFile } from "@/lib/admin-types";
import { getMembershipCategory, membershipConfigs } from "@/lib/membership";
import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { toast } from "sonner";
import {
  applicationSectionTitles,
  formatApplicationValue,
  getApplicationFieldLabel,
} from "@/lib/application-fields";

const STATUS_OPTIONS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "New" },
  { value: "review", label: "Additional review" },
  { value: "rejected", label: "Rejected" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
];

const APPLICATIONS_PAGE_SIZE = 20;
const EMPTY_SUMMARY: AdminOrderSummary = {
  all: 0,
  pending: 0,
  review: 0,
  rejected: 0,
  approved: 0,
  paid: 0,
};

function buildSections(order: AdminOrder) {
  const payload = order.applicationPayload && typeof order.applicationPayload === "object"
    ? (order.applicationPayload as Record<string, unknown>)
    : {};

  const sections = [
    {
      title: applicationSectionTitles.summary,
      fields: ["membershipCategory", "applicantType", "specialization", "specializationOther", "yearsExperience", "workSetting"],
    },
    {
      title: applicationSectionTitles.contact,
      fields: ["email", "phone", "dateOfBirth", "citizenship", "country", "city", "state", "zipCode", "streetAddress"],
    },
    {
      title: applicationSectionTitles.professional,
      fields: [
        "professionalDesc",
        "workingJurisdictions",
        "educationDesc",
        "hasLicense",
        "licenseNumber",
        "additionalEducation",
        "specialization",
        "specializationOther",
      ],
    },
    {
      title: applicationSectionTitles.category,
      fields: [
        "studentSchool",
        "studentProgName",
        "studentStartDate",
        "studentEndDate",
        "studentMotivation",
        "educatorRole",
        "educatorSubjects",
        "educatorYears",
        "educatorFormat",
        "studentCount",
        "bizName",
        "bizType",
        "bizYear",
        "bizTeamSize",
        "bizServices",
        "brandName",
        "brandYear",
        "brandMarket",
        "brandType",
      ],
    },
    {
      title: applicationSectionTitles.links,
      fields: ["instagramLink", "websiteLink", "linkedinLink", "portfolioLink", "whyJoin", "contributionDesc"],
    },
    {
      title: applicationSectionTitles.legal,
      fields: ["legalName", "signature", "certifyTrue", "understandReview", "agreeStandards", "privacyConsent"],
    },
  ];

  return sections
    .map((section) => ({
      ...section,
      items: section.fields
        .map((field) => ({
          label: getApplicationFieldLabel(field),
          value: formatApplicationValue(field, payload[field]),
        }))
        .filter((item) => item.value),
    }))
    .filter((section) => section.items.length > 0);
}

function getPortfolioImages(order: AdminOrder): string[] {
  const payload =
    order.applicationPayload && typeof order.applicationPayload === "object"
      ? (order.applicationPayload as Record<string, unknown>)
      : {};

  const images = payload.portfolioImages;
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function fileListFromPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function getTrainerFileGroups(order: AdminOrder): Array<{ title: string; files: string[]; imagePreview?: boolean }> {
  const payload =
    order.applicationPayload && typeof order.applicationPayload === "object"
      ? (order.applicationPayload as Record<string, unknown>)
      : {};

  return [
    {
      title: getApplicationFieldLabel("trainerEducationPlanFiles"),
      files: fileListFromPayload(payload, "trainerEducationPlanFiles"),
    },
    {
      title: getApplicationFieldLabel("trainerCertificateFiles"),
      files: fileListFromPayload(payload, "trainerCertificateFiles"),
    },
    {
      title: getApplicationFieldLabel("trainerExperienceProofFiles"),
      files: fileListFromPayload(payload, "trainerExperienceProofFiles"),
      imagePreview: true,
    },
  ].filter((group) => group.files.length > 0);
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles = {
    pending: "bg-orange-50 text-orange-600 border-orange-100",
    review: "bg-amber-50 text-amber-700 border-amber-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
    approved: "bg-blue-50 text-blue-600 border-blue-100",
    paid: "bg-green-50 text-green-600 border-green-100",
  };
  const labels = {
    pending: "Pending",
    review: "Additional review",
    rejected: "Rejected",
    approved: "Approved",
    paid: "Paid",
  };
  const icon = {
    pending: <Clock className="w-3 h-3" />,
    review: <ShieldAlert className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
    approved: <ExternalLink className="w-3 h-3" />,
    paid: <CheckCircle2 className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {icon[status]}
      {labels[status]}
    </span>
  );
}

export default function ApplicationsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isResendingPaymentLink, setIsResendingPaymentLink] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [summary, setSummary] = useState<AdminOrderSummary>(EMPTY_SUMMARY);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [selectedMembershipCategory, setSelectedMembershipCategory] = useState("");
  const [isUpdatingMembershipCategory, setIsUpdatingMembershipCategory] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState<ApplicationAdditionalFile[]>([]);
  const [isLoadingAdditionalFiles, setIsLoadingAdditionalFiles] = useState(false);
  const [isDeletingAdditionalFile, setIsDeletingAdditionalFile] = useState<string | null>(null);
  const [showAllPortfolioImages, setShowAllPortfolioImages] = useState(false);
  const [showAllTrainerImages, setShowAllTrainerImages] = useState(false);

  const parseResponseJson = async <T,>(resp: Response): Promise<T | null> => {
    const raw = await resp.text();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const readErrorMessage = async (resp: Response) => {
    const data = await parseResponseJson<{ error?: string }>(resp.clone());
    if (data && typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }

    const text = await resp.clone().text();
    if (text && text.trim().length > 0) {
      return text;
    }

    return "Could not complete the request.";
  };

  const fetchOrders = useCallback(async ({
    silent = false,
    append = false,
    offset = 0,
    limit,
  }: { silent?: boolean; append?: boolean; offset?: number; limit?: number } = {}) => {
    if (append) {
      setIsLoadingMore(true);
    } else if (!silent) {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(limit ?? APPLICATIONS_PAGE_SIZE),
        offset: String(offset),
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const query = debouncedSearchQuery.trim();
      if (query) {
        params.set("q", query);
      }

      const resp = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
      const data = await parseResponseJson<AdminOrdersResponse | { error?: string }>(resp);

      if (!resp.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : `Could not load applications (HTTP ${resp.status}).`;
        throw new Error(message);
      }

      if (!data || !Array.isArray((data as AdminOrdersResponse).items)) {
        throw new Error("The server returned an invalid application list format.");
      }

      const listData = data as AdminOrdersResponse;
      setOrders((prev) => append ? [...prev, ...listData.items] : listData.items);
      setTotalOrders(Number(listData.total) || 0);
      setSummary(listData.summary || EMPTY_SUMMARY);
      setHasMoreOrders(Boolean(listData.hasMore));
      setLastSyncedAt(new Date().toISOString());
    } catch (error: any) {
      console.error("[fetchOrders] Client-side fetch failed:", error, { name: error?.name, message: error?.message });
      if (!silent) {
        setOrders([]);
        setTotalOrders(0);
        setSummary(EMPTY_SUMMARY);
        setHasMoreOrders(false);
        toast.error(`Failed to load applications: ${error?.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedMembershipCategory(getMembershipCategory(selectedOrder?.membershipCategory) ?? "");
  }, [selectedOrder?.membershipCategory]);

  const fetchAdditionalFiles = useCallback(async (applicationId: string) => {
    setIsLoadingAdditionalFiles(true);
    try {
      const resp = await fetch(`/api/admin/orders/${applicationId}/additional-files`, { cache: "no-store" });
      const data = await parseResponseJson<{ files?: ApplicationAdditionalFile[]; error?: string }>(resp);

      if (!resp.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Failed to load additional files.";
        throw new Error(message);
      }

      setAdditionalFiles(Array.isArray(data?.files) ? data.files : []);
    } catch (error) {
      console.error("Failed to load additional files", error);
      toast.error(error instanceof Error ? error.message : "Failed to load additional files.");
      setAdditionalFiles([]);
    } finally {
      setIsLoadingAdditionalFiles(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedOrder?.id) {
      setAdditionalFiles([]);
      return;
    }

    void fetchAdditionalFiles(selectedOrder.id);
  }, [fetchAdditionalFiles, selectedOrder?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchOrders({ silent: true, limit: Math.max(APPLICATIONS_PAGE_SIZE, orders.length) });
    }, 30000);

    const handleFocus = () => {
      void fetchOrders({ silent: true, limit: Math.max(APPLICATIONS_PAGE_SIZE, orders.length) });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchOrders({ silent: true, limit: Math.max(APPLICATIONS_PAGE_SIZE, orders.length) });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders, orders.length]);

  const handleLoadMore = () => {
    void fetchOrders({ append: true, offset: orders.length });
  };

  const handleOpenOrder = async (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowAllPortfolioImages(false);
    setShowAllTrainerImages(false);
    setIsLoadingDetail(true);

    try {
      const resp = await fetch(`/api/admin/orders/${order.id}`, { cache: "no-store" });
      const data = await parseResponseJson<AdminOrder | { error?: string }>(resp);
      if (!resp.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Could not load application details.",
        );
      }

      if (!data || typeof data !== "object" || !("id" in data)) {
        throw new Error("Application detail response was empty or invalid.");
      }

      setSelectedOrder(data as AdminOrder);
    } catch (error) {
      console.error("Failed to load application detail", error);
      toast.error(error instanceof Error ? error.message : "Failed to load application details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const selectedSections = selectedOrder ? buildSections(selectedOrder) : [];
  const selectedPortfolioImages = selectedOrder ? getPortfolioImages(selectedOrder) : [];
  const selectedTrainerFileGroups = selectedOrder ? getTrainerFileGroups(selectedOrder) : [];
  const visiblePortfolioImages = showAllPortfolioImages ? selectedPortfolioImages : selectedPortfolioImages.slice(0, 6);
  const getVisibleTrainerFiles = (files: string[]) => showAllTrainerImages ? files : files.slice(0, 6);
  const hasMembershipCategoryChange =
    Boolean(selectedOrder) &&
    Boolean(selectedMembershipCategory) &&
    selectedMembershipCategory !== (getMembershipCategory(selectedOrder?.membershipCategory) ?? "");
  const summaryCards: Array<{
    label: string;
    value: number;
    filter: OrderStatus | "all";
  }> = [
    { label: "Total", value: summary.all, filter: "all" },
    { label: "New", value: summary.pending, filter: "pending" },
    { label: "Additional review", value: summary.review, filter: "review" },
    { label: "Rejected", value: summary.rejected, filter: "rejected" },
    { label: "Approved", value: summary.approved, filter: "approved" },
    { label: "Paid", value: summary.paid, filter: "paid" }
  ];

  const handleApprove = async (orderId: string) => {
    setIsApproving(orderId);
    try {
      const resp = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      const responseData = await parseResponseJson<{ certificateNumber?: string; checkoutUrl?: string | null }>(resp);
      if (!responseData) {
        throw new Error("Approve request succeeded but returned an empty response.");
      }
      const certificateNumber = typeof responseData.certificateNumber === "string" ? responseData.certificateNumber : undefined;
      const checkoutUrl = typeof responseData.checkoutUrl === "string" ? responseData.checkoutUrl : null;
      const updatedStatus: OrderStatus = "approved";

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: updatedStatus,
                certificateNumber,
                checkoutUrl,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: updatedStatus,
          certificateNumber,
          checkoutUrl,
        });
      }
      toast.success("Application approved.");
    } catch (error) {
      console.error("Failed to approve order", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve application.");
    } finally {
      setIsApproving(null);
    }
  };

  const handleResendPaymentLink = async (orderId: string) => {
    if (!window.confirm("Send a new payment link and replace the current one?")) {
      return;
    }

    setIsResendingPaymentLink(orderId);
    try {
      const resp = await fetch(`/api/admin/orders/${orderId}/resend-payment-link`, {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      const responseData = await parseResponseJson<{ checkoutUrl?: string | null; paymentLinkUrl?: string | null }>(resp);
      if (!responseData) {
        throw new Error("Resend payment link succeeded but returned an empty response.");
      }
      const checkoutUrl = typeof responseData.checkoutUrl === "string" ? responseData.checkoutUrl : null;
      const paymentLinkUrl = typeof responseData.paymentLinkUrl === "string" ? responseData.paymentLinkUrl : null;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                checkoutUrl,
              }
            : order,
        ),
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          checkoutUrl,
        });
      }

      if (paymentLinkUrl) {
        try {
          navigator.clipboard.writeText(paymentLinkUrl);
        } catch {
          // ignore clipboard failures
        }
      }

      toast.success("New payment link sent.");
    } catch (error) {
      console.error("Failed to resend payment link", error);
      toast.error(error instanceof Error ? error.message : "Failed to send a new payment link.");
    } finally {
      setIsResendingPaymentLink(null);
    }
  };

  const handleUpdateMembershipCategory = async () => {
    if (!selectedOrder) {
      return;
    }

    const membershipCategory = getMembershipCategory(selectedMembershipCategory);
    if (!membershipCategory) {
      toast.error("Choose a valid membership category.");
      return;
    }

    setIsUpdatingMembershipCategory(true);
    try {
      const resp = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipCategory }),
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      const data = await parseResponseJson<{ application?: AdminOrder }>(resp);
      const updatedApplication = data?.application as AdminOrder | undefined;

      if (!updatedApplication) {
        throw new Error("Backend did not return the updated application.");
      }

      setOrders((prev) =>
        prev.map((order) => (order.id === updatedApplication.id ? updatedApplication : order)),
      );
      setSelectedOrder(updatedApplication);
      setSelectedMembershipCategory(getMembershipCategory(updatedApplication.membershipCategory) ?? "");
      await fetchOrders({ silent: true });

      toast.success("Membership category updated.");
    } catch (error) {
      console.error("Failed to update membership category", error);
      toast.error(error instanceof Error ? error.message : "Failed to update membership category.");
    } finally {
      setIsUpdatingMembershipCategory(false);
    }
  };

  const handleAdditionalFileUploaded = async (
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => {
    if (!selectedOrder) {
      return;
    }

    try {
      const resp = await fetch(`/api/admin/orders/${selectedOrder.id}/additional-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [
            {
              fileName: metadata?.fileName || url.split("/").pop() || "Uploaded file",
              fileUrl: url,
              fileKey: metadata?.fileKey || null,
              fileType: metadata?.fileType || "",
            },
          ],
        }),
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      const data = await parseResponseJson<{ files?: ApplicationAdditionalFile[] }>(resp);
      const savedFiles = Array.isArray(data?.files) ? data.files : [];
      setAdditionalFiles((prev) => [...savedFiles, ...prev]);
      toast.success("Additional document uploaded.");
    } catch (error) {
      console.error("Failed to save additional file metadata", error);
      toast.error(error instanceof Error ? error.message : "Failed to save additional document.");
    }
  };

  const handleDeleteAdditionalFile = async (fileId: string) => {
    if (!selectedOrder) {
      return;
    }

    if (!window.confirm("Delete this additional document from the application?")) {
      return;
    }

    setIsDeletingAdditionalFile(fileId);
    try {
      const resp = await fetch(`/api/admin/orders/${selectedOrder.id}/additional-files/${fileId}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      setAdditionalFiles((prev) => prev.filter((file) => file.id !== fileId));
      toast.success("Additional document deleted.");
    } catch (error) {
      console.error("Failed to delete additional file", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete additional document.");
    } finally {
      setIsDeletingAdditionalFile(null);
    }
  };

  const handleReview = async (orderId: string) => {
    setIsReviewing(orderId);
    try {
      const resp = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      const updatedStatus: OrderStatus = "review";

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: updatedStatus,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: updatedStatus,
        });
      }

      toast.success("Application moved to additional review.");
    } catch (error) {
      console.error("Failed to move order to review", error);
      toast.error(error instanceof Error ? error.message : "Failed to move application to additional review.");
    } finally {
      setIsReviewing(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!window.confirm("Confirm application rejection? The applicant will receive a rejection email.")) {
      return;
    }

    setIsRejecting(orderId);
    try {
      const resp = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!resp.ok) {
        throw new Error(await readErrorMessage(resp));
      }

      const updatedStatus: OrderStatus = "rejected";

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: updatedStatus,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: updatedStatus,
        });
      }

      toast.success("Application rejected and email sent to the applicant.");
    } catch (error) {
      console.error("Failed to reject order", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject application.");
    } finally {
      setIsRejecting(null);
    }
  };

  const handleDelete = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(orderId);
    try {
      const resp = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (resp.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        toast.success("Application deleted.");
      } else {
        const message = await readErrorMessage(resp);
        toast.error(`Delete failed: ${message}`);
      }
    } catch (error) {
      console.error("Failed to delete order", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while deleting.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:py-9">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl uppercase tracking-tighter font-anton lg:text-[2rem]">Membership Applications</h1>
          <p className="mt-1.5 max-w-2xl text-sm font-light text-slate-500">
            Review complete applicant forms, verify experience, and approve certificate issuance.
          </p>
          {lastSyncedAt && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              Last sync {new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative min-w-55">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, or category"
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/15"
            />
          </div>

          <div className="relative min-w-47.5">
            <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "all")}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/15"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((item) => {
          const isActive = statusFilter === item.filter;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setStatusFilter((current) => (current === item.filter ? "all" : item.filter))}
              className={`rounded-[22px] border p-4 text-left shadow-sm transition-all ${
                isActive
                  ? "border-[#72A0C1]/40 bg-[#F0F8FF] shadow-lg shadow-[#72A0C1]/10"
                  : "border-slate-100 bg-white hover:border-[#72A0C1]/20 hover:shadow-md"
              }`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.24em] ${
                  isActive ? "text-[#72A0C1]" : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
              <p className={`mt-2.5 text-2xl font-anton lg:text-[1.9rem] ${isActive ? "text-[#72A0C1]" : "text-slate-900"}`}>
                {item.value}
              </p>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-sm">
              <div className="flex animate-pulse items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-slate-100" />
                    <div className="h-6 w-24 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No applications found</h3>
          <p className="mt-2 text-slate-500">Try changing the search query or filters.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => void handleOpenOrder(order)}
              className="group cursor-pointer rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-sm transition-all hover:border-[#72A0C1]/30 hover:shadow-xl"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:bg-[#72A0C1]/5 group-hover:text-[#72A0C1]">
                    <span className="text-lg font-bold">{order.name[0]?.toUpperCase()}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{order.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-400 lg:text-sm">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#72A0C1]/60" />
                          {order.email}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.membershipCategory && (
                        <span className="rounded-full bg-[#F0F8FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#72A0C1]">
                          {order.membershipCategory}
                        </span>
                      )}
                      {order.applicantType && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          {order.applicantType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all group-hover:bg-slate-50 group-hover:text-slate-600">
                      <Info className="h-4 w-4" />
                    </div>
                    <button
                      onClick={(e) => handleDelete(order.id, e)}
                      disabled={isDeleting === order.id}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="Delete application"
                    >
                      {isDeleting === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {hasMoreOrders && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-[#72A0C1]/30 hover:text-[#4C7D9D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoadingMore ? "Loading..." : `Load more (${orders.length} of ${totalOrders})`}
            </button>
          )}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[6px]">
          <div className="relative max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-8 top-8 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="grid h-full lg:grid-cols-[1fr_380px]">
                {/* LEFT COLUMN: APPLICATION DATA */}
                <div className="p-8 md:p-12 lg:border-r lg:border-slate-100">
                  {isLoadingDetail && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading full application details
                    </div>
                  )}
                  <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[30px] bg-[#72A0C1]/10 text-[#72A0C1] text-3xl font-bold">
                      {selectedOrder.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-4xl font-anton uppercase tracking-tight text-slate-900 leading-tight">
                        {selectedOrder.name}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <StatusBadge status={selectedOrder.status} />
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-200 mt-2" />
                        <span className="flex items-center gap-2 uppercase font-bold tracking-widest text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                          {selectedOrder.membershipCategory}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-200 mt-2" />
                        <span className="flex items-center gap-2 uppercase font-bold tracking-widest text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                          {selectedOrder.applicantType}
                        </span>
                      </div>
                    </div>
                  </header>

                  <div className="space-y-12">
                    {selectedPortfolioImages.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="h-8 w-1 bg-[#72A0C1] rounded-full" />
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Portfolio Examples</h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {visiblePortfolioImages.map((imageUrl, index) => (
                            <a
                              key={`${imageUrl}-${index}`}
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              <img
                                src={imageUrl}
                                alt={`Portfolio example ${index + 1}`}
                                loading="lazy"
                                decoding="async"
                                className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            </a>
                          ))}
                        </div>
                        {selectedPortfolioImages.length > visiblePortfolioImages.length && (
                          <button
                            type="button"
                            onClick={() => setShowAllPortfolioImages(true)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition-all hover:border-[#72A0C1]/30 hover:text-[#4C7D9D]"
                          >
                            Show all images ({selectedPortfolioImages.length})
                          </button>
                        )}
                      </div>
                    )}

                    {selectedTrainerFileGroups.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="h-8 w-1 bg-[#72A0C1] rounded-full" />
                          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Trainer / Educator files</h3>
                        </div>

                        <div className="space-y-6">
                          {selectedTrainerFileGroups.map((group) => (
                            <div key={group.title} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">{group.title}</h4>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                  {group.files.length} file{group.files.length === 1 ? "" : "s"}
                                </span>
                              </div>

                              {group.imagePreview ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                  {getVisibleTrainerFiles(group.files).map((fileUrl, index) => (
                                    <a
                                      key={`${group.title}-${fileUrl}-${index}`}
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group overflow-hidden rounded-[22px] border border-slate-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                      <img
                                        src={fileUrl}
                                        alt={`${group.title} ${index + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                      />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid gap-3">
                                  {group.files.map((fileUrl, index) => (
                                    <a
                                      key={`${group.title}-${fileUrl}-${index}`}
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#72A0C1]/40 hover:text-[#4C7D9D]"
                                    >
                                      <span>{group.title} {index + 1}</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em]">
                                        Open / download <ExternalLink className="h-3.5 w-3.5" />
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              {group.imagePreview && group.files.length > getVisibleTrainerFiles(group.files).length && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllTrainerImages(true)}
                                  className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition-all hover:border-[#72A0C1]/30 hover:text-[#4C7D9D]"
                                >
                                  Show all files ({group.files.length})
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-8 w-1 bg-[#B9D9EB] rounded-full" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Application Data</h3>
                    </div>

                    {selectedSections.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-slate-400">
                        Application details have not been loaded for this application yet.
                      </div>
                    ) : (
                      selectedSections.map((section) => (
                        <div key={section.title} className="space-y-6">
                           <div className="flex items-center justify-between group">
                            <h4 className="text-xl font-anton uppercase text-slate-800 tracking-tight">
                              {section.title}
                            </h4>
                            <div className="h-px grow mx-4 bg-slate-100 group-hover:bg-[#B9D9EB]/40 transition-colors" />
                          </div>
                          
                          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {section.items.map((item) => (
                              <div key={`${section.title}-${item.label}`} className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                  {item.label}
                                </p>
                                <p className="text-[15px] font-medium leading-relaxed text-slate-900 py-2 border-b border-slate-100/60 wrap-break-word">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTIONS & STATUS */}
                <div className="bg-[#F8FAFC] p-8 md:p-12 flex flex-col h-full">
                  <div className="grow space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Admin-only membership</h3>
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="admin-membership-category" className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Membership Category
                          </label>
                          <select
                            id="admin-membership-category"
                            value={selectedMembershipCategory}
                            onChange={(event) => setSelectedMembershipCategory(event.target.value)}
                            disabled={isUpdatingMembershipCategory}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#72A0C1] focus:ring-2 focus:ring-[#72A0C1]/15 disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            <option value="" disabled>
                              Select category
                            </option>
                            {membershipConfigs.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <p className="text-xs font-medium leading-relaxed text-slate-500">
                          Current saved category: <span className="font-bold text-slate-700">{selectedOrder.membershipCategory || "Not set"}</span>
                        </p>

                        <button
                          type="button"
                          onClick={handleUpdateMembershipCategory}
                          disabled={isUpdatingMembershipCategory || !hasMembershipCategoryChange}
                          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#72A0C1]/20 bg-[#F0F8FF] px-6 py-4 font-bold text-[#5B84A0] transition-all hover:bg-[#E6F2FA] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdatingMembershipCategory ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {isUpdatingMembershipCategory ? "Saving..." : "Save category"}
                        </button>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Additional Documents</h3>
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                        <AdminUploadZone
                          endpoint="applicationAdditionalFileUploader"
                          multiple
                          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          label="Upload documents or images"
                          helperText="JPG, PNG, WEBP, PDF, DOC, DOCX. Multiple files supported."
                          buttonText="Choose files"
                          onUploaded={handleAdditionalFileUploaded}
                          onError={(message) => toast.error(message)}
                        />

                        <div className="space-y-3">
                          {isLoadingAdditionalFiles ? (
                            <div className="flex items-center justify-center rounded-2xl bg-slate-50 py-6 text-slate-400">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          ) : additionalFiles.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-400">
                              No additional documents uploaded yet.
                            </div>
                          ) : (
                            additionalFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#72A0C1]">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 grow">
                                  <p className="truncate text-sm font-bold text-slate-800">{file.fileName}</p>
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 transition-colors hover:text-[#4C7D9D]"
                                  title="View / download"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdditionalFile(file.id)}
                                  disabled={isDeletingAdditionalFile === file.id}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                  title="Delete"
                                >
                                  {isDeletingAdditionalFile === file.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Actions and Status</h3>
                         <StatusBadge status={selectedOrder.status} />
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        {(selectedOrder.status === "pending" || selectedOrder.status === "review") && (
                          <div className="space-y-4">
                            <p className="text-sm text-slate-500 font-serif italic">
                              {selectedOrder.status === "review"
                                ? "This application is already in additional review. After reassessment, it can be approved."
                                : "Review the application and make a decision."}
                            </p>
                            {selectedOrder.status === "pending" && (
                              <button
                                onClick={() => handleReview(selectedOrder.id)}
                                disabled={isReviewing === selectedOrder.id}
                                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 font-bold text-amber-800 transition-all hover:bg-amber-100 disabled:opacity-60"
                              >
                                {isReviewing === selectedOrder.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <ShieldAlert className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                )}
                                <span>{isReviewing === selectedOrder.id ? "Processing..." : "Send to additional review"}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleReject(selectedOrder.id)}
                              disabled={isRejecting === selectedOrder.id}
                              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-60"
                            >
                              {isRejecting === selectedOrder.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <XCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              )}
                              <span>{isRejecting === selectedOrder.id ? "Processing..." : "Reject application"}</span>
                            </button>
                            <button
                              onClick={() => handleApprove(selectedOrder.id)}
                              disabled={isApproving === selectedOrder.id}
                              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 px-6 py-5 font-bold text-white transition-all hover:bg-black disabled:bg-slate-400 shadow-xl"
                            >
                              {isApproving === selectedOrder.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              )}
                              <span>{isApproving === selectedOrder.id ? "Processing..." : "Approve application"}</span>
                            </button>
                          </div>
                        )}

                        {selectedOrder.status === "approved" && (
                          <div className="space-y-4">
                            <div className="rounded-2xl bg-[#F0F8FF] p-4 text-xs font-semibold text-[#72A0C1] leading-relaxed border border-[#72A0C1]/10">
                              Application approved. Certificate is ready for payment and awaiting Stripe checkout.
                            </div>
                            
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => {
                                  if (selectedOrder.checkoutUrl) {
                                    window.open(selectedOrder.checkoutUrl, "_blank");
                                  }
                                }}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-900 bg-slate-900 px-6 py-4 font-bold text-white transition-all hover:bg-black shadow-lg"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Pay in Stripe
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (selectedOrder.checkoutUrl) {
                                    navigator.clipboard.writeText(selectedOrder.checkoutUrl);
                                    toast.success("Link copied.");
                                  }
                                }}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-600 transition-all hover:bg-slate-50"
                              >
                                <Copy className="h-4 w-4" />
                                Copy link
                              </button>

                              <button
                                onClick={() => handleResendPaymentLink(selectedOrder.id)}
                                disabled={isResendingPaymentLink === selectedOrder.id}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#72A0C1]/20 bg-[#F8FBFE] px-6 py-4 font-bold text-[#5B84A0] transition-all hover:bg-[#EEF6FB] disabled:opacity-60"
                              >
                                {isResendingPaymentLink === selectedOrder.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ExternalLink className="h-4 w-4" />
                                )}
                                New payment link
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedOrder.status === "rejected" && (
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold leading-relaxed text-rose-700">
                              Application rejected. A rejection email has been sent to the applicant.
                            </div>
                          </div>
                        )}

                        {selectedOrder.status === "paid" && (
                          <div className="rounded-2xl bg-green-50 p-6 border border-green-100/50 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Paid</p>
                               <p className="mt-2 text-xs text-green-600/70 font-medium">Client completed payment. Membership is active.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="space-y-6">
                       <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Metadata</h3>
                       <div className="grid gap-3">
                          <div className="rounded-2xl border border-slate-200/60 bg-white px-5 py-4 flex justify-between items-center">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Submitted</p>
                             <p className="text-sm font-bold text-slate-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/60 bg-white px-5 py-4 flex flex-col gap-2">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Client email</p>
                             <p className="text-sm font-bold text-slate-900">{selectedOrder.email}</p>
                          </div>
                          {selectedOrder.certificateNumber && (
                            <div className="rounded-2xl border border-[#B9D9EB]/30 bg-[#F0F8FF] px-5 py-4 flex justify-between items-center">
                               <p className="text-[10px] font-bold uppercase tracking-widest text-[#72A0C1]">Certificate</p>
                               <p className="font-anton text-sm text-[#72A0C1]">{selectedOrder.certificateNumber}</p>
                            </div>
                          )}
                       </div>
                    </section>
                  </div>

                  {/* DANGER ZONE */}
                  <div className="mt-12 pt-8 border-t border-slate-200/60">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-300 mb-4">Danger Zone</p>
                    <button
                      onClick={(e) => handleDelete(selectedOrder.id, e)}
                      disabled={isDeleting === selectedOrder.id}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      {isDeleting === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete application permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </main>
  );
}
