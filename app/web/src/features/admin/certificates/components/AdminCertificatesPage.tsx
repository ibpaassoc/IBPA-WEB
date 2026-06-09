"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Award, CircleSlash, RefreshCw, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
import { cn } from "@/lib/utils";

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import {
  getProfile,
  listProfiles,
  removeProfileCertificate,
  resendProfileCertificate,
  saveProfileCertificate,
} from "../../profiles/server/profile-admin.repository";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  buildCertificateStats,
  filterCertificateRecords,
  toCertificateRecord,
} from "../server/certificate-admin.service";
import type {
  AdminCertificateFilters,
  AdminCertificateRecord,
} from "../types/certificate-admin.types";
import { CertificateActionPanel } from "./CertificateActionPanel";
import { CertificatesTable } from "./CertificatesTable";

const initialFilters: AdminCertificateFilters = {
  category: "all",
  status: "all",
};

export function AdminCertificatesPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { deferredSearch, filters, resetFilters, search, setFilter, setSearch } =
    useAdminFilters<AdminCertificateFilters>(initialFilters, initialQuery);
  const [certificates, setCertificates] = useState<AdminCertificateRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selected, setSelected] = useState<AdminCertificateRecord | null>(null);
  const [pendingCertificateUrl, setPendingCertificateUrl] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadCertificates = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await listProfiles({ limit: 200, q: deferredSearch });
      const nextCertificates = Array.isArray(response.items) ? response.items.map(toCertificateRecord) : [];
      setCertificates(nextCertificates);
      setCategories(Array.isArray(response.categories) ? response.categories : []);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load certificates.");
      if (!silent) {
        setCertificates([]);
        setCategories([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const stats = useMemo(() => buildCertificateStats(certificates), [certificates]);
  const filteredCertificates = useMemo(
    () => filterCertificateRecords(certificates, filters),
    [certificates, filters],
  );

  const summaryCards = [
    {
      description: "Members holding a verified certificate",
      icon: ShieldCheck,
      key: "issued",
      label: "Issued",
      value: stats.issued,
    },
    {
      description: "Active members without a certificate on file",
      icon: CircleSlash,
      key: "not-issued",
      label: "Not issued",
      value: stats.notIssued,
    },
    {
      description: "Active membership records reviewed",
      icon: Award,
      key: "total",
      label: "Total records",
      value: stats.total,
    },
  ];

  const openCertificate = async (certificate: AdminCertificateRecord) => {
    setSelected(certificate);
    setPendingCertificateUrl(null);
    setIsLoadingDetail(true);

    try {
      const detail = await getProfile(certificate.id);
      setSelected(toCertificateRecord(detail));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load certificate record.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    await openCertificate(selected);
    await loadCertificates({ silent: true });
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
    if (!selected || !pendingCertificateUrl) return;

    void runAction("save", async () => {
      await saveProfileCertificate(selected.id, pendingCertificateUrl);
      setPendingCertificateUrl(null);
      toast.success("Certificate issued.");
      await refreshSelected();
    });
  };

  const handleRemoveCertificate = () => {
    if (!selected) return;
    if (!window.confirm("Remove this certificate PDF?")) return;

    void runAction("remove", async () => {
      await removeProfileCertificate(selected.id);
      toast.success("Certificate removed.");
      await refreshSelected();
    });
  };

  const handleResendCertificate = () => {
    if (!selected) return;

    void runAction("resend", async () => {
      await resendProfileCertificate(selected.id);
      toast.success("Certificate email sent.");
    });
  };

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadCertificates()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Issue, resend, and manage certificates for members holding an active membership."
      lastSyncedAt={lastSyncedAt}
      title="Certificates"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const isHighlight = index === 0;

          return (
            <div
              className={cn(
                "flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(33,70,109,0.04),0_18px_36px_-26px_rgba(33,70,109,0.4)]",
                isHighlight
                  ? "border-transparent bg-[radial-gradient(circle_at_85%_-10%,rgba(114,160,193,0.45),transparent_46%),linear-gradient(135deg,#10203b_0%,#21466d_55%,#2b5c99_100%)] text-white"
                  : "border-border bg-card text-[#16243a]",
              )}
              key={card.key}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.16em]",
                    isHighlight ? "text-white/65" : "text-[#5c7896]",
                  )}
                >
                  {card.label}
                </span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    isHighlight ? "bg-white/15 text-white" : "bg-[#e9f1f8] text-[#2b5c99]",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              </div>
              <span className="text-3xl font-semibold tracking-tight">{card.value.toLocaleString("en-US")}</span>
              <span className={cn("text-sm", isHighlight ? "text-white/70" : "text-muted-foreground")}>
                {card.description}
              </span>
            </div>
          );
        })}
      </section>

      <AdminFilters>
        <AdminSearch onChange={setSearch} placeholder="Search by name, email, or certificate number" value={search} />
        <Select onValueChange={(value) => setFilter("category", value)} value={filters.category}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("status", value as AdminCertificateFilters["status"])}
          value={filters.status}
        >
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="not_issued">Not issued</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
        <AdminSectionCard
          description={formatAdminCount(filteredCertificates.length, "record")}
          title="Certificate directory"
        >
          <CertificatesTable
            certificates={filteredCertificates}
            isLoading={isLoading}
            onOpen={(certificate) => void openCertificate(certificate)}
            selectedId={selected?.id ?? null}
          />
        </AdminSectionCard>

        <CertificateActionPanel
          busyAction={busyAction}
          certificate={selected}
          isLoading={isLoadingDetail}
          onCertificateUploaded={setPendingCertificateUrl}
          onRemoveCertificate={handleRemoveCertificate}
          onResendCertificate={handleResendCertificate}
          onSaveCertificate={handleSaveCertificate}
          pendingCertificateUrl={pendingCertificateUrl}
        />
      </div>
    </AdminPageShell>
  );
}
