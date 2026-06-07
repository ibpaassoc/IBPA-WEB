"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Download, RefreshCw } from "lucide-react";
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
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
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
import { EventDetailsView } from "./EventDetailsView";
import { EventEditorForm } from "./EventEditorForm";
import { EventRegistrationsTable } from "./EventRegistrationsTable";
import { EventsTable } from "./EventsTable";

const emptyCounts: EventRegistrationCounts = {
  attended: 0,
  cancelled: 0,
  registered: 0,
  waitlisted: 0,
};

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
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadEvents = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const data = await listContentItems();
      const nextEvents = Array.isArray(data.items)
        ? data.items.filter((item) => item.type === "events").map(normalizeEvent)
        : [];
      setEvents(nextEvents);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load events.");
      if (!silent) {
        setEvents([]);
      }
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
    setIsLoadingRegistrations(true);
    try {
      const response = await listEventRegistrations(event.id);
      setRegistrations(Array.isArray(response.items) ? response.items : []);
      setRegistrationCounts(response.counts ?? emptyCounts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load registrations.");
      setRegistrations([]);
      setRegistrationCounts(emptyCounts);
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  const openEvent = (event: AdminEvent) => {
    setSelectedEvent(event);
    setForm(toEventEditorState(event));
    void loadRegistrations(event);
  };

  const resetForm = () => {
    setForm({ ...emptyEventEditorState });
    setSelectedEvent(null);
    setRegistrations([]);
    setRegistrationCounts(emptyCounts);
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
      if (selectedEvent?.id === event.id) {
        resetForm();
      }
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

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadEvents()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Manage event content separately from registration review and attendee export."
      lastSyncedAt={lastSyncedAt}
      title="Events"
    >
      <AdminFilters>
        <AdminSearch
          onChange={setSearch}
          placeholder="Search event title, location, or details"
          value={search}
        />
        <Select
          onValueChange={(value) => setFilter("visibility", value as EventVisibilityFilter)}
          value={filters.visibility}
        >
          <SelectTrigger className="w-full lg:w-48">
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
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]">
        <div className="flex flex-col gap-6">
          <AdminSectionCard
            description={formatAdminCount(visibleEvents.length, "event")}
            title="Event management"
          >
            <EventsTable
              events={visibleEvents}
              isLoading={isLoading}
              onDelete={handleDelete}
              onDuplicate={(event) => {
                setForm(duplicateEventState(event));
                setSelectedEvent(null);
              }}
              onOpen={openEvent}
              selectedId={selectedEvent?.id ?? null}
            />
          </AdminSectionCard>

          <EventDetailsView counts={registrationCounts} event={selectedEvent} />

          <AdminSectionCard
            actions={
              <Button onClick={exportRegistrations} type="button" variant="outline">
                <Download data-icon="inline-start" />
                Export
              </Button>
            }
            description="Registration management is intentionally separate from event editing."
            title="Registrations"
          >
            <AdminFilters>
              <AdminSearch
                onChange={setRegistrationSearch}
                placeholder="Search registrants"
                value={registrationSearch}
              />
              <Select
                onValueChange={(value) => setRegistrationStatus(value as "all" | EventRegistrationStatus)}
                value={registrationStatus}
              >
                <SelectTrigger className="w-full lg:w-44">
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
            </AdminFilters>
            <EventRegistrationsTable
              isLoading={isLoadingRegistrations}
              registrations={visibleRegistrations}
            />
          </AdminSectionCard>
        </div>

        <AdminSectionCard
          description="Create, edit, duplicate, publish, unpublish, and preview event details."
          title={form.id ? "Edit event" : "Add event"}
        >
          <EventEditorForm
            form={form}
            isSaving={isSaving}
            onChange={setForm}
            onReset={resetForm}
            onSave={handleSave}
          />
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
