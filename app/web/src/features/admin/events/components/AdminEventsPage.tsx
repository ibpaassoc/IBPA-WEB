"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Download, Plus, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminSheet } from "../../shared/components/AdminSheet";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  deleteEvent,
  listContentItems,
  listEventRegistrations,
  saveEvent,
} from "../server/event-admin.repository";
import {
  duplicateEventState,
  emptyEventEditorState,
  filterEvents,
  filterRegistrations,
  normalizeEvent,
  registrationsToCsv,
  toEventEditorState,
} from "../server/event-admin.service";
import type {
  AdminEvent,
  AdminEventRegistration,
  EventEditorState,
  EventRegistrationCounts,
  EventRegistrationStatus,
  EventVisibilityFilter,
} from "../types/event-admin.types";
import { EventCardGrid } from "./EventCardGrid";
import { EventDetailsView } from "./EventDetailsView";
import { EventEditorForm } from "./EventEditorForm";
import { EventRegistrationsTable } from "./EventRegistrationsTable";

const emptyCounts: EventRegistrationCounts = {
  attended: 0,
  cancelled: 0,
  registered: 0,
  waitlisted: 0,
};

type SheetMode = "closed" | "edit" | "create";

export function AdminEventsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { deferredSearch, filters, resetFilters, search, setFilter, setSearch } =
    useAdminFilters<{ visibility: EventVisibilityFilter }>({ visibility: "all" }, initialQuery);
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<"all" | EventRegistrationStatus>("all");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [form, setForm] = useState<EventEditorState>(emptyEventEditorState);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [registrations, setRegistrations] = useState<AdminEventRegistration[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<EventRegistrationCounts>(emptyCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("closed");
  // Tracks which event's registrations were requested last, so a slow
  // response can't fill the table of a different (or closed) event sheet.
  const registrationsEventIdRef = useRef<string | null>(null);

  const loadEvents = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true);

    try {
      const data = await listContentItems();
      const nextEvents = Array.isArray(data.items)
        ? data.items.filter((item) => item.type === "events").map(normalizeEvent)
        : [];
      setEvents(nextEvents);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load events.");
      if (!silent) setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const visibleEvents = useMemo(
    () => filterEvents(events, { query: deferredSearch, visibility: filters.visibility }),
    [deferredSearch, events, filters.visibility],
  );

  const visibleRegistrations = useMemo(
    () => filterRegistrations(registrations, { query: registrationSearch, status: registrationStatus }),
    [registrationSearch, registrationStatus, registrations],
  );

  const loadRegistrations = async (event: AdminEvent) => {
    registrationsEventIdRef.current = event.id;
    setIsLoadingRegistrations(true);
    try {
      const response = await listEventRegistrations(event.id);
      if (registrationsEventIdRef.current !== event.id) return;
      setRegistrations(Array.isArray(response.items) ? response.items : []);
      setRegistrationCounts(response.counts ?? emptyCounts);
    } catch (error) {
      if (registrationsEventIdRef.current !== event.id) return;
      toast.error(error instanceof Error ? error.message : "Failed to load registrations.");
      setRegistrations([]);
      setRegistrationCounts(emptyCounts);
    } finally {
      if (registrationsEventIdRef.current === event.id) setIsLoadingRegistrations(false);
    }
  };

  const openEvent = (event: AdminEvent) => {
    setSelectedEvent(event);
    setForm(toEventEditorState(event));
    setSheetMode("edit");
    void loadRegistrations(event);
  };

  const openCreate = () => {
    registrationsEventIdRef.current = null;
    setSelectedEvent(null);
    setForm({ ...emptyEventEditorState });
    setRegistrations([]);
    setRegistrationCounts(emptyCounts);
    setSheetMode("create");
  };

  const closeSheet = () => {
    registrationsEventIdRef.current = null;
    setSheetMode("closed");
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and details are required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveEvent(form);
      if (response.item) {
        const saved = normalizeEvent(response.item);
        setEvents((current) => {
          const exists = current.some((event) => event.id === saved.id);
          return exists
            ? current.map((event) => (event.id === saved.id ? saved : event))
            : [saved, ...current];
        });
        setSelectedEvent(saved);
        setForm(toEventEditorState(saved));
        setSheetMode("edit");
        await loadRegistrations(saved);
      } else {
        await loadEvents({ silent: true });
      }
      toast.success(form.id ? "Event updated." : "Event added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: AdminEvent) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;

    try {
      await deleteEvent(event.id);
      setEvents((current) => current.filter((item) => item.id !== event.id));
      if (selectedEvent?.id === event.id) closeSheet();
      toast.success("Event deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete event.");
    }
  };

  const exportRegistrations = () => {
    if (visibleRegistrations.length === 0) {
      toast.error("There are no registrations to export.");
      return;
    }

    const blob = new Blob([registrationsToCsv(visibleRegistrations)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedEvent?.title || "event"}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sheetOpen = sheetMode !== "closed";
  const sheetTitle = sheetMode === "create" ? "New event" : selectedEvent?.title || "Edit event";
  const sheetEyebrow = sheetMode === "create" ? "Compose event" : "Edit event";

  return (
    <>
      <AdminPageShell
        actions={
          <>
            <Button
              className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
              onClick={() => void loadEvents()}
              type="button"
              variant="outline"
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
            <Button
              className="h-10 gap-2 rounded-2xl bg-[#1F5D8F] px-5 text-sm text-white hover:bg-[#10203B]"
              onClick={openCreate}
              type="button"
            >
              <Plus className="size-4" />
              Add event
            </Button>
          </>
        }
        eyebrow="Admin workspace"
        title="Events"
      >
        <section className="rounded-[28px] border border-[#D7E5F4] bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="lg:flex-1">
              <AdminSearch
                onChange={setSearch}
                placeholder="Search by title, location, or detail"
                value={search}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                onValueChange={(value) => setFilter("visibility", value as EventVisibilityFilter)}
                value={filters.visibility}
              >
                <SelectTrigger className="h-10 w-44 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All events</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
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
            <span className="hidden text-xs tabular-nums text-[#6C7F95] lg:inline">
              {formatAdminCount(visibleEvents.length, "event")}
            </span>
          </div>
        </section>

        {/* The grid */}
        <EventCardGrid
          events={visibleEvents}
          isLoading={isLoading}
          onDelete={handleDelete}
          onDuplicate={(event) => {
            setForm(duplicateEventState(event));
            setSelectedEvent(null);
            setSheetMode("create");
          }}
          onEdit={openEvent}
          selectedId={selectedEvent?.id ?? null}
        />
      </AdminPageShell>

      <AdminSheet
        onOpenChange={(next) => (next ? null : closeSheet())}
        open={sheetOpen}
        eyebrow={sheetEyebrow}
        title={sheetTitle}
        description={sheetMode === "create"
          ? "Set the date, location, and copy. You can publish or save as draft."
          : "Update the event and review registrations from one place."}
        size="xl"
      >
        <Tabs defaultValue="editor" className="flex flex-col gap-6">
          <TabsList className="self-start">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="details" disabled={sheetMode === "create"}>
              Details
            </TabsTrigger>
            <TabsTrigger value="registrations" disabled={sheetMode === "create"}>
              Registrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" forceMount className="m-0 data-[state=inactive]:hidden">
            <EventEditorForm
              form={form}
              isSaving={isSaving}
              onChange={setForm}
              onReset={() => setForm({ ...emptyEventEditorState })}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="details" className="m-0">
            <EventDetailsView counts={registrationCounts} event={selectedEvent} />
          </TabsContent>

          <TabsContent value="registrations" className="m-0">
            <AdminSectionCard
              title="Registrations"
              actions={
                <Button
                  className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
                  onClick={exportRegistrations}
                  type="button"
                  variant="outline"
                >
                  <Download data-icon="inline-start" />
                  Export
                </Button>
              }
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex-1">
                    <AdminSearch
                      onChange={setRegistrationSearch}
                      placeholder="Search registrants"
                      value={registrationSearch}
                    />
                  </div>
                  <Select
                    onValueChange={(value) =>
                      setRegistrationStatus(value as "all" | EventRegistrationStatus)
                    }
                    value={registrationStatus}
                  >
                    <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="REGISTERED">Registered</SelectItem>
                        <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                        <SelectItem value="ATTENDED">Attended</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <EventRegistrationsTable
                  isLoading={isLoadingRegistrations}
                  registrations={visibleRegistrations}
                />
              </div>
            </AdminSectionCard>
          </TabsContent>
        </Tabs>
      </AdminSheet>
    </>
  );
}
