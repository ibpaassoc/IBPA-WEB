import { listApplicationQueue } from "../../applications/server/application-admin.service";
import { listContentItems } from "../../events/server/event-admin.repository";
import { listProfiles } from "../../profiles/server/profile-admin.repository";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminSearchGroup } from "../types/admin-search.types";

const RESULTS_PER_GROUP = 5;

function toSection(href: string, query: string) {
  return `${href}?q=${encodeURIComponent(query)}`;
}

export async function searchAdmin(query: string): Promise<AdminSearchGroup[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const [profilesResult, applicationsResult, contentResult] = await Promise.allSettled([
    listProfiles({ limit: 8, q: trimmed }),
    listApplicationQueue({ q: trimmed }),
    listContentItems(),
  ]);

  const groups: AdminSearchGroup[] = [];

  if (profilesResult.status === "fulfilled") {
    const profiles = profilesResult.value.items ?? [];

    groups.push({
      items: profiles.slice(0, RESULTS_PER_GROUP).map((profile) => ({
        href: toSection("/admin/profiles", trimmed),
        id: profile.id,
        subtitle: profile.email,
        title: profile.userName || profile.cardName || profile.email,
      })),
      key: "profiles",
      label: "Profiles",
    });

    const userProfiles = profiles.filter((profile) => Boolean(profile.userId));
    groups.push({
      items: userProfiles.slice(0, RESULTS_PER_GROUP).map((profile) => ({
        href: toSection("/admin/users", trimmed),
        id: profile.userId as string,
        subtitle: profile.email,
        title: profile.userName || profile.email,
      })),
      key: "users",
      label: "Users",
    });

    const certified = profiles.filter((profile) => Boolean(profile.certificateNumber));
    groups.push({
      items: certified.slice(0, RESULTS_PER_GROUP).map((profile) => ({
        href: toSection("/admin/certificates", trimmed),
        id: profile.id,
        subtitle: profile.userName || profile.email,
        title: `Certificate ${profile.certificateNumber}`,
      })),
      key: "certificates",
      label: "Certificates",
    });
  }

  if (applicationsResult.status === "fulfilled") {
    const records = applicationsResult.value.records ?? [];

    groups.push({
      items: records.slice(0, RESULTS_PER_GROUP).map((record) => ({
        href: toSection("/admin/applications", trimmed),
        id: `${record.kind}:${record.id}`,
        subtitle: `${record.applicantEmail} · ${record.statusLabel}`,
        title: record.applicantName,
      })),
      key: "applications",
      label: "Applications",
    });
  }

  if (contentResult.status === "fulfilled") {
    const needle = trimmed.toLowerCase();
    const events = (contentResult.value?.items ?? []).filter(
      (item) => item.type === "events" && item.title.toLowerCase().includes(needle),
    );

    groups.push({
      items: events.slice(0, RESULTS_PER_GROUP).map((item) => ({
        href: toSection("/admin/events", trimmed),
        id: item.id,
        subtitle: item.eventDate ? formatAdminDate(item.eventDate) : undefined,
        title: item.title,
      })),
      key: "events",
      label: "Events",
    });
  }

  return groups.filter((group) => group.items.length > 0);
}
