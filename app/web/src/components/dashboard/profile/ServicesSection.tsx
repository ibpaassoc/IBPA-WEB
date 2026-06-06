"use client";

import { startTransition, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import type { ProfileService } from "@/lib/profile-record";
import { useI18n } from "@/lib/i18n";

import { ServiceCard } from "./ServiceCard";
import { ServiceEditor } from "./ServiceEditor";

function createServiceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `svc_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeServices(services: ProfileService[] | null | undefined) {
  if (!Array.isArray(services)) {
    return [] as ProfileService[];
  }

  return services
    .filter(
      (service): service is ProfileService =>
        Boolean(service) &&
        typeof service.id === "string" &&
        typeof service.title === "string",
    )
    .map((service) => ({
      id: service.id,
      title: service.title.trim(),
      description: service.description?.trim() || "",
      price: service.price?.trim() || "",
    }));
}

async function saveServices(
  services: ProfileService[],
  fallbackMessage: string,
) {
  const response = await fetch("/api/profile/services", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ services }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : fallbackMessage,
    );
  }

  return normalizeServices(payload?.services);
}

export function ServicesSection({
  initialServices,
}: {
  initialServices?: ProfileService[] | null;
}) {
  const { t } = useI18n();
  const dashboard = t.dashboard;
  const [services, setServices] = useState<ProfileService[]>(() =>
    normalizeServices(initialServices),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    startTransition(() => {
      setServices(normalizeServices(initialServices));
      setEditingId(null);
      setIsAdding(false);
      setErrorMessage(null);
    });
  }, [initialServices]);

  const persistServices = async (
    nextServices: ProfileService[],
    successMessage: string,
  ) => {
    const previousServices = services;
    setServices(nextServices);
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedServices = await saveServices(
        nextServices,
        dashboard.services.saveErrorNow,
      );
      setServices(savedServices);
      toast.success(successMessage);
    } catch (error) {
      setServices(previousServices);
      const message =
        error instanceof Error ? error.message : dashboard.services.saveError;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="relative rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_18px_45px_rgba(11,31,68,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#16386D]">
            {dashboard.services.title}
          </p>

          {services.length === 0 || isAdding ? (
            <p className="mt-2 max-w-[32ch] text-sm leading-6 text-slate-500">
              {dashboard.services.description}
            </p>
          ) : (
            <div className="mt-2 inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#31598A]">
              {dashboard.services.count(services.length)}
            </div>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-[#F1CFD4] bg-[#FFF7F8] px-4 py-3 text-sm text-[#A23A4A]">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 pr-1">
        {isAdding ? (
          <ServiceEditor
            saving={isSaving}
            onCancel={() => {
              setIsAdding(false);
              setErrorMessage(null);
            }}
            onSave={async (draft) => {
              const nextServices = [
                ...services,
                {
                  id: createServiceId(),
                  title: draft.title,
                  description: draft.description,
                  price: draft.price,
                },
              ];

              setIsAdding(false);
              await persistServices(nextServices, dashboard.services.addSuccess);
            }}
          />
        ) : null}

        {services.length === 0 && !isAdding ? (
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-5 py-6 text-sm leading-6 text-slate-500">
            {dashboard.services.empty}
          </div>
        ) : null}

        {services.length > 0 ? (
          <div className="relative">
            <div
              className="service-scroll grid max-h-[372px] overflow-x-hidden overflow-y-auto gap-3 sm:grid-cols-2"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
            {services.map((service) => {
              const isEditing = editingId === service.id;

              if (isEditing) {
                return (
                  <ServiceEditor
                    key={service.id}
                    service={service}
                    saving={isSaving}
                    onCancel={() => {
                      setEditingId(null);
                      setErrorMessage(null);
                    }}
                    onSave={async (draft) => {
                      const nextServices = services.map((item) =>
                        item.id === service.id
                          ? {
                              ...item,
                              title: draft.title,
                              description: draft.description,
                              price: draft.price,
                            }
                          : item,
                      );

                      setEditingId(null);
                      await persistServices(nextServices, dashboard.services.updateSuccess);
                    }}
                  />
                );
              }

              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  disabled={isSaving}
                  onEdit={() => {
                    setEditingId(service.id);
                    setIsAdding(false);
                    setErrorMessage(null);
                  }}
                  onDelete={async () => {
                    const nextServices = services.filter((item) => item.id !== service.id);
                    setEditingId(null);
                    await persistServices(nextServices, dashboard.services.removeSuccess);
                  }}
                />
              );
            })}
            </div>
          </div>
        ) : null}
      </div>

      {!isAdding ? (
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setErrorMessage(null);
          }}
          className="absolute bottom-5 right-5 inline-flex size-12 items-center justify-center rounded-full bg-[#16386D] text-white shadow-[0_12px_24px_rgba(22,56,109,0.28)] transition hover:bg-[#102c59] hover:shadow-[0_16px_28px_rgba(22,56,109,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={isSaving ? dashboard.services.savingChanges : dashboard.services.add}
          title={dashboard.services.add}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </button>
      ) : null}

      <style jsx>{`
        .service-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
