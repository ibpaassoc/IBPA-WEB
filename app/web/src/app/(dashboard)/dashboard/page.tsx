"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { useDashboardDerivedData } from "@/hooks/dashboard/useDashboardDerivedData";
import { useDashboardNotifications } from "@/hooks/dashboard/useDashboardNotifications";
import { useDashboardSeenActivity } from "@/hooks/dashboard/useDashboardSeenActivity";
import { useDashboardSupport } from "@/hooks/dashboard/useDashboardSupport";
import { useDashboardUiState } from "@/hooks/dashboard/useDashboardUiState";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();
  const { t } = useI18n();

  const {
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    eventAudienceFilter,
    setEventAudienceFilter,
    supportMode,
    setSupportMode,
  } = useDashboardUiState();

  const {
    certificates,
    externalCertificates,
    billingHistory,
    profileData,
    dashboardMeta,
    dashboardAccessType,
    teamMemberAccess,
    directoryMembers,
    accessBlocked,
    accessErrorMessage,
    loading,
    customNotifications,
    dashboardNews,
    dashboardEvents,
    lastSyncedAt,
    refreshDashboardData,
  } = useDashboardData({
    isSignedIn: Boolean(isSignedIn),
    userLoaded,
  });

  const { hasNewEvents } = useDashboardSeenActivity({
    activeTab,
    dashboardNews,
    dashboardEvents,
  });

  const derived = useDashboardDerivedData({
    user,
    certificates,
    billingHistory,
    profileData,
    dashboardMeta,
    dashboardAccessType,
    dashboardEvents,
    eventAudienceFilter,
    hasNewEvents,
    unreadNotificationsCount: 0,
    setActiveTab,
    setSupportMode,
  });

  const {
    allNotifications,
    alertCards,
    unreadNotificationsCount,
    notificationPreferences,
    togglePreference,
    getNotificationMeta,
  } = useDashboardNotifications({
    customNotifications,
    hasApprovedCert: derived.hasApprovedCert,
    membershipCategoryLabel: derived.membershipCategoryLabel,
    primaryCertificate: derived.primaryCertificate,
    userCreatedAt: user?.createdAt?.toISOString(),
  });

  const finalDerived = useDashboardDerivedData({
    user,
    certificates,
    billingHistory,
    profileData,
    dashboardMeta,
    dashboardAccessType,
    dashboardEvents,
    eventAudienceFilter,
    hasNewEvents,
    unreadNotificationsCount,
    setActiveTab,
    setSupportMode,
  });

  const supportState = useDashboardSupport({
    supportMode,
    fullName: finalDerived.fullName,
    fallbackFullName: user?.fullName,
    dashboardContactEmail: finalDerived.dashboardContactEmail,
    memberIdDisplay: finalDerived.memberIdDisplay,
    membershipCategoryLabel: finalDerived.membershipCategoryLabel,
  });

  useEffect(() => {
    if (
      finalDerived.isTeamMemberDashboard &&
      (activeTab === "billing" ||
        activeTab === "certificates" ||
        activeTab === "teamMembers")
    ) {
      setActiveTab("dashboard");
      return;
    }
  }, [
    activeTab,
    finalDerived.isPartnerOwner,
    finalDerived.isTeamMemberDashboard,
    setActiveTab,
  ]);

  if (!userLoaded || (isSignedIn && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4C7D9D]" />
      </div>
    );
  }

  return (
    <DashboardLayout
      userLoaded={userLoaded}
      isSignedIn={Boolean(isSignedIn)}
      unreadNotificationsCount={unreadNotificationsCount}
      isNotificationsOpen={isNotificationsOpen}
      setIsNotificationsOpen={setIsNotificationsOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      alertCards={alertCards}
      navItems={finalDerived.navItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isMobileMenuOpen={isMobileMenuOpen}
      fullName={finalDerived.fullName}
      memberIdDisplay={finalDerived.memberIdDisplay}
      statusLabel={
        accessBlocked
          ? t.dashboard.statusDescriptions.accessBlocked
          : finalDerived.statusSummary.label
      }
      memberSinceDisplay={finalDerived.memberSinceDisplay}
      lastSyncedAt={lastSyncedAt}
      contentProps={{
        activeTab,
        setActiveTab,
        isTeamMemberDashboard: finalDerived.isTeamMemberDashboard,
        isPartnerOwner: finalDerived.isPartnerOwner,
        isMembershipActive: finalDerived.isMembershipActive,
        showCertificatesTab: finalDerived.showCertificatesTab,
        teamMemberAccess,
        partnerTeamSummary: finalDerived.partnerTeamSummary,
        primaryCertificate: finalDerived.primaryCertificate,
        fullName: finalDerived.fullName,
        username: finalDerived.username,
        dashboardContactEmail: finalDerived.dashboardContactEmail,
        memberIdDisplay: finalDerived.memberIdDisplay,
        membershipCategoryLabel: finalDerived.membershipCategoryLabel,
        membershipExpiresDisplay: finalDerived.membershipExpiresDisplay,
        certificateStatusDisplay: finalDerived.certificateStatusDisplay,
        publicProfileHref: finalDerived.publicProfileHref,
        supportMode,
        setSupportMode,
        supportPhone: supportState.supportPhone,
        setSupportPhone: supportState.setSupportPhone,
        supportTopicLabel: supportState.supportTopicLabel,
        supportMessage: supportState.supportMessage,
        setSupportMessage: supportState.setSupportMessage,
        handleSupportSubmit: supportState.handleSupportSubmit,
        supportSubmitting: supportState.supportSubmitting,
        supportFaqItems: supportState.faqItems,
        statusSummary: accessBlocked
          ? {
              ...finalDerived.statusSummary,
              label: t.dashboard.statusDescriptions.accessBlocked,
              description:
                accessErrorMessage ||
                t.dashboard.statusDescriptions.accessBlockedDescription,
            }
          : finalDerived.statusSummary,
        mergedProfileData: finalDerived.mergedProfileData,
        profileHeroImage: finalDerived.profileHeroImage,
        locationDisplay: finalDerived.locationDisplay,
        specializationDisplay: finalDerived.specializationDisplay,
        instagramUrl: finalDerived.instagramUrl,
        websiteUrl: finalDerived.websiteUrl,
        achievementsSummary: finalDerived.achievementsSummary,
        snapshotItems: finalDerived.snapshotItems,
        certificates,
        externalCertificates,
        billingEntries: finalDerived.billingEntries,
        overviewCards: finalDerived.overviewCards,
        profileChecklist: finalDerived.profileChecklist,
        quickActions: finalDerived.quickActions,
        eventAudienceFilter,
        setEventAudienceFilter,
        filteredEventCards: finalDerived.filteredEventCards,
        dashboardEvents,
        directoryMembers,
        allNotifications,
        alertCards,
        getNotificationMeta,
        notificationPreferences,
        togglePreference,
        copyPublicLink: finalDerived.copyPublicLink,
        lastSyncedAt,
        partnerSeatPrice: finalDerived.partnerSeatPrice,
        refreshDashboardData,
      }}
    />
  );
}
