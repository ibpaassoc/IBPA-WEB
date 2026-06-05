"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CombinedProfileData } from "@/lib/application-profile";
import type { DashboardNotification } from "@/lib/notifications";
import type { SupportMode, TabType } from "./dashboard-types";
import type { NotificationPreferenceKey, NotificationPreferences, } from "@/lib/dashboard-cabinet";

import { DashboardOverview } from "./DashboardOverview";
import { DashboardCertificates } from "./DashboardCertificates";
import { DashboardDirectory } from "./DashboardDirectory";
import { DashboardTeamMembers } from "./DashboardTeamMembers";
import { DashboardProfile } from "./DashboardProfile";
import { DashboardBilling } from "./DashboardBilling";
import { DashboardEvents } from "./DashboardEvents";
import { DashboardSupport } from "./DashboardSupport";
import { DashboardNotifications } from "./DashboardNotifications";
import { UnderDevelopmentPage } from "@/shared/components/UnderDevelopment";

type EventAudienceFilter = "all" | "members" | "open";

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

  statusSummary: any;
  mergedProfileData: CombinedProfileData;
  profileHeroImage: string | null;
  locationDisplay: string;
  specializationDisplay: string;
  instagramUrl: string | null;
  websiteUrl: string | null;
  certificateSummary: string;
  achievementsSummary: string;
  snapshotItems: any[];

  certificates: any[];
  billingEntries: any[];
  overviewCards: any[];
  profileChecklist: ProfileChecklist;
  quickActions: any[];

  eventAudienceFilter: EventAudienceFilter;
  setEventAudienceFilter: (filter: EventAudienceFilter) => void;
  filteredEventCards: any[];
  dashboardEvents: any[];

  directoryMembers: any[];

  supportMode: SupportMode;
  setSupportMode: (mode: SupportMode) => void;
  supportPhone: string;
  setSupportPhone: (value: string) => void;
  supportTopicLabel: string;
  supportMessage: string;
  setSupportMessage: (value: string) => void;
  handleSupportSubmit: () => Promise<void>;
  supportSubmitting: boolean;
  quickAnswers: string[];
  faqItems: {
    question: string;
    answer: string;
  }[];

  allNotifications: DashboardNotification[];
  alertCards: DashboardNotification[];
  getNotificationMeta: (notification: DashboardNotification) => any;
  notificationPreferences: NotificationPreferences;
  togglePreference: (key: NotificationPreferenceKey) => void;

  copyPublicLink: () => void;
  lastSyncedAt: string | null;
  partnerSeatPrice: number;
};

export function DashboardContent(props: Props) {
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
    statusSummary,
    mergedProfileData,
    profileHeroImage,
    locationDisplay,
    specializationDisplay,
    instagramUrl,
    websiteUrl,
    certificateSummary,
    achievementsSummary,
    snapshotItems,
    certificates,
    billingEntries,
    overviewCards,
    profileChecklist,
    quickActions,
    eventAudienceFilter,
    setEventAudienceFilter,
    filteredEventCards,
    dashboardEvents,
    directoryMembers,
    supportMode,
    setSupportMode,
    supportPhone,
    setSupportPhone,
    supportTopicLabel,
    supportMessage,
    setSupportMessage,
    handleSupportSubmit,
    supportSubmitting,
    quickAnswers,
    faqItems,
    allNotifications,
    alertCards,
    getNotificationMeta,
    notificationPreferences,
    togglePreference,
    copyPublicLink,
    lastSyncedAt,
    partnerSeatPrice,
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
          certificateSummary={certificateSummary}
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
          showCertificatesTab={showCertificatesTab}
          fullName={fullName}
          membershipExpiresDisplay={membershipExpiresDisplay}
          publicProfileHref={publicProfileHref}
          setActiveTab={setActiveTab}
        />
        
      );

    case "billing":
      return (
        <DashboardBilling
          isPartnerOwner={isPartnerOwner}
          partnerTeamSummary={partnerTeamSummary}
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
          eventAudienceFilter={eventAudienceFilter}
          setEventAudienceFilter={setEventAudienceFilter}
          filteredEventCards={filteredEventCards}
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
          quickAnswers={quickAnswers}
          faqItems={faqItems}
        />
      );

    case "notifications":
      return (
        /* <DashboardNotifications
          allNotifications={allNotifications}
          getNotificationMeta={getNotificationMeta}
          notificationPreferences={notificationPreferences}
          togglePreference={togglePreference}
        /> */
        <UnderDevelopmentPage title="Notifications is under development" />
      );

    case "teamMembers":
      return <DashboardTeamMembers isPartnerOwner={isPartnerOwner} />;

    case "dashboard":
    default:
      return (
        <DashboardOverview
          statusSummary={statusSummary}
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
