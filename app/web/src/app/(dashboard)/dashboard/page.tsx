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

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();

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
    supportMessage,
    setSupportMessage,
    supportPhone,
    setSupportPhone,
    supportSubmitting,
    supportTopicLabel,
    handleSupportSubmit,
    quickAnswers,
    faqItems,
  } = useDashboardSupport({
    supportMode,
    fullName: derived.fullName,
    fallbackFullName: user?.fullName,
    dashboardContactEmail: derived.dashboardContactEmail,
    memberIdDisplay: derived.memberIdDisplay,
    membershipCategoryLabel: derived.membershipCategoryLabel,
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

    if (finalDerived.isPartnerOwner && activeTab === "certificates") {
      setActiveTab("billing");
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
        accessBlocked ? "Access blocked" : finalDerived.statusSummary.label
      }
      memberSinceDisplay={finalDerived.memberSinceDisplay}
      lastSyncedAt={lastSyncedAt}
      contentProps={{
        activeTab,
        setActiveTab,
        isSignedIn: Boolean(isSignedIn),
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
        statusSummary: accessBlocked
          ? {
              ...finalDerived.statusSummary,
              label: "Access blocked",
              description:
                accessErrorMessage ||
                "This dashboard is available only after your IBPA membership payment has been completed and activated.",
            }
          : finalDerived.statusSummary,
        mergedProfileData: finalDerived.mergedProfileData,
        profileHeroImage: finalDerived.profileHeroImage,
        locationDisplay: finalDerived.locationDisplay,
        specializationDisplay: finalDerived.specializationDisplay,
        instagramUrl: finalDerived.instagramUrl,
        websiteUrl: finalDerived.websiteUrl,
        certificateSummary: finalDerived.certificateSummary,
        achievementsSummary: finalDerived.achievementsSummary,
        snapshotItems: finalDerived.snapshotItems,
        certificates,
        billingEntries: finalDerived.billingEntries,
        overviewCards: finalDerived.overviewCards,
        profileChecklist: finalDerived.profileChecklist,
        quickActions: finalDerived.quickActions,
        eventAudienceFilter,
        setEventAudienceFilter,
        filteredEventCards: finalDerived.filteredEventCards,
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
        copyPublicLink: finalDerived.copyPublicLink,
        lastSyncedAt,
        partnerSeatPrice: finalDerived.partnerSeatPrice,
      }}
    />
  );
}
