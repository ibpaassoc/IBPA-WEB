import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { SectionCard } from "@/shared/components/DashboardShared";
import type { DashboardNotification } from "@/lib/notifications";
import { getLocaleNumberFormat, useI18n } from "@/lib/i18n";

type OverviewCard = {
  label: string;
  value: string;
  helper: string;
};

type QuickAction = {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
};

type ProfileChecklist = ReturnType<
  typeof import("@/lib/dashboard-cabinet").buildOnboardingChecklist
>;

type NotificationMeta = {
  categoryLabel: string;
  priorityLabel: string;
  categoryClassName: string;
  priorityClassName: string;
};

type DashboardTab =
  | "billing"
  | "notifications"
  | "certificates"
  | "events"
  | "support"
  | "directory"
  | "teamMembers";

type TeamMemberPreview = {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  accessStatus?: string;
  registrationStatus?: string;
};

type DashboardEventPreview = {
  id?: string;
  title?: string;
  name?: string;
  date?: string;
  startsAt?: string;
  startDate?: string;
  eventDate?: string;
  dateDisplay?: string;
  location?: string;
};

type DashboardOverviewProps = {
  statusSummary: {
    label: string;
    description: string;
    tone: "pending" | "active" | "verified";
  };
  isPartnerOwner: boolean;
  isTeamMemberDashboard: boolean;
  isMembershipActive: boolean;
  fullName: string;
  username: string;
  locationDisplay: string;
  specializationDisplay: string;
  overviewCards: OverviewCard[];
  profileChecklist?: ProfileChecklist;
  profileHeroImage: string | null;
  memberIdDisplay: string;
  dashboardContactEmail: string;
  certificateStatusDisplay: string;
  alertCards: DashboardNotification[];
  getNotificationMeta: (
    notification: DashboardNotification,
  ) => NotificationMeta;
  setActiveTab: (tab: DashboardTab) => void;
  quickActions: QuickAction[];
  teamMembers?: TeamMemberPreview[];
  dashboardEvents?: DashboardEventPreview[];
};

export function DashboardOverview({
  isMembershipActive,
  fullName,
  username,
  locationDisplay,
  specializationDisplay,
  profileHeroImage,
  memberIdDisplay,
  dashboardContactEmail,
  certificateStatusDisplay,
  overviewCards,
  alertCards,
  getNotificationMeta,
  setActiveTab,
  quickActions,
  isPartnerOwner,
  teamMembers = [],
  dashboardEvents = [],
}: DashboardOverviewProps) {
  const { locale, t } = useI18n();
  const dashboard = t.dashboard;
  const localeCode = getLocaleNumberFormat(locale);
  const visibleAlerts = alertCards.slice(0, 3);
  const visibleTeamMembers = teamMembers.slice(0, 4);
  const visibleEvents = dashboardEvents.slice(0, 2);

  return (
    <div className="space-y-6">
      <SharedIdentityHero
        fullName={fullName}
        username={username}
        locationDisplay={locationDisplay}
        specializationDisplay={specializationDisplay}
        image={profileHeroImage}
        memberIdDisplay={memberIdDisplay}
        dashboardContactEmail={dashboardContactEmail}
        certificateStatusDisplay={certificateStatusDisplay}
        isMembershipActive={isMembershipActive}
        dashboard={dashboard}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-6">
          <MembershipOverview overviewCards={overviewCards} />

          <EventsCard
            events={visibleEvents}
            total={dashboardEvents.length}
            onViewAll={() => setActiveTab("events")}
            dashboard={dashboard}
            localeCode={localeCode}
          />

          {isPartnerOwner ? (
            <TeamMembersCard
              members={visibleTeamMembers}
              total={teamMembers.length}
              onViewAll={() => setActiveTab("teamMembers")}
              dashboard={dashboard}
            />
          ) : null}
        </main>

        <aside className="min-w-0 xl:sticky xl:top-6">
          <QuickActionsSidebar actions={quickActions} dashboard={dashboard} />
        </aside>
      </div>
    </div>
  );
}

function SharedIdentityHero({
  fullName,
  username,
  locationDisplay,
  specializationDisplay,
  image,
  memberIdDisplay,
  dashboardContactEmail,
  certificateStatusDisplay,
  isMembershipActive,
  dashboard,
}: {
  fullName: string;
  username: string;
  locationDisplay: string;
  specializationDisplay: string;
  image: string | null;
  memberIdDisplay: string;
  dashboardContactEmail: string;
  certificateStatusDisplay: string;
  isMembershipActive: boolean;
  dashboard: ReturnType<typeof useI18n>["t"]["dashboard"];
}) {
  return (
    <SectionCard className="overflow-hidden bg-white p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#F4FAFF] via-white to-white px-6 py-6 sm:px-7">
        <div className="space-y-6">
          <div className="flex min-w-0 items-center gap-5">
            <Avatar image={image} name={fullName} />

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#10203B] sm:text-5xl">
                  {fullName}
                </h1>

                {isMembershipActive ? <VerifiedMark /> : null}
              </div>

              <p className="mt-1 text-sm font-semibold text-[#4C7D9D]">
                {memberIdDisplay}
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {dashboardContactEmail || `@${username}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-7">
        <InfoTile label={dashboard.overview.profile} value={`@${username}`} />
        <InfoTile
          icon={<MapPin className="h-4 w-4" />}
          label={dashboard.overview.location}
          value={locationDisplay}
        />
        <InfoTile
          icon={<Sparkles className="h-4 w-4" />}
          label={dashboard.overview.specialty}
          value={specializationDisplay}
        />
        <InfoTile
          icon={<ShieldCheck className="h-4 w-4" />}
          label={dashboard.overview.certificate}
          value={certificateStatusDisplay}
        />
      </div>
    </SectionCard>
  );
}

function EventsCard({
  events,
  total,
  onViewAll,
  dashboard,
  localeCode,
}: {
  events: DashboardEventPreview[];
  total: number;
  onViewAll: () => void;
  dashboard: ReturnType<typeof useI18n>["t"]["dashboard"];
  localeCode: string;
}) {
  return (
    <SectionCard className="h-full">
      <CardHeader
        title={dashboard.overview.events}
        actionLabel={dashboard.overview.viewAll}
        onAction={onViewAll}
      />

      <div className="mt-5 space-y-3">
        {events.length > 0 ? (
          events.map((event, index) => {
            const title =
              event.title || event.name || dashboard.overview.upcomingEventFallback;
            const rawDate =
              event.dateDisplay ||
              event.date ||
              event.eventDate ||
              event.startsAt ||
              event.startDate;

            const date = rawDate
              ? new Date(rawDate).toLocaleDateString(localeCode, {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                })
              : dashboard.statuses.pending;

            return (
              <button
                key={event.id || `${title}-${index}`}
                type="button"
                onClick={onViewAll}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-left transition hover:border-[#c5d7e6] hover:bg-white"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E9F1F8] text-[#4C7D9D]">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#10203B]">
                    {title}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">{date}</p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })
        ) : (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            text={dashboard.overview.noScheduledEvents}
          />
        )}
      </div>

      {total > events.length ? (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 text-sm font-semibold text-[#4C7D9D]"
        >
          {dashboard.overview.moreEvents(total - events.length)}
        </button>
      ) : null}
    </SectionCard>
  );
}

function MembershipOverview({ overviewCards }: { overviewCards: OverviewCard[] }) {
  const { t } = useI18n();

  return (
    <SectionCard>
      <SectionTitle title={t.dashboard.overview.membershipOverview} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {overviewCards.map((item) => (
          <InfoTile key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </SectionCard>
  );
}

function TeamMembersCard({
  members,
  total,
  onViewAll,
  dashboard,
}: {
  members: TeamMemberPreview[];
  total: number;
  onViewAll: () => void;
  dashboard: ReturnType<typeof useI18n>["t"]["dashboard"];
}) {
  return (
    <SectionCard className="h-full">
      <CardHeader
        title={dashboard.overview.teamMembers}
        actionLabel={dashboard.overview.viewAll}
        onAction={onViewAll}
      />

      <div className="mt-5 space-y-3">
        {members.length > 0 ? (
          members.map((member, index) => {
            const name =
              member.fullName || member.name || dashboard.teamMembers.teamMemberRoleFallback;
            const subtitle =
              member.role ||
              member.email ||
              member.registrationStatus ||
              dashboard.nav.currentMember;

            return (
              <button
                key={member.id || member.email || `${name}-${index}`}
                type="button"
                onClick={onViewAll}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 text-left transition hover:border-[#c5d7e6] hover:bg-white"
              >
                <InitialsAvatar name={name} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#10203B]">
                    {name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {subtitle}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })
        ) : (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            text={dashboard.overview.noTeamMembers}
          />
        )}
      </div>

      {total > members.length ? (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 text-sm font-semibold text-[#4C7D9D]"
        >
          {dashboard.overview.moreMembers(total - members.length)}
        </button>
      ) : null}
    </SectionCard>
  );
}

function QuickActionsSidebar({
  actions,
  dashboard,
}: {
  actions: QuickAction[];
  dashboard: ReturnType<typeof useI18n>["t"]["dashboard"];
}) {
  return (
    <SectionCard>
      <SectionTitle title={dashboard.overview.quickActions} />

      <div className="mt-5 space-y-3">
        {actions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-left transition hover:border-[#c5d7e6] hover:bg-white hover:shadow-[0_18px_30px_rgba(15,23,42,0.05)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E9F1F8] text-[#4C7D9D] transition group-hover:bg-[#dcebf7]">
              {item.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#10203B]">
                {item.label}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#4C7D9D]" />
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[#10203B]">
        {value}
      </p>
    </div>
  );
}

function CardHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <SectionTitle title={title} />
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#4C7D9D] transition hover:text-[#10203B]"
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] p-4 text-sm text-slate-500">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#4C7D9D]">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}

function Avatar({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] text-xl font-semibold text-white shadow-[0_18px_35px_rgba(76,125,157,0.22)]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = getInitials(name);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E9F1F8] text-sm font-semibold text-[#4C7D9D]">
      {initials || <Users className="h-4 w-4" />}
    </div>
  );
}

function VerifiedMark() {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
      <Check className="h-4 w-4 stroke-[3]" />
    </span>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
      {title}
    </p>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
