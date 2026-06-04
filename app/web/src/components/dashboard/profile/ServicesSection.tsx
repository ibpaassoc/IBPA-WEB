"use client";

import { startTransition, useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { ProfileService } from "@/lib/application-profile";

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
      ...(service.description?.trim()
        ? { description: service.description.trim() }
        : {}),
    }));
}

async function saveServices(services: ProfileService[]) {
  const response = await fetch("/api/dashboard/profile", {
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
        : "Unable to save services right now.",
    );
  }
}

export function ServicesSection({
  initialServices,
}: {
  initialServices?: ProfileService[] | null;
}) {
  const [services, setServices] = useState<ProfileService[]>(() =>
    normalizeServices(initialServices),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startSavingTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      setServices(normalizeServices(initialServices));
      setEditingId(null);
      setIsAdding(false);
    });
  }, [initialServices]);

  const persistServices = (nextServices: ProfileService[], successMessage: string) => {
    const previousServices = services;
    setServices(nextServices);

    startSavingTransition(async () => {
      try {
        await saveServices(nextServices);
        toast.success(successMessage);
      } catch (error) {
        setServices(previousServices);
        toast.error(error instanceof Error ? error.message : "Unable to save services.");
      }
    });
  };

  return (
    <section className="rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_18px_45px_rgba(11,31,68,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#16386D]">
            Common Services
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Showcase the services members can book, request, or inquire about.
          </p>
        </div>

        {!isAdding ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#16386D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102c59] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {isAdding ? (
          <ServiceEditor
            saving={isPending}
            onCancel={() => setIsAdding(false)}
            onSave={(draft) => {
              const nextServices = [
                ...services,
                {
                  id: createServiceId(),
                  title: draft.title,
                  ...(draft.description ? { description: draft.description } : {}),
                },
              ];

              setIsAdding(false);
              persistServices(nextServices, "Service added.");
            }}
          />
        ) : null}

        {services.length === 0 && !isAdding ? (
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-5 py-6 text-sm leading-6 text-slate-500">
            No services added yet.
            <br />
            Click &quot;Add Service&quot; to showcase your professional offerings.
          </div>
        ) : null}

        {services.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service, index) => {
              const isEditing = editingId === service.id;

              if (isEditing) {
                return (
                  <ServiceEditor
                    key={service.id}
                    service={service}
                    saving={isPending}
                    onCancel={() => setEditingId(null)}
                    onSave={(draft) => {
                      const nextServices = services.map((item) =>
                        item.id === service.id
                          ? {
                              ...item,
                              title: draft.title,
                              ...(draft.description
                                ? { description: draft.description }
                                : { description: undefined }),
                            }
                          : item,
                      );

                      setEditingId(null);
                      persistServices(nextServices, "Service updated.");
                    }}
                  />
                );
              }

              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  canMoveUp={index > 0}
                  canMoveDown={index < services.length - 1}
                  disabled={isPending}
                  onEdit={() => {
                    setEditingId(service.id);
                    setIsAdding(false);
                  }}
                  onDelete={() => {
                    const nextServices = services.filter((item) => item.id !== service.id);
                    setEditingId(null);
                    persistServices(nextServices, "Service removed.");
                  }}
                  onMoveUp={() => {
                    if (index === 0) return;
                    const nextServices = [...services];
                    [nextServices[index - 1], nextServices[index]] = [
                      nextServices[index],
                      nextServices[index - 1],
                    ];
                    persistServices(nextServices, "Services reordered.");
                  }}
                  onMoveDown={() => {
                    if (index >= services.length - 1) return;
                    const nextServices = [...services];
                    [nextServices[index], nextServices[index + 1]] = [
                      nextServices[index + 1],
                      nextServices[index],
                    ];
                    persistServices(nextServices, "Services reordered.");
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
