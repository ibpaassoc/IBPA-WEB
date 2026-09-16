"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { BadgeCheck, Plus, RefreshCw, Ticket, TicketCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { clearAdminReadCache } from "../../shared/utils/admin-request";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  createPromoCode,
  deletePromoCode,
  listPromoCodes,
  updatePromoCode,
} from "../server/promo-code-admin.repository";
import type {
  AdminPromoCode,
  PromoCodeDraft,
} from "../types/promo-code-admin.types";
import { PromoCodeCard } from "./PromoCodeCard";
import { PromoCodeDialog } from "./PromoCodeDialog";

export function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [discountEnvKeys, setDiscountEnvKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPromoCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);

    try {
      const response = await listPromoCodes();
      setPromoCodes(Array.isArray(response.items) ? response.items : []);
      setDiscountEnvKeys(Array.isArray(response.discountEnvKeys) ? response.discountEnvKeys : []);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load promo codes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const live = promoCodes.filter((item) => item.enabled && item.discountConfigured).length;
    return {
      applications: promoCodes.reduce((total, item) => total + item.applicationCount, 0),
      live,
      paid: promoCodes.reduce((total, item) => total + item.paidCount, 0),
    };
  }, [promoCodes]);

  const runAction = async (id: string, action: string, task: () => Promise<unknown>) => {
    setBusyId(id);
    setBusyAction(action);
    try {
      await task();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That change could not be saved.");
      return false;
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const handleToggle = async (promoCode: AdminPromoCode, enabled: boolean) => {
    const saved = await runAction(promoCode.id, "toggle", () =>
      updatePromoCode(promoCode.id, { enabled }),
    );
    if (!saved) return;

    toast.success(enabled ? `${promoCode.code} is accepting again.` : `${promoCode.code} is turned off.`);
    await load();
  };

  const handleDelete = async (promoCode: AdminPromoCode) => {
    if (!window.confirm(`Delete ${promoCode.code}? Applicants who already used it keep their discount.`)) {
      return;
    }

    const deleted = await runAction(promoCode.id, "delete", () => deletePromoCode(promoCode.id));
    if (!deleted) return;

    toast.success(`${promoCode.code} deleted.`);
    await load();
  };

  const handleSave = async (draft: PromoCodeDraft) => {
    setIsSaving(true);
    try {
      if (editing) {
        await updatePromoCode(editing.id, draft);
        toast.success(`${draft.code} saved.`);
      } else {
        await createPromoCode(draft);
        toast.success(`${draft.code} created.`);
      }
      await load();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That promo code could not be saved.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setIsDialogOpen(true);
  };

  const openEdit = (promoCode: AdminPromoCode) => {
    setEditing(promoCode);
    setIsDialogOpen(true);
  };

  return (
    <AdminPageShell
      actions={
        <>
          <Button
            className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
            onClick={() => {
              clearAdminReadCache();
              void load();
            }}
            type="button"
            variant="outline"
          >
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
          <Button
            className="h-10 rounded-2xl bg-[#1F5D8F] text-white hover:bg-[#10203B]"
            onClick={openCreate}
            type="button"
          >
            <Plus data-icon="inline-start" />
            New promo code
          </Button>
        </>
      }
      description="Applicants enter a promo code in the last step of the membership application. Nothing is discounted until you approve the application — the linked Stripe coupon is attached to the invoice at that moment."
      eyebrow="Finance"
      title="Promo codes"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          active
          description="Turned on and linked to a Stripe coupon"
          icon={Ticket}
          label="Accepting codes"
          value={stats.live}
        />
        <AdminMetricCard
          description="Applications submitted with a code"
          icon={BadgeCheck}
          label="Applications"
          value={stats.applications}
        />
        <AdminMetricCard
          description="Of those, memberships already paid"
          icon={TicketCheck}
          label="Paid"
          value={stats.paid}
        />
      </section>

      <AdminSectionCard
        description={formatAdminCount(promoCodes.length, "promo code")}
        title="All promo codes"
      >
        {isLoading ? (
          <div className="grid gap-4">
            {[0, 1].map((key) => (
              <Skeleton className="h-44 rounded-[24px]" key={key} />
            ))}
          </div>
        ) : loadError ? (
          <AdminEmptyState
            actionLabel="Try again"
            description={loadError}
            onAction={() => {
              clearAdminReadCache();
              void load();
            }}
            title="Promo codes did not load"
          />
        ) : promoCodes.length === 0 ? (
          <AdminEmptyState
            actionLabel="New promo code"
            description="Create a code, link it to a Stripe coupon, and it appears on the membership application right away."
            icon={Ticket}
            onAction={openCreate}
            title="No promo codes yet"
          />
        ) : (
          <div className="grid gap-4">
            {promoCodes.map((promoCode) => (
              <PromoCodeCard
                busyAction={busyId === promoCode.id ? busyAction : null}
                key={promoCode.id}
                onDelete={() => void handleDelete(promoCode)}
                onEdit={() => openEdit(promoCode)}
                onToggle={(enabled) => void handleToggle(promoCode, enabled)}
                promoCode={promoCode}
              />
            ))}
          </div>
        )}
      </AdminSectionCard>

      <PromoCodeDialog
        discountEnvKeys={discountEnvKeys}
        isSaving={isSaving}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        open={isDialogOpen}
        promoCode={editing}
      />
    </AdminPageShell>
  );
}
