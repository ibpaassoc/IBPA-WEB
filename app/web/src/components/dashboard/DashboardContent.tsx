"use client";

import type { Dispatch, SetStateAction } from "react";
import type { DashboardNotification } from "@/lib/notifications";
import type { ProfileRecordData } from "@/lib/profile-record";
import type {
  Certificate,
  ExternalCertificate,
  SupportMode,
  TabType,
} from "./dashboard-types";
import type { NotificationPreferenceKey, NotificationPreferences, } from "@/lib/dashboard-cabinet";

import { DashboardOverview } from "./DashboardOverview";
import { DashboardCertificates } from "./DashboardCertificates";
import { DashboardDirectory } from "./DashboardDirectory";
import { DashboardTeamMembers } from "./DashboardTeamMembers";
import { DashboardProfile } from "./DashboardProfile";
import { DashboardBilling } from "./DashboardBilling";
import { DashboardEvents } from "./DashboardEvents";
import { DashboardSupport } from "./DashboardSupport";
import { DashboardAccountSettings } from "./DashboardAccountSettings";
import { UnderDevelopmentPage } from "@/shared/components/UnderDevelopment";
import { useI18n } from "@/lib/i18n";

type EventRegistrationFilter = "all" | "registered" | "not_registered";

type ProfileChecklist = ReturnType<
  typeof import("@/lib/dashboard-cabinet").buildOnboardingChecklist
>;

type Props = {
  activeTab: TabType;
  setActiveTab: Dispatch<SetStateAction<TabType>>;

  isTeamMemberDashboard: boolean;
  isPartnerOwner: boolean;
  isMembershipActive: boolean;
  showCertificatesTab: boolean;

  teamMemberAccess: any;
  partnerTeamSummary: any;
  primaryCertificate: any;

  fullName: string;
  username: string;
  dashboardContactEmail: string;
  memberIdDisplay: string;
  membershipCategoryLabel: string;
  membershipExpiresDisplay: string;
  certificateStatusDisplay: string;
  publicProfileHref: string | null;
  supportMode: SupportMode;
  setSupportMode: (mode: SupportMode) => void;
  supportPhone: string;
  setSupportPhone: (value: string) => void;
  supportTopicLabel: string;
  supportMessage: string;
  setSupportMessage: (value: string) => void;
  handleSupportSubmit: () => Promise<void>;
  supportSubmitting: boolean;
  supportFaqItems: {
    question: string;
    answer: string;
  }[];

  statusSummary: any;
  mergedProfileData: ProfileRecordData;
  profileHeroImage: string | null;
  locationDisplay: string;
  specializationDisplay: string;
  instagramUrl: string | null;
  websiteUrl: string | null;
  achievementsSummary: string;
  snapshotItems: any[];

  certificates: any[];
  externalCertificates: ExternalCertificate[];
  billingEntries: any[];
  overviewCards: any[];
  profileChecklist: ProfileChecklist;
  quickActions: any[];

  eventRegistrationFilter: EventRegistrationFilter;
  setEventRegistrationFilter: (filter: EventRegistrationFilter) => void;
  filteredEventCards: any[];
  dashboardEvents: any[];
  registerDashboardEvent: (eventId: string) => Promise<unknown>;
  unregisterDashboardEvent: (eventId: string) => Promise<unknown>;

  directoryMembers: any[];

  allNotifications: DashboardNotification[];
  alertCards: DashboardNotification[];
  getNotificationMeta: (notification: DashboardNotification) => any;
  notificationPreferences: NotificationPreferences;
  togglePreference: (key: NotificationPreferenceKey) => void;

  copyPublicLink: () => void;
  lastSyncedAt: string | null;
  partnerSeatPrice: number;
  refreshDashboardData: (params?: { silent?: boolean }) => Promise<void>;
};

export function DashboardContent(props: Props) {
  const { t } = useI18n();
  const {
    activeTab,
    setActiveTab,
    isTeamMemberDashboard,
    isPartnerOwner,
    isMembershipActive,
    showCertificatesTab,
    teamMemberAccess,
    partnerTeamSummary,
    primaryCertificate,
    fullName,
    username,
    dashboardContactEmail,
    memberIdDisplay,
    membershipCategoryLabel,
    membershipExpiresDisplay,
    certificateStatusDisplay,
    publicProfileHref,
    supportMode,
    setSupportMode,
    supportPhone,
    setSupportPhone,
    supportTopicLabel,
    supportMessage,
    setSupportMessage,
    handleSupportSubmit,
    supportSubmitting,
    supportFaqItems,
    statusSummary,
    mergedProfileData,
    profileHeroImage,
    locationDisplay,
    specializationDisplay,
    instagramUrl,
    websiteUrl,
    achievementsSummary,
    snapshotItems,
    certificates,
    externalCertificates,
    billingEntries,
    overviewCards,
    profileChecklist,
    quickActions,
    eventRegistrationFilter,
    setEventRegistrationFilter,
    filteredEventCards,
    dashboardEvents,
    registerDashboardEvent,
    unregisterDashboardEvent,
    directoryMembers,
    allNotifications,
    alertCards,
    getNotificationMeta,
    notificationPreferences,
    togglePreference,
    copyPublicLink,
    lastSyncedAt,
    partnerSeatPrice,
    refreshDashboardData,
  } = props;

  switch (activeTab) {
    case "profile":
      return (
        <DashboardProfile
          isTeamMemberDashboard={isTeamMemberDashboard}
          teamMemberAccess={teamMemberAccess}
          profileHeroImage={profileHeroImage}
          fullName={fullName}
          statusSummary={statusSummary}
          username={username}
          locationDisplay={locationDisplay}
          specializationDisplay={specializationDisplay}
          instagramUrl={instagramUrl}
          websiteUrl={websiteUrl}
          publicProfileHref={publicProfileHref}
          mergedProfileData={mergedProfileData}
          primaryCertificate={primaryCertificate as Certificate | undefined}
          membershipExpiresDisplay={membershipExpiresDisplay}
          achievementsSummary={achievementsSummary}
          memberIdDisplay={memberIdDisplay}
          membershipCategoryLabel={membershipCategoryLabel}
          snapshotItems={snapshotItems}
        />
      );

    case "certificates":
      return (
        <DashboardCertificates
          certificates={certificates}
          externalCertificates={externalCertificates}
          showCertificatesTab={showCertificatesTab}
          fullName={fullName}
          membershipExpiresDisplay={membershipExpiresDisplay}
          refreshDashboardData={refreshDashboardData}
        />
        
      );

    case "billing":
      return (
        <DashboardBilling
          isPartnerOwner={isPartnerOwner}
          membershipCategoryLabel={membershipCategoryLabel}
          primaryCertificate={primaryCertificate}
          membershipExpiresDisplay={membershipExpiresDisplay}
          statusSummary={statusSummary}
          billingEntries={billingEntries}
          lastSyncedAt={lastSyncedAt}
          partnerSeatPrice={partnerSeatPrice}
          setActiveTab={setActiveTab}
        />
      );

    case "events":
      return (
        <DashboardEvents
          eventRegistrationFilter={eventRegistrationFilter}
          setEventRegistrationFilter={setEventRegistrationFilter}
          filteredEventCards={filteredEventCards}
          registerDashboardEvent={registerDashboardEvent}
          unregisterDashboardEvent={unregisterDashboardEvent}
        />
      );

    case "directory":
      return <DashboardDirectory directoryMembers={directoryMembers} />;

    case "support":
      return (
        <DashboardSupport
          supportMode={supportMode}
          setSupportMode={setSupportMode}
          dashboardContactEmail={dashboardContactEmail}
          memberIdDisplay={memberIdDisplay}
          supportPhone={supportPhone}
          setSupportPhone={setSupportPhone}
          supportTopicLabel={supportTopicLabel}
          supportMessage={supportMessage}
          setSupportMessage={setSupportMessage}
          handleSupportSubmit={handleSupportSubmit}
          supportSubmitting={supportSubmitting}
          faqItems={supportFaqItems}
        />
      );

    case "accountSettings":
      return <DashboardAccountSettings />;

    case "notifications":
      return (
        /* <DashboardNotifications
          allNotifications={allNotifications}
          getNotificationMeta={getNotificationMeta}
          notificationPreferences={notificationPreferences}
          togglePreference={togglePreference}
        /> */
        <UnderDevelopmentPage
          title={t.dashboard.notifications.title}
          description={t.dashboard.notifications.description}
          expectedLabel={t.dashboard.notifications.expectedLabel}
          backLabel={t.dashboard.notifications.backLabel}
          notifyLabel={t.dashboard.notifications.notifyLabel}
          items={t.dashboard.notifications.items}
        />
      );

    case "teamMembers":
      return <DashboardTeamMembers isPartnerOwner={isPartnerOwner} />;

    case "dashboard":
    default:
      return (
        <DashboardOverview
          statusSummary={statusSummary}
          isPartnerOwner={isPartnerOwner}
          isTeamMemberDashboard={isTeamMemberDashboard}
          isMembershipActive={isMembershipActive}
          fullName={fullName}
          username={username}
          locationDisplay={locationDisplay}
          specializationDisplay={specializationDisplay}
          overviewCards={overviewCards}
          profileChecklist={profileChecklist}
          profileHeroImage={profileHeroImage}
          memberIdDisplay={memberIdDisplay}
          dashboardContactEmail={dashboardContactEmail}
          certificateStatusDisplay={certificateStatusDisplay}
          alertCards={alertCards}
          getNotificationMeta={getNotificationMeta}
          setActiveTab={setActiveTab}
          quickActions={quickActions}
          teamMembers={partnerTeamSummary?.invitedMembers || []}
          dashboardEvents={dashboardEvents}
        />
      );
  }
}
