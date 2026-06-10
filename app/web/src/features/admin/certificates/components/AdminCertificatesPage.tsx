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

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
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
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={() => void loadCertificates()}
          type="button"
          variant="outline"
        >
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Issue, resend, and manage certificates for members holding an active membership."
      lastSyncedAt={lastSyncedAt}
      title="Certificates"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => (
          <AdminMetricCard
            active={index === 0}
            description={card.description}
            icon={card.icon}
            key={card.key}
            label={card.label}
            value={card.value}
          />
        ))}
      </section>

      <AdminFilters>
        <AdminSearch onChange={setSearch} placeholder="Search by name, email, or certificate number" value={search} />
        <Select onValueChange={(value) => setFilter("category", value)} value={filters.category}>
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-52">
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
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-44">
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
        <Button
          className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={resetFilters}
          type="button"
          variant="ghost"
        >
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
