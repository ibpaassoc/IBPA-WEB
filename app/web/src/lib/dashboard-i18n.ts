export type DashboardDictionary = {
  nav: {
    mobileTitle: string;
    currentMember: string;
  };
  header: {
    title: string;
    signOut: string;
    signIn: string;
    openMenu: string;
  };
  overview: {
    profile: string;
    location: string;
    specialty: string;
    certificate: string;
    events: string;
    teamMembers: string;
    membershipOverview: string;
    status: string;
    memberSince: string;
    membershipType: string;
    expiryDate: string;
    quickActions: string;
    viewAll: string;
    upcomingEventFallback: string;
    noScheduledEvents: string;
    noTeamMembers: string;
    moreEvents: (count: number) => string;
    moreMembers: (count: number) => string;
  };
  statuses: Record<string, string>;
  statusDescriptions: {
    teamMemberActive: string;
    partnerVerified: string;
    membershipVerified: string;
    membershipActive: string;
    membershipPending: string;
    accessBlocked: string;
    accessBlockedDescription: string;
  };
  membershipCategories: {
    student: string;
    specialist: string;
    professional: string;
    trainer: string;
    business: string;
    brand: string;
    partner: string;
    review: string;
    partnerTeamAccess: string;
  };
  quickActions: {
    editProfile: { label: string; description: string };
    certificateStatus: { label: string; description: string };
    viewMembership: { label: string; description: string };
    memberDirectory: { label: string; description: string };
    eventsAndDiscounts: { label: string; description: string };
    support: { label: string; description: string };
  };
  summaryCards: {
    memberStatus: string;
    memberSince: string;
    membershipType: string;
    expiryDate: string;
    activationDateHelper: string;
    linkedMembershipHelper: string;
    latestCertificateHelper: string;
  };
  checklist: {
    uploadPhoto: string;
    addCertificates: string;
    completeProfile: string;
  };
  profile: {
    role: string;
    partnerBusiness: string;
    access: string;
    teamMember: string;
    partnerAccount: string;
    invited: string;
    editProfile: string;
      openPublicProfile: string;
      copyPublicProfileSuccess: string;
      copyPublicProfileUnavailable: string;
      copyPublicProfileError: string;
      openInstagram: string;
    openWebsite: string;
    locationAndSpecialization: string;
    professionalBiography: string;
    yearsOfExperience: string;
    biography: string;
    achievements: string;
    industryContribution: string;
    education: string;
    communityIdentity: string;
    memberId: string;
    membership: string;
    industry: string;
    workGallery: string;
    galleryImageAlt: (name: string, index: number) => string;
    galleryFallbackOne: string;
    galleryFallbackTwo: string;
    galleryFallbackThree: string;
    showLess: string;
    seeAll: string;
    ibpaCertificate: string;
    officialCertificate: string;
    validThrough: string;
    openCertificate: string;
    certificatePendingFile: string;
    noCertificate: string;
    notAddedYet: string;
    noBiography: string;
    noAchievements: string;
    noContribution: string;
    noEducation: string;
  };
  services: {
    title: string;
    description: string;
    empty: string;
    count: (count: number) => string;
    add: string;
    addSuccess: string;
    updateSuccess: string;
    removeSuccess: string;
    savingChanges: string;
    addTitle: string;
    editTitle: string;
    titleLabel: string;
    priceLabel: string;
    descriptionLabel: string;
    titlePlaceholder: string;
    pricePlaceholder: string;
    descriptionPlaceholder: string;
    save: string;
    cancel: string;
    detailsPlaceholder: string;
    editService: (title: string) => string;
    deleteService: (title: string) => string;
    saveError: string;
    saveErrorNow: string;
    titleRequired: string;
    titleTooLong: (max: number) => string;
    priceTooLong: (max: number) => string;
    descriptionTooLong: (max: number) => string;
  };
  certificates: {
    eyebrow: string;
    title: string;
    officialIbpa: string;
    officialCertificate: string;
    certificateId: string;
    issued: string;
    validThrough: string;
    downloadCertificate: string;
    filePending: string;
    noIssuedTitle: string;
    noIssuedDescription: string;
    uploadEyebrow: string;
    uploadTitle: string;
    certificateTitle: string;
    certificateTitlePlaceholder: string;
    chooseFile: string;
    fileTypes: string;
    uploadCertificate: string;
    personalUploadsEyebrow: string;
    personalUploadsTitle: string;
    additionalEyebrow: string;
    additionalTitle: string;
    additionalBadge: string;
    additionalCount: (count: number) => string;
    issuedOn: (dateLabel: string) => string;
    pdfDocument: string;
    previewUnavailable: string;
    uploadedCount: (count: number) => string;
    addedOn: (dateLabel: string) => string;
    recently: string;
    openFile: string;
    noUploadsTitle: string;
    noUploadsDescription: string;
    addTitleError: string;
    chooseFileError: string;
    uploadMissingUrl: string;
    saveUploadedError: string;
    uploadSuccess: string;
    uploadError: string;
    removeError: string;
    removeSuccess: string;
    removeAria: (title: string) => string;
  };
  billing: {
    title: string;
    renew: string;
    support: string;
    plan: string;
    expires: string;
    status: string;
    paymentHistory: string;
    partnerPaymentTitle: string;
    membershipPaymentTitle: string;
    noPayments: string;
    supportTitle: string;
    supportDescription: string;
    contactSupport: string;
    account: string;
  };
  events: {
    eyebrow: string;
    title: string;
    filters: {
      all: string;
      members: string;
      open: string;
    };
    audienceMembers: string;
    audienceOpen: string;
    highlighted: string;
    date: string;
    price: string;
    registration: string;
    location: string;
    locationTbd: string;
    register: string;
    unregister: string;
    openEvent: string;
    noMatches: string;
    membersRate: string;
    memberPromo: string;
    memberPerk: (membership: string) => string;
  };
  support: {
    eyebrow: string;
    title: string;
    question: string;
    questionDescription: string;
    idea: string;
    ideaDescription: string;
    problem: string;
    problemDescription: string;
    requestTitle: string;
    memberEmail: string;
    memberId: string;
    phoneOptional: string;
    phonePlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    emailDirectly: string;
    faq: string;
    emailRequired: string;
    messageTooShort: string;
    sendError: string;
    sendSuccess: string;
    faqItems: Array<{ question: string; answer: string }>;
  };
  directory: {
    title: string;
  };
  teamMembers: {
    title: string;
    partnerRequired: string;
    partnerRequiredDescription: string;
    includedSeats: string;
    usedSeats: string;
    remainingSeats: string;
    additionalSeats: string;
    pendingRequests: (count: number) => string;
    noMembersTitle: string;
    noMembersDescription: string;
    inviteFirst: string;
    activeMembers: (count: number) => string;
    extendSeats: string;
    removed: string;
    active: string;
    invited: string;
    teamMemberRoleFallback: string;
    remove: string;
    inviteTitle: string;
    fullName: string;
    email: string;
    role: string;
    portfolioLink: string;
    affiliationConfirmation: string;
    inviting: string;
    inviteMember: string;
    rulesTitle: string;
    rules: string[];
    loadError: string;
    connectionLoadError: string;
    fullNameRequired: string;
    emailRequired: string;
    roleRequired: string;
    affiliationRequired: string;
    inviteError: string;
    inviteSuccess: string;
    inviteConnectionError: string;
    removeError: string;
    removeSuccess: string;
    removeConnectionError: string;
    extendError: string;
    extendSuccess: string;
    extendConnectionError: string;
  };
  account: {
    title: string;
    signInTitle: string;
    signInDescription: string;
    signIn: string;
  };
  notifications: {
    navLabel: string;
    title: string;
    description: string;
    expectedLabel: string;
    backLabel: string;
    notifyLabel: string;
    items: string[];
  };
  community: {
    accessFallback: string;
    loadError: string;
    backToDashboard: string;
    signOut: string;
  };
  success: {
    accessEyebrow: string;
    paymentReceivedTitle: string;
    nextStepTitle: string;
    nextStepDescription: string;
    needHelpTitle: string;
    needHelpDescription: string;
    backToLanding: string;
    memberLogin: string;
    activationEyebrow: string;
    paymentSuccessPrefix: string;
    paymentSuccessHighlight: string;
    memberFallback: string;
    thankYou: (name: string) => string;
    firstTimeAccessTitle: string;
    firstTimeAccessDescription: string;
    existingAccountTitle: string;
    existingAccountDescription: string;
    approvedEmail: string;
    accountReadyEyebrow: string;
    dashboardAccessActive: string;
    accountReadyDescription: string;
    openDashboard: string;
    createAccount: string;
    signIn: string;
    errorBodies: {
      missingToken: string;
      notFound: string;
      backendUnavailable: string;
      verifyFailed: string;
    };
  };
  editProfile: {
    pageEyebrow: string;
    pageTitle: string;
    pageDescription: string;
    lockedInformation: string;
    profilePhoto: string;
    uploadNewPhoto: string;
    uploading: string;
    removePhoto: string;
    photoHelper: string;
    accessBlockedTitle: string;
    accessBlockedDescription: string;
    accessBlockedGeneric: string;
    teamMemberBlocked: string;
    profileBlocked: string;
    backToDashboard: string;
    contactSupport: string;
    cancel: string;
    saveChanges: string;
    loadError: string;
    saveError: string;
    saveSuccess: string;
    photoUpdated: string;
    photoUploadError: string;
    photoUploadMissingUrl: string;
    lockedFields: {
      fullName: string;
      email: string;
      membership: string;
      applicantType: string;
    };
    fieldLabels: Record<string, string>;
    fieldPlaceholders: Record<string, string>;
    selectPlaceholder: string;
  };
};

type EditableField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
};

function buildDashboardDictionary(copy: DashboardDictionary): DashboardDictionary {
  return copy;
}

export const dashboardDictionaries = {
  en: buildDashboardDictionary({
    nav: {
      mobileTitle: "Navigation",
      currentMember: "Current member",
    },
    header: {
      title: "Member cabinet",
      signOut: "Sign out",
      signIn: "Sign in",
      openMenu: "Open navigation menu",
    },
    overview: {
      profile: "Profile",
      location: "Location",
      specialty: "Specialty",
      certificate: "Certificate",
      events: "Events",
      teamMembers: "Team members",
      membershipOverview: "Membership Overview",
      status: "Status",
      memberSince: "Member Since",
      membershipType: "Type",
      expiryDate: "Expiry",
      quickActions: "Quick actions",
      viewAll: "View all",
      upcomingEventFallback: "Upcoming event",
      noScheduledEvents: "No scheduled events yet.",
      noTeamMembers: "No team members added yet.",
      moreEvents: (count) => `+${count} more events`,
      moreMembers: (count) => `+${count} more members`,
    },
    statuses: {
      pending: "Pending",
      approved: "Approved",
      paid: "Paid",
      issued: "Issued",
      active: "Active",
      verified: "Verified",
      invited: "Invited",
      removed: "Removed",
      review: "Pending",
    },
    statusDescriptions: {
      teamMemberActive: "Partner team access is active.",
      partnerVerified: "Partner account is active and verified.",
      membershipVerified: "Membership and certificate are verified.",
      membershipActive: "Membership is active.",
      membershipPending: "Profile is awaiting review or activation.",
      accessBlocked: "Access blocked",
      accessBlockedDescription:
        "This dashboard is available only after your IBPA membership payment has been completed and activated.",
    },
    membershipCategories: {
      student: "Student Membership",
      specialist: "Specialist Membership",
      professional: "Professional Membership",
      trainer: "Master Membership",
      business: "Business Membership",
      brand: "Partner Membership",
      partner: "Partner Membership",
      review: "Membership Review",
      partnerTeamAccess: "Partner Team Access",
    },
    quickActions: {
      editProfile: {
        label: "Edit Profile",
        description: "Update photo, bio, and professional details.",
      },
      certificateStatus: {
        label: "Certificate Status",
        description: "Track verification and downloads.",
      },
      viewMembership: {
        label: "View Membership",
        description: "Review plan, expiry, and payment activity.",
      },
      memberDirectory: {
        label: "Member Directory",
        description: "Discover peers for networking and collaboration.",
      },
      eventsAndDiscounts: {
        label: "Events & Discounts",
        description: "Browse member events and current benefits.",
      },
      support: {
        label: "Support",
        description: "Ask a question, share an idea, or report an issue.",
      },
    },
    summaryCards: {
      memberStatus: "Member status",
      memberSince: "Member since",
      membershipType: "Membership type",
      expiryDate: "Expiry date",
      activationDateHelper: "First linked activation date",
      linkedMembershipHelper: "Current linked membership record",
      latestCertificateHelper: "Latest certificate or renewal date",
    },
    checklist: {
      uploadPhoto: "Upload photo",
      addCertificates: "Add certificates",
      completeProfile: "Complete profile",
    },
    profile: {
      role: "Role",
      partnerBusiness: "Partner business",
      access: "Access",
      teamMember: "Team Member",
      partnerAccount: "Partner account",
      invited: "Invited",
      editProfile: "Edit profile",
      openPublicProfile: "Open public profile",
      copyPublicProfileSuccess: "Public profile link copied.",
      copyPublicProfileUnavailable: "Public profile link is not available yet.",
      copyPublicProfileError: "Could not copy the public profile link.",
      openInstagram: "Open Instagram",
      openWebsite: "Open website",
      locationAndSpecialization: "Location and specialization",
      professionalBiography: "Professional biography",
      yearsOfExperience: "Years of experience",
      biography: "Biography",
      achievements: "Achievements",
      industryContribution: "Industry contribution",
      education: "Education",
      communityIdentity: "Community identity",
      memberId: "Member ID",
      membership: "Membership",
      industry: "Industry",
      workGallery: "Work gallery",
      galleryImageAlt: (name, index) => `${name} gallery image ${index}`,
      galleryFallbackOne: "Featured Brow Work",
      galleryFallbackTwo: "Featured Lash Work",
      galleryFallbackThree: "Before & After Sample",
      showLess: "Show less",
      seeAll: "See all",
      ibpaCertificate: "IBPA certificate",
      officialCertificate: "Official certificate",
      validThrough: "Valid through",
      openCertificate: "Open certificate",
      certificatePendingFile: "Certificate file is not uploaded yet.",
      noCertificate: "No IBPA certificate issued yet.",
      notAddedYet: "Not added yet",
      noBiography: "No biography added yet.",
      noAchievements: "No achievements added yet.",
      noContribution: "No contribution details added yet.",
      noEducation: "No education details added yet.",
    },
    services: {
      title: "Common Services",
      description: "Add the services you want to highlight on your profile.",
      empty: "No services added yet.",
      count: (count) => `${count} ${count === 1 ? "service" : "services"}`,
      add: "Add service",
      addSuccess: "Service added.",
      updateSuccess: "Service updated.",
      removeSuccess: "Service removed.",
      savingChanges: "Saving service changes",
      addTitle: "New Service",
      editTitle: "Edit Service",
      titleLabel: "Title",
      priceLabel: "Price",
      descriptionLabel: "Description",
      titlePlaceholder: "Hair Coloring",
      pricePlaceholder: "$120",
      descriptionPlaceholder: "Balayage, highlights, color correction.",
      save: "Save",
      cancel: "Cancel",
      detailsPlaceholder: "Service details can be added if needed.",
      editService: (title) => `Edit ${title}`,
      deleteService: (title) => `Delete ${title}`,
      saveError: "Unable to save services.",
      saveErrorNow: "Unable to save services right now.",
      titleRequired: "Service title is required.",
      titleTooLong: (max) => `Service title must be ${max} characters or fewer.`,
      priceTooLong: (max) => `Price must be ${max} characters or fewer.`,
      descriptionTooLong: (max) =>
        `Service description must be ${max} characters or fewer.`,
    },
    certificates: {
      eyebrow: "My Certificates",
      title: "Verification and uploads",
      officialIbpa: "Official IBPA",
      officialCertificate: "IBPA Certificate",
      certificateId: "Certificate ID",
      issued: "Issued",
      validThrough: "Valid through",
      downloadCertificate: "Download certificate",
      filePending: "File pending",
      noIssuedTitle: "No issued IBPA certificate yet",
      noIssuedDescription:
        "Your official IBPA certificate will appear here once it has been issued.",
      uploadEyebrow: "Upload certificate",
      uploadTitle: "Add personal certificate",
      certificateTitle: "Certificate title",
      certificateTitlePlaceholder: "Advanced Brow Masterclass",
      chooseFile: "Choose document or image",
      fileTypes: "PDF, DOC, DOCX, JPG, PNG or WEBP",
      uploadCertificate: "Upload certificate",
      personalUploadsEyebrow: "Personal uploads",
      personalUploadsTitle: "External certificates",
      additionalEyebrow: "Issued by IBPA",
      additionalTitle: "Additional certificates",
      additionalBadge: "IBPA issued",
      additionalCount: (count) => `${count} issued`,
      issuedOn: (dateLabel) => `Issued ${dateLabel}`,
      pdfDocument: "PDF document",
      previewUnavailable: "Preview unavailable",
      uploadedCount: (count) => `${count} uploaded`,
      addedOn: (dateLabel) => `Added ${dateLabel}`,
      recently: "recently",
      openFile: "Open file",
      noUploadsTitle: "No personal certificates uploaded yet",
      noUploadsDescription:
        "Upload external training and credential files to keep them alongside your official IBPA certificate.",
      addTitleError: "Add a certificate title before uploading.",
      chooseFileError: "Choose a document or image to upload.",
      uploadMissingUrl: "Upload completed without a file URL.",
      saveUploadedError: "Failed to save the uploaded certificate.",
      uploadSuccess: "Certificate uploaded.",
      uploadError: "Failed to upload certificate.",
      removeError: "Failed to remove certificate.",
      removeSuccess: "Certificate removed.",
      removeAria: (title) => `Remove ${title}`,
    },
    billing: {
      title: "Billing & Membership",
      renew: "Renew",
      support: "Support",
      plan: "Plan",
      expires: "Expires",
      status: "Status",
      paymentHistory: "Payment History",
      partnerPaymentTitle: "Partner Membership Payment",
      membershipPaymentTitle: "Membership Payment",
      noPayments: "No payments yet.",
      supportTitle: "Billing Support",
      supportDescription:
        "Need help with payment, renewal, or membership access?",
      contactSupport: "Contact Support",
      account: "Account",
    },
    events: {
      eyebrow: "Events & Benefits",
      title: "Member opportunities",
      filters: {
        all: "All events",
        members: "Members only",
        open: "Open to all",
      },
      audienceMembers: "Members only",
      audienceOpen: "Open to all",
      highlighted: "Highlighted",
      date: "Date",
      price: "Price",
      registration: "Registration",
      location: "Location",
      locationTbd: "Location to be announced",
      register: "Register",
      unregister: "Unregister",
      openEvent: "Open event",
      noMatches: "No events match the current filter yet.",
      membersRate: "Members rate",
      memberPromo: "Member promo available",
      memberPerk: (membership) =>
        `${membership.replace(" Membership", "")} member perk`,
    },
    support: {
      eyebrow: "Support",
      title: "Help and requests",
      question: "Ask a question",
      questionDescription:
        "Get help with membership, billing, or dashboard access.",
      idea: "Suggest an idea",
      ideaDescription:
        "Share improvements that would make the member experience better.",
      problem: "Report a problem",
      problemDescription:
        "Flag a bug, broken workflow, or account issue for review.",
      requestTitle: "Support Request",
      memberEmail: "Member email",
      memberId: "Member ID",
      phoneOptional: "Phone (optional)",
      phonePlaceholder: "Best number for follow-up",
      messagePlaceholder:
        "Share enough detail so the team can help quickly.",
      submit: "Submit Request",
      emailDirectly: "Email Support Directly",
      faq: "FAQ",
      emailRequired:
        "A signed-in email address is required to send support requests.",
      messageTooShort:
        "Please provide at least 20 characters so the support team has enough context.",
      sendError: "Failed to send support request.",
      sendSuccess: "Your request was sent to IBPA support.",
      faqItems: [
        {
          question: "How do I update my public profile?",
          answer:
            "Open Edit Profile to refresh your photo, contact details, specialization, and biography.",
        },
        {
          question: "Where do certificate files appear?",
          answer:
            "Issued certificate files appear in My Certificates after administrative review and upload.",
        },
        {
          question: "How are reminders delivered?",
          answer:
            "IBPA can send reminders, updates, and invitations through the existing email workflow when those automations are enabled.",
        },
        {
          question: "Can I change my membership plan online?",
          answer:
            "Plan change and renewal actions are surfaced here, while final payment flow still follows the existing membership process.",
        },
      ],
    },
    directory: {
      title: "Member Directory",
    },
    teamMembers: {
      title: "Team Members",
      partnerRequired: "Partner account required",
      partnerRequiredDescription:
        "Team access is available only for partner memberships.",
      includedSeats: "Included seats",
      usedSeats: "Used seats",
      remainingSeats: "Remaining seats",
      additionalSeats: "Additional seats",
      pendingRequests: (count) =>
        `${count} pending request${count === 1 ? "" : "s"}`,
      noMembersTitle: "No team members yet",
      noMembersDescription:
        "Invite your first professional to activate a seat.",
      inviteFirst: "Invite Team Member",
      activeMembers: (count) =>
        `${count} active member${count === 1 ? "" : "s"}`,
      extendSeats: "Extend seats",
      removed: "Removed",
      active: "Active",
      invited: "Invited",
      teamMemberRoleFallback: "Team member",
      remove: "Remove",
      inviteTitle: "Invite Team Member",
      fullName: "Full Name",
      email: "Email",
      role: "Role / Position",
      portfolioLink: "Instagram or Portfolio Link",
      affiliationConfirmation:
        "I confirm that this person is professionally affiliated with my business.",
      inviting: "Inviting...",
      inviteMember: "Invite Member",
      rulesTitle: "Team Access Rules",
      rules: [
        "Individual email-based access",
        "No credential sharing",
        "Trackable access",
        "Professional affiliation required",
      ],
      loadError: "Failed to load Team Members.",
      connectionLoadError: "Connection error while loading Team Members.",
      fullNameRequired: "Full name is required.",
      emailRequired: "Email is required.",
      roleRequired: "Position / role is required.",
      affiliationRequired: "Affiliation confirmation is required.",
      inviteError: "Failed to invite team member.",
      inviteSuccess: "Team member invited.",
      inviteConnectionError: "Connection error while inviting team member.",
      removeError: "Failed to remove team member.",
      removeSuccess: "Team member removed.",
      removeConnectionError: "Connection error while removing team member.",
      extendError: "Failed to extend seat capacity.",
      extendSuccess: "Seat capacity updated.",
      extendConnectionError: "Connection error while extending seats.",
    },
    account: {
      title: "Account Settings",
      signInTitle: "Sign in to manage account settings",
      signInDescription:
        "Your profile, security, and account preferences appear here once you are signed in.",
      signIn: "Sign in",
    },
    notifications: {
      navLabel: "Notifications",
      title: "Notifications are under development",
      description:
        "We are preparing this dashboard section and will make it available once the experience is ready.",
      expectedLabel: "Dashboard update in progress",
      backLabel: "Back to dashboard",
      notifyLabel: "You will see updates here when this section is ready.",
      items: [
        "We are polishing the layout, mobile responsiveness, and dashboard data flow.",
        "This page will be connected only after the experience is stable and clear.",
        "You can continue using the available dashboard sections while this area is being prepared.",
      ],
    },
    community: {
      accessFallback:
        "Community access is available only for active IBPA members.",
      loadError: "Failed to load community members.",
      backToDashboard: "Back to Dashboard",
      signOut: "Sign Out",
    },
    success: {
      accessEyebrow: "Dashboard access",
      paymentReceivedTitle: "Payment received",
      nextStepTitle: "Next step",
      nextStepDescription:
        "Sign in with the same email address you used for your application and payment to continue into your dashboard.",
      needHelpTitle: "Need help?",
      needHelpDescription:
        "If access still does not open after sign-in, contact IBPA support and we will verify your payment manually.",
      backToLanding: "Back to landing",
      memberLogin: "Member Login",
      activationEyebrow: "Membership Activation",
      paymentSuccessPrefix: "Payment",
      paymentSuccessHighlight: "Successful!",
      memberFallback: "member",
      thankYou: (name) =>
        `Thank you, ${name}. Your payment has been confirmed. Create your dashboard access now to open your membership area, certificates, notifications, and future updates.`,
      firstTimeAccessTitle: "First-time access",
      firstTimeAccessDescription:
        "If this is your first visit after approval and payment, create your account with the same email used in the application.",
      existingAccountTitle: "Existing account",
      existingAccountDescription:
        "If you already created your account earlier, switch to sign in and continue directly to the dashboard.",
      approvedEmail: "Approved Email",
      accountReadyEyebrow: "Account Ready",
      dashboardAccessActive: "Dashboard Access Active",
      accountReadyDescription:
        "Your account is already signed in. You can continue directly to your personal dashboard.",
      openDashboard: "Open Dashboard",
      createAccount: "Create Account",
      signIn: "Sign In",
      errorBodies: {
        missingToken:
          "Your payment may already be completed. Please continue by signing in with the same email address you used for your application.",
        notFound:
          "Your payment may already be completed. This link looks outdated or incomplete, so please continue by signing in to your dashboard.",
        backendUnavailable:
          "Your payment may already be completed. The verification service is temporarily unavailable, so you can continue by signing in directly.",
        verifyFailed:
          "Your payment may already be completed. Please sign in to your dashboard with the same email used for your application.",
      },
    },
    editProfile: {
      pageEyebrow: "Application Editor",
      pageTitle: "Update Your Submitted Information",
      pageDescription:
        "You can update contact details, professional information, and category-specific application fields. Your legal name, email, membership type, and submitted identity data stay locked for review integrity.",
      lockedInformation: "Locked Information",
      profilePhoto: "Profile Photo",
      uploadNewPhoto: "Upload New Photo",
      uploading: "Uploading...",
      removePhoto: "Remove Photo",
      photoHelper:
        "This photo will be used in your dashboard profile and public member directory.",
      accessBlockedTitle: "Membership Activation Required",
      accessBlockedDescription:
        "Profile editing is available only for paid IBPA members. If your membership payment was completed, sign in with the same email used for your application and payment.",
      accessBlockedGeneric: "Profile editing is not available for this account.",
      teamMemberBlocked: "Team member profiles are managed by the partner owner.",
      profileBlocked: "Profile editing is not available for this account.",
      backToDashboard: "Back to Dashboard",
      contactSupport: "Contact Support",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      loadError: "Failed to load profile",
      saveError: "Failed to save changes",
      saveSuccess: "Application information updated",
      photoUpdated: "Profile photo updated",
      photoUploadError: "Failed to upload profile photo",
      photoUploadMissingUrl:
        "Upload completed, but no image URL was returned.",
      lockedFields: {
        fullName: "Full Name",
        email: "Email",
        membership: "Membership",
        applicantType: "Applicant Type",
      },
      fieldLabels: {
        phone: "Phone",
        country: "Country",
        city: "City",
        yearsExperience: "Experience",
        instagramLink: "Instagram",
        whyJoin: "Why IBPA",
        contributionDesc: "Industry Contribution",
        dateOfBirth: "Date of Birth",
        studentSchool: "School",
        studentProgName: "Program",
        studentEndDate: "Graduation Date",
        studentMotivation: "Specialist Motivation",
        professionalDesc: "Professional Summary",
        specialization: "Specialization",
        workingJurisdictions: "Jurisdictions / License",
        portfolioLink: "Portfolio",
        achievementsYesNo: "Professional Achievements",
        achievementsDesc: "Achievements Details",
        competitionsYesNo: "Competition Participation",
        competitionName: "Competition Name",
        competitionYear: "Competition Year",
        competitionResult: "Competition Result",
        speakerEducatorJudge: "Speaker / Educator / Judge",
        publicationsYesNo: "Publications / Media",
        publicationsLinks: "Publication Links",
        educatorRole: "Educator Role",
        educatorSubjects: "Subjects",
        educatorYears: "Teaching Experience",
        educatorFormat: "Teaching Format",
        studentCount: "Student Count",
        websiteLink: "Website",
        bizName: "Business Name",
        bizType: "Business Type",
        bizYear: "Established",
        bizTeamSize: "Team Size",
        bizServices: "Services",
        brandName: "Brand Name",
        brandType: "Brand Type",
        brandYear: "Launch Year",
        brandMarket: "Market",
      },
      fieldPlaceholders: {
        phone: "Your phone number",
        country: "Country",
        city: "City",
        yearsExperience: "e.g. 6 years",
        instagramLink: "https://instagram.com/...",
        whyJoin: "Why do you want to be part of IBPA?",
        contributionDesc:
          "How do you contribute to the beauty industry?",
        studentSchool: "Your school",
        studentProgName: "Program name",
        specialization: "Brows, lashes, esthetician...",
        workingJurisdictions: "States, countries, licenses",
        portfolioLink: "https://...",
        achievementsDesc: "Awards, competitions, talks, publications...",
        competitionName: "Event name",
        competitionYear: "2024",
        competitionResult: "Winner, finalist...",
        publicationsLinks: "Paste links here",
        educatorRole: "Lead educator",
        educatorYears: "e.g. 5 years",
        educatorFormat: "Online / Offline / Both",
        studentCount: "Approximate student count",
        websiteLink: "https://...",
        bizName: "Studio or salon name",
        bizType: "Salon, academy...",
        bizYear: "Year established",
        bizTeamSize: "Number of team members",
        brandName: "Brand or company name",
        brandType: "Product category",
        brandYear: "Year",
      },
      selectPlaceholder: "Select an option",
    },
  }),
  ru: buildDashboardDictionary({
    nav: { mobileTitle: "Навигация", currentMember: "Текущий участник" },
    header: {
      title: "Кабинет участника",
      signOut: "Выйти",
      signIn: "Войти",
      openMenu: "Открыть меню навигации",
    },
    overview: {
      profile: "Профиль",
      location: "Локация",
      specialty: "Специализация",
      certificate: "Сертификат",
      events: "События",
      teamMembers: "Команда",
      membershipOverview: "Обзор членства",
      status: "Статус",
      memberSince: "С нами с",
      membershipType: "Тип",
      expiryDate: "Срок действия",
      quickActions: "Быстрые действия",
      viewAll: "Смотреть все",
      upcomingEventFallback: "Ближайшее событие",
      noScheduledEvents: "Пока нет запланированных событий.",
      noTeamMembers: "Участники команды пока не добавлены.",
      moreEvents: (count) => `+${count} ещё событий`,
      moreMembers: (count) => `+${count} ещё участников`,
    },
    statuses: {
      pending: "На рассмотрении",
      approved: "Одобрено",
      paid: "Оплачено",
      issued: "Выдано",
      active: "Активно",
      verified: "Подтверждено",
      invited: "Приглашён",
      removed: "Удалён",
      review: "На рассмотрении",
    },
    statusDescriptions: {
      teamMemberActive: "Доступ участника партнёрской команды активен.",
      partnerVerified: "Партнёрский аккаунт активен и подтверждён.",
      membershipVerified: "Членство и сертификат подтверждены.",
      membershipActive: "Членство активно.",
      membershipPending: "Профиль ожидает проверки или активации.",
      accessBlocked: "Доступ заблокирован",
      accessBlockedDescription:
        "Этот кабинет доступен только после завершения и активации оплаты членства IBPA.",
    },
    membershipCategories: {
      student: "Студенческое членство",
      specialist: "Членство специалиста",
      professional: "Профессиональное членство",
      trainer: "Мастер-членство",
      business: "Бизнес-членство",
      brand: "Партнёрское членство",
      partner: "Партнёрское членство",
      review: "Проверка членства",
      partnerTeamAccess: "Доступ партнёрской команды",
    },
    quickActions: {
      editProfile: {
        label: "Редактировать профиль",
        description: "Обновите фото, био и профессиональные данные.",
      },
      certificateStatus: {
        label: "Статус сертификата",
        description: "Отслеживайте проверку и загрузки.",
      },
      viewMembership: {
        label: "Посмотреть членство",
        description: "Проверьте план, срок действия и платежи.",
      },
      memberDirectory: {
        label: "Каталог участников",
        description: "Находите коллег для нетворкинга и сотрудничества.",
      },
      eventsAndDiscounts: {
        label: "События и скидки",
        description: "Просматривайте события и актуальные преимущества.",
      },
      support: {
        label: "Поддержка",
        description: "Задайте вопрос, предложите идею или сообщите о проблеме.",
      },
    },
    summaryCards: {
      memberStatus: "Статус участника",
      memberSince: "С нами с",
      membershipType: "Тип членства",
      expiryDate: "Дата окончания",
      activationDateHelper: "Первая дата активации",
      linkedMembershipHelper: "Текущая связанная запись о членстве",
      latestCertificateHelper: "Последний сертификат или продление",
    },
    checklist: {
      uploadPhoto: "Загрузить фото",
      addCertificates: "Добавить сертификаты",
      completeProfile: "Заполнить профиль",
    },
    profile: {
      role: "Роль",
      partnerBusiness: "Партнёрский бизнес",
      access: "Доступ",
      teamMember: "Участник команды",
      partnerAccount: "Партнёрский аккаунт",
      invited: "Приглашён",
      editProfile: "Редактировать профиль",
      openPublicProfile: "Открыть публичный профиль",
      copyPublicProfileSuccess: "Ссылка на публичный профиль скопирована.",
      copyPublicProfileUnavailable: "Ссылка на публичный профиль пока недоступна.",
      copyPublicProfileError: "Не удалось скопировать ссылку на публичный профиль.",
      openInstagram: "Открыть Instagram",
      openWebsite: "Открыть сайт",
      locationAndSpecialization: "Локация и специализация",
      professionalBiography: "Профессиональная биография",
      yearsOfExperience: "Опыт работы",
      biography: "Биография",
      achievements: "Достижения",
      industryContribution: "Вклад в индустрию",
      education: "Образование",
      communityIdentity: "Профессиональная идентичность",
      memberId: "ID участника",
      membership: "Членство",
      industry: "Индустрия",
      workGallery: "Галерея работ",
      galleryImageAlt: (name, index) => `${name}: изображение галереи ${index}`,
      galleryFallbackOne: "Работы по бровям",
      galleryFallbackTwo: "Работы по ресницам",
      galleryFallbackThree: "Пример до и после",
      showLess: "Свернуть",
      seeAll: "Показать всё",
      ibpaCertificate: "Сертификат IBPA",
      officialCertificate: "Официальный сертификат",
      validThrough: "Действителен до",
      openCertificate: "Открыть сертификат",
      certificatePendingFile: "Файл сертификата ещё не загружен.",
      noCertificate: "Сертификат IBPA ещё не выдан.",
      notAddedYet: "Ещё не добавлено",
      noBiography: "Биография ещё не добавлена.",
      noAchievements: "Достижения ещё не добавлены.",
      noContribution: "Информация о вкладе ещё не добавлена.",
      noEducation: "Информация об образовании ещё не добавлена.",
    },
    services: {
      title: "Основные услуги",
      description:
        "Добавьте услуги, которые хотите показать в своём профиле.",
      empty: "Услуги ещё не добавлены.",
      count: (count) =>
        `${count} ${count === 1 ? "услуга" : count < 5 ? "услуги" : "услуг"}`,
      add: "Добавить услугу",
      addSuccess: "Услуга добавлена.",
      updateSuccess: "Услуга обновлена.",
      removeSuccess: "Услуга удалена.",
      savingChanges: "Сохранение изменений услуг",
      addTitle: "Новая услуга",
      editTitle: "Редактировать услугу",
      titleLabel: "Название",
      priceLabel: "Цена",
      descriptionLabel: "Описание",
      titlePlaceholder: "Окрашивание волос",
      pricePlaceholder: "$120",
      descriptionPlaceholder: "Балаяж, мелирование, коррекция цвета.",
      save: "Сохранить",
      cancel: "Отмена",
      detailsPlaceholder: "Описание услуги можно добавить при необходимости.",
      editService: (title) => `Редактировать: ${title}`,
      deleteService: (title) => `Удалить: ${title}`,
      saveError: "Не удалось сохранить услуги.",
      saveErrorNow: "Сейчас не удаётся сохранить услуги.",
      titleRequired: "Название услуги обязательно.",
      titleTooLong: (max) =>
        `Название услуги должно содержать не более ${max} символов.`,
      priceTooLong: (max) =>
        `Цена должна содержать не более ${max} символов.`,
      descriptionTooLong: (max) =>
        `Описание услуги должно содержать не более ${max} символов.`,
    },
    certificates: {
      eyebrow: "Мои сертификаты",
      title: "Проверка и загрузки",
      officialIbpa: "Официальный IBPA",
      officialCertificate: "Сертификат IBPA",
      certificateId: "ID сертификата",
      issued: "Выдан",
      validThrough: "Действителен до",
      downloadCertificate: "Скачать сертификат",
      filePending: "Файл ожидается",
      noIssuedTitle: "Официальный сертификат IBPA ещё не выдан",
      noIssuedDescription:
        "Ваш официальный сертификат IBPA появится здесь после выдачи.",
      uploadEyebrow: "Загрузка сертификата",
      uploadTitle: "Добавить личный сертификат",
      certificateTitle: "Название сертификата",
      certificateTitlePlaceholder: "Advanced Brow Masterclass",
      chooseFile: "Выберите документ или изображение",
      fileTypes: "PDF, DOC, DOCX, JPG, PNG или WEBP",
      uploadCertificate: "Загрузить сертификат",
      personalUploadsEyebrow: "Личные загрузки",
      personalUploadsTitle: "Внешние сертификаты",
      additionalEyebrow: "Выдано IBPA",
      additionalTitle: "Дополнительные сертификаты",
      additionalBadge: "Выдан IBPA",
      additionalCount: (count) => `${count} выдано`,
      issuedOn: (dateLabel) => `Выдан ${dateLabel}`,
      pdfDocument: "PDF-документ",
      previewUnavailable: "Предпросмотр недоступен",
      uploadedCount: (count) => `${count} загружено`,
      addedOn: (dateLabel) => `Добавлено ${dateLabel}`,
      recently: "недавно",
      openFile: "Открыть файл",
      noUploadsTitle: "Личные сертификаты ещё не загружены",
      noUploadsDescription:
        "Загрузите внешние сертификаты и подтверждения, чтобы хранить их рядом с официальным сертификатом IBPA.",
      addTitleError: "Добавьте название сертификата перед загрузкой.",
      chooseFileError: "Выберите документ или изображение для загрузки.",
      uploadMissingUrl: "Загрузка завершилась без URL файла.",
      saveUploadedError: "Не удалось сохранить загруженный сертификат.",
      uploadSuccess: "Сертификат загружен.",
      uploadError: "Не удалось загрузить сертификат.",
      removeError: "Не удалось удалить сертификат.",
      removeSuccess: "Сертификат удалён.",
      removeAria: (title) => `Удалить ${title}`,
    },
    billing: {
      title: "Оплата и членство",
      renew: "Продлить",
      support: "Поддержка",
      plan: "План",
      expires: "Действует до",
      status: "Статус",
      paymentHistory: "История платежей",
      partnerPaymentTitle: "Оплата партнёрского членства",
      membershipPaymentTitle: "Оплата членства",
      noPayments: "Платежей пока нет.",
      supportTitle: "Поддержка по оплате",
      supportDescription:
        "Нужна помощь с оплатой, продлением или доступом к членству?",
      contactSupport: "Связаться с поддержкой",
      account: "Аккаунт",
    },
    events: {
      eyebrow: "События и преимущества",
      title: "Возможности для участников",
      filters: {
        all: "Все события",
        members: "Только для участников",
        open: "Открыто для всех",
      },
      audienceMembers: "Только для участников",
      audienceOpen: "Открыто для всех",
      highlighted: "Рекомендуем",
      date: "Дата",
      price: "Цена",
      registration: "Регистрация",
      location: "Локация",
      locationTbd: "Локация будет объявлена",
      register: "Зарегистрироваться",
      unregister: "Отменить регистрацию",
      openEvent: "Открыть событие",
      noMatches: "По текущему фильтру событий пока нет.",
      membersRate: "Тариф для участников",
      memberPromo: "Доступен бонус для участников",
      memberPerk: (membership) =>
        `Преимущество для ${membership.replace(" членство", "").toLowerCase()}`,
    },
    support: {
      eyebrow: "Поддержка",
      title: "Помощь и запросы",
      question: "Задать вопрос",
      questionDescription:
        "Получите помощь по членству, оплате или доступу к кабинету.",
      idea: "Предложить идею",
      ideaDescription:
        "Поделитесь улучшениями, которые сделают опыт участников лучше.",
      problem: "Сообщить о проблеме",
      problemDescription:
        "Сообщите об ошибке, сломанном процессе или проблеме с аккаунтом.",
      requestTitle: "Запрос в поддержку",
      memberEmail: "Email участника",
      memberId: "ID участника",
      phoneOptional: "Телефон (необязательно)",
      phonePlaceholder: "Лучший номер для обратной связи",
      messagePlaceholder:
        "Опишите детали, чтобы команда могла помочь быстрее.",
      submit: "Отправить запрос",
      emailDirectly: "Написать в поддержку",
      faq: "FAQ",
      emailRequired:
        "Для отправки запроса нужен email авторизованного пользователя.",
      messageTooShort:
        "Пожалуйста, напишите не менее 20 символов, чтобы команде хватило контекста.",
      sendError: "Не удалось отправить запрос в поддержку.",
      sendSuccess: "Ваш запрос отправлен в поддержку IBPA.",
      faqItems: [
        {
          question: "Как обновить публичный профиль?",
          answer:
            "Откройте редактирование профиля, чтобы обновить фото, контакты, специализацию и биографию.",
        },
        {
          question: "Где появляются файлы сертификатов?",
          answer:
            "Выданные файлы сертификатов появляются в разделе «Мои сертификаты» после административной проверки и загрузки.",
        },
        {
          question: "Как доставляются напоминания?",
          answer:
            "IBPA может отправлять напоминания, обновления и приглашения через существующий email-процесс, когда эти автоматизации включены.",
        },
        {
          question: "Можно ли изменить план членства онлайн?",
          answer:
            "Изменение плана и продление отображаются здесь, а финальная оплата по-прежнему идёт по существующему процессу членства.",
        },
      ],
    },
    community: {
      accessFallback:
        "Доступ к сообществу открыт только для активных участников IBPA.",
      loadError: "Не удалось загрузить список участников сообщества.",
      backToDashboard: "Назад в кабинет",
      signOut: "Выйти",
    },
    success: {
      accessEyebrow: "Доступ к кабинету",
      paymentReceivedTitle: "Платеж получен",
      nextStepTitle: "Следующий шаг",
      nextStepDescription:
        "Войдите с тем же email, который вы использовали в заявке и при оплате, чтобы продолжить в кабинет.",
      needHelpTitle: "Нужна помощь?",
      needHelpDescription:
        "Если после входа доступ все еще не откроется, свяжитесь с поддержкой IBPA, и мы вручную проверим оплату.",
      backToLanding: "Вернуться на сайт",
      memberLogin: "Вход участника",
      activationEyebrow: "Активация членства",
      paymentSuccessPrefix: "Платеж",
      paymentSuccessHighlight: "успешен!",
      memberFallback: "участник",
      thankYou: (name) =>
        `Спасибо, ${name}. Ваш платеж подтвержден. Создайте доступ к кабинету, чтобы открыть зону членства, сертификаты, уведомления и будущие обновления.`,
      firstTimeAccessTitle: "Первый вход",
      firstTimeAccessDescription:
        "Если это ваш первый визит после одобрения и оплаты, создайте аккаунт с тем же email, который был указан в заявке.",
      existingAccountTitle: "Существующий аккаунт",
      existingAccountDescription:
        "Если вы уже создавали аккаунт раньше, переключитесь на вход и продолжайте прямо в кабинет.",
      approvedEmail: "Подтвержденный email",
      accountReadyEyebrow: "Аккаунт готов",
      dashboardAccessActive: "Доступ к кабинету активен",
      accountReadyDescription:
        "Ваш аккаунт уже авторизован. Вы можете сразу перейти в личный кабинет.",
      openDashboard: "Открыть кабинет",
      createAccount: "Создать аккаунт",
      signIn: "Войти",
      errorBodies: {
        missingToken:
          "Ваш платеж, возможно, уже завершен. Продолжите, войдя с тем же email, который вы использовали в заявке.",
        notFound:
          "Ваш платеж, возможно, уже завершен. Эта ссылка выглядит устаревшей или неполной, поэтому продолжите, войдя в кабинет.",
        backendUnavailable:
          "Ваш платеж, возможно, уже завершен. Сервис проверки временно недоступен, поэтому вы можете продолжить, войдя напрямую.",
        verifyFailed:
          "Ваш платеж, возможно, уже завершен. Войдите в кабинет с тем же email, который использовался в заявке.",
      },
    },
    directory: { title: "Каталог участников" },
    teamMembers: {
      title: "Участники команды",
      partnerRequired: "Требуется партнёрский аккаунт",
      partnerRequiredDescription:
        "Доступ к команде доступен только для партнёрских членств.",
      includedSeats: "Включённые места",
      usedSeats: "Использовано мест",
      remainingSeats: "Осталось мест",
      additionalSeats: "Дополнительные места",
      pendingRequests: (count) =>
        `${count} ${count === 1 ? "запрос" : count < 5 ? "запроса" : "запросов"} в ожидании`,
      noMembersTitle: "Участников команды пока нет",
      noMembersDescription:
        "Пригласите первого специалиста, чтобы активировать место.",
      inviteFirst: "Пригласить участника",
      activeMembers: (count) =>
        `${count} ${count === 1 ? "активный участник" : count < 5 ? "активных участника" : "активных участников"}`,
      extendSeats: "Увеличить места",
      removed: "Удалён",
      active: "Активен",
      invited: "Приглашён",
      teamMemberRoleFallback: "Участник команды",
      remove: "Удалить",
      inviteTitle: "Пригласить участника команды",
      fullName: "Полное имя",
      email: "Email",
      role: "Роль / должность",
      portfolioLink: "Instagram или ссылка на портфолио",
      affiliationConfirmation:
        "Подтверждаю, что этот человек профессионально связан с моим бизнесом.",
      inviting: "Приглашаем...",
      inviteMember: "Пригласить",
      rulesTitle: "Правила доступа команды",
      rules: [
        "Индивидуальный доступ по email",
        "Без передачи учётных данных",
        "Отслеживаемый доступ",
        "Требуется профессиональная связь с бизнесом",
      ],
      loadError: "Не удалось загрузить участников команды.",
      connectionLoadError:
        "Ошибка соединения при загрузке участников команды.",
      fullNameRequired: "Полное имя обязательно.",
      emailRequired: "Email обязателен.",
      roleRequired: "Должность / роль обязательна.",
      affiliationRequired: "Подтверждение связи обязательно.",
      inviteError: "Не удалось пригласить участника команды.",
      inviteSuccess: "Участник команды приглашён.",
      inviteConnectionError:
        "Ошибка соединения при приглашении участника команды.",
      removeError: "Не удалось удалить участника команды.",
      removeSuccess: "Участник команды удалён.",
      removeConnectionError:
        "Ошибка соединения при удалении участника команды.",
      extendError: "Не удалось увеличить количество мест.",
      extendSuccess: "Количество мест обновлено.",
      extendConnectionError:
        "Ошибка соединения при увеличении количества мест.",
    },
    account: {
      title: "Настройки аккаунта",
      signInTitle: "Войдите, чтобы управлять настройками аккаунта",
      signInDescription:
        "Ваш профиль, безопасность и настройки аккаунта появятся здесь после входа.",
      signIn: "Войти",
    },
    notifications: {
      navLabel: "Уведомления",
      title: "Уведомления в разработке",
      description:
        "Мы готовим этот раздел кабинета и откроем его, когда опыт будет готов.",
      expectedLabel: "Обновление кабинета в работе",
      backLabel: "Назад в кабинет",
      notifyLabel: "Обновления появятся здесь, когда раздел будет готов.",
      items: [
        "Мы дорабатываем макет, мобильную адаптацию и поток данных кабинета.",
        "Этот раздел будет подключён только после того, как опыт станет стабильным и понятным.",
        "Пока можно пользоваться уже доступными разделами кабинета.",
      ],
    },
    editProfile: {
      pageEyebrow: "Редактор заявки",
      pageTitle: "Обновите отправленную информацию",
      pageDescription:
        "Вы можете обновить контактные данные, профессиональную информацию и поля заявки по категории. Юридическое имя, email, тип членства и данные идентификации остаются заблокированными для целостности проверки.",
      lockedInformation: "Заблокированная информация",
      profilePhoto: "Фото профиля",
      uploadNewPhoto: "Загрузить новое фото",
      uploading: "Загрузка...",
      removePhoto: "Удалить фото",
      photoHelper:
        "Это фото будет использоваться в профиле кабинета и публичном каталоге участников.",
      accessBlockedTitle: "Требуется активация членства",
      accessBlockedDescription:
        "Редактирование профиля доступно только для оплаченных участников IBPA. Если оплата уже завершена, войдите с тем же email, который использовался в заявке и оплате.",
      accessBlockedGeneric:
        "Редактирование профиля недоступно для этого аккаунта.",
      teamMemberBlocked:
        "Профили участников команды управляются владельцем партнёрского аккаунта.",
      profileBlocked:
        "Редактирование профиля недоступно для этого аккаунта.",
      backToDashboard: "Назад в кабинет",
      contactSupport: "Связаться с поддержкой",
      cancel: "Отмена",
      saveChanges: "Сохранить изменения",
      loadError: "Не удалось загрузить профиль",
      saveError: "Не удалось сохранить изменения",
      saveSuccess: "Информация в заявке обновлена",
      photoUpdated: "Фото профиля обновлено",
      photoUploadError: "Не удалось загрузить фото профиля",
      photoUploadMissingUrl:
        "Загрузка завершилась, но URL изображения не был получен.",
      lockedFields: {
        fullName: "Полное имя",
        email: "Email",
        membership: "Членство",
        applicantType: "Тип заявителя",
      },
      fieldLabels: {
        phone: "Телефон",
        country: "Страна",
        city: "Город",
        yearsExperience: "Опыт",
        instagramLink: "Instagram",
        whyJoin: "Почему IBPA",
        contributionDesc: "Вклад в индустрию",
        dateOfBirth: "Дата рождения",
        studentSchool: "Школа",
        studentProgName: "Программа",
        studentEndDate: "Дата выпуска",
        studentMotivation: "Мотивация специалиста",
        professionalDesc: "Профессиональное резюме",
        specialization: "Специализация",
        workingJurisdictions: "Юрисдикции / лицензия",
        portfolioLink: "Портфолио",
        achievementsYesNo: "Профессиональные достижения",
        achievementsDesc: "Детали достижений",
        competitionsYesNo: "Участие в конкурсах",
        competitionName: "Название конкурса",
        competitionYear: "Год конкурса",
        competitionResult: "Результат конкурса",
        speakerEducatorJudge: "Спикер / преподаватель / судья",
        publicationsYesNo: "Публикации / медиа",
        publicationsLinks: "Ссылки на публикации",
        educatorRole: "Роль преподавателя",
        educatorSubjects: "Дисциплины",
        educatorYears: "Опыт преподавания",
        educatorFormat: "Формат обучения",
        studentCount: "Количество студентов",
        websiteLink: "Сайт",
        bizName: "Название бизнеса",
        bizType: "Тип бизнеса",
        bizYear: "Основан",
        bizTeamSize: "Размер команды",
        bizServices: "Услуги",
        brandName: "Название бренда",
        brandType: "Тип бренда",
        brandYear: "Год запуска",
        brandMarket: "Рынок",
      },
      fieldPlaceholders: {
        phone: "Ваш номер телефона",
        country: "Страна",
        city: "Город",
        yearsExperience: "например, 6 лет",
        instagramLink: "https://instagram.com/...",
        whyJoin: "Почему вы хотите стать частью IBPA?",
        contributionDesc: "Как вы вносите вклад в beauty-индустрию?",
        studentSchool: "Ваша школа",
        studentProgName: "Название программы",
        specialization: "Брови, ресницы, эстетика...",
        workingJurisdictions: "Штаты, страны, лицензии",
        portfolioLink: "https://...",
        achievementsDesc: "Награды, конкурсы, выступления, публикации...",
        competitionName: "Название события",
        competitionYear: "2024",
        competitionResult: "Победитель, финалист...",
        publicationsLinks: "Вставьте ссылки сюда",
        educatorRole: "Ведущий преподаватель",
        educatorYears: "например, 5 лет",
        educatorFormat: "Онлайн / офлайн / оба",
        studentCount: "Примерное количество студентов",
        websiteLink: "https://...",
        bizName: "Название студии или салона",
        bizType: "Салон, академия...",
        bizYear: "Год основания",
        bizTeamSize: "Количество сотрудников",
        brandName: "Название бренда или компании",
        brandType: "Категория продукта",
        brandYear: "Год",
      },
      selectPlaceholder: "Выберите вариант",
    },
  }),
  uk: buildDashboardDictionary({
    nav: { mobileTitle: "Навігація", currentMember: "Поточний учасник" },
    header: {
      title: "Кабінет учасника",
      signOut: "Вийти",
      signIn: "Увійти",
      openMenu: "Відкрити меню навігації",
    },
    overview: {
      profile: "Профіль",
      location: "Локація",
      specialty: "Спеціалізація",
      certificate: "Сертифікат",
      events: "Події",
      teamMembers: "Команда",
      membershipOverview: "Огляд членства",
      status: "Статус",
      memberSince: "З нами з",
      membershipType: "Тип",
      expiryDate: "Термін дії",
      quickActions: "Швидкі дії",
      viewAll: "Переглянути все",
      upcomingEventFallback: "Найближча подія",
      noScheduledEvents: "Поки немає запланованих подій.",
      noTeamMembers: "Учасників команди ще не додано.",
      moreEvents: (count) => `+${count} ще подій`,
      moreMembers: (count) => `+${count} ще учасників`,
    },
    statuses: {
      pending: "На розгляді",
      approved: "Схвалено",
      paid: "Оплачено",
      issued: "Видано",
      active: "Активно",
      verified: "Підтверджено",
      invited: "Запрошено",
      removed: "Видалено",
      review: "На розгляді",
    },
    statusDescriptions: {
      teamMemberActive: "Доступ учасника партнерської команди активний.",
      partnerVerified: "Партнерський акаунт активний і підтверджений.",
      membershipVerified: "Членство та сертифікат підтверджені.",
      membershipActive: "Членство активне.",
      membershipPending: "Профіль очікує перевірки або активації.",
      accessBlocked: "Доступ заблоковано",
      accessBlockedDescription:
        "Цей кабінет доступний лише після завершення та активації оплати членства IBPA.",
    },
    membershipCategories: {
      student: "Студентське членство",
      specialist: "Членство спеціаліста",
      professional: "Професійне членство",
      trainer: "Майстер-членство",
      business: "Бізнес-членство",
      brand: "Партнерське членство",
      partner: "Партнерське членство",
      review: "Перевірка членства",
      partnerTeamAccess: "Доступ партнерської команди",
    },
    quickActions: {
      editProfile: {
        label: "Редагувати профіль",
        description: "Оновіть фото, біо та професійні дані.",
      },
      certificateStatus: {
        label: "Статус сертифіката",
        description: "Відстежуйте перевірку та завантаження.",
      },
      viewMembership: {
        label: "Переглянути членство",
        description: "Перевірте план, термін дії та платежі.",
      },
      memberDirectory: {
        label: "Каталог учасників",
        description: "Знаходьте колег для нетворкінгу та співпраці.",
      },
      eventsAndDiscounts: {
        label: "Події та знижки",
        description: "Переглядайте події та актуальні переваги.",
      },
      support: {
        label: "Підтримка",
        description: "Поставте питання, запропонуйте ідею або повідомте про проблему.",
      },
    },
    summaryCards: {
      memberStatus: "Статус учасника",
      memberSince: "З нами з",
      membershipType: "Тип членства",
      expiryDate: "Дата завершення",
      activationDateHelper: "Перша дата активації",
      linkedMembershipHelper: "Поточний пов'язаний запис про членство",
      latestCertificateHelper: "Останній сертифікат або продовження",
    },
    checklist: {
      uploadPhoto: "Завантажити фото",
      addCertificates: "Додати сертифікати",
      completeProfile: "Заповнити профіль",
    },
    profile: {
      role: "Роль",
      partnerBusiness: "Партнерський бізнес",
      access: "Доступ",
      teamMember: "Учасник команди",
      partnerAccount: "Партнерський акаунт",
      invited: "Запрошено",
      editProfile: "Редагувати профіль",
      openPublicProfile: "Відкрити публічний профіль",
      copyPublicProfileSuccess: "Посилання на публічний профіль скопійовано.",
      copyPublicProfileUnavailable: "Посилання на публічний профіль поки недоступне.",
      copyPublicProfileError: "Не вдалося скопіювати посилання на публічний профіль.",
      openInstagram: "Відкрити Instagram",
      openWebsite: "Відкрити сайт",
      locationAndSpecialization: "Локація та спеціалізація",
      professionalBiography: "Професійна біографія",
      yearsOfExperience: "Досвід роботи",
      biography: "Біографія",
      achievements: "Досягнення",
      industryContribution: "Внесок в індустрію",
      education: "Освіта",
      communityIdentity: "Професійна ідентичність",
      memberId: "ID учасника",
      membership: "Членство",
      industry: "Індустрія",
      workGallery: "Галерея робіт",
      galleryImageAlt: (name, index) => `${name}: зображення галереї ${index}`,
      galleryFallbackOne: "Роботи з брів",
      galleryFallbackTwo: "Роботи з вій",
      galleryFallbackThree: "Приклад до та після",
      showLess: "Згорнути",
      seeAll: "Показати все",
      ibpaCertificate: "Сертифікат IBPA",
      officialCertificate: "Офіційний сертифікат",
      validThrough: "Дійсний до",
      openCertificate: "Відкрити сертифікат",
      certificatePendingFile: "Файл сертифіката ще не завантажено.",
      noCertificate: "Сертифікат IBPA ще не видано.",
      notAddedYet: "Ще не додано",
      noBiography: "Біографію ще не додано.",
      noAchievements: "Досягнення ще не додано.",
      noContribution: "Інформацію про внесок ще не додано.",
      noEducation: "Інформацію про освіту ще не додано.",
    },
    services: {
      title: "Основні послуги",
      description: "Додайте послуги, які хочете показати у своєму профілі.",
      empty: "Послуги ще не додано.",
      count: (count) => `${count} ${count === 1 ? "послуга" : "послуг"}`,
      add: "Додати послугу",
      addSuccess: "Послугу додано.",
      updateSuccess: "Послугу оновлено.",
      removeSuccess: "Послугу видалено.",
      savingChanges: "Збереження змін послуг",
      addTitle: "Нова послуга",
      editTitle: "Редагувати послугу",
      titleLabel: "Назва",
      priceLabel: "Ціна",
      descriptionLabel: "Опис",
      titlePlaceholder: "Фарбування волосся",
      pricePlaceholder: "$120",
      descriptionPlaceholder: "Балаяж, мелірування, корекція кольору.",
      save: "Зберегти",
      cancel: "Скасувати",
      detailsPlaceholder: "Опис послуги можна додати за потреби.",
      editService: (title) => `Редагувати: ${title}`,
      deleteService: (title) => `Видалити: ${title}`,
      saveError: "Не вдалося зберегти послуги.",
      saveErrorNow: "Зараз не вдається зберегти послуги.",
      titleRequired: "Назва послуги обов'язкова.",
      titleTooLong: (max) =>
        `Назва послуги має містити не більше ${max} символів.`,
      priceTooLong: (max) =>
        `Ціна має містити не більше ${max} символів.`,
      descriptionTooLong: (max) =>
        `Опис послуги має містити не більше ${max} символів.`,
    },
    certificates: {
      eyebrow: "Мої сертифікати",
      title: "Перевірка та завантаження",
      officialIbpa: "Офіційний IBPA",
      officialCertificate: "Сертифікат IBPA",
      certificateId: "ID сертифіката",
      issued: "Видано",
      validThrough: "Дійсний до",
      downloadCertificate: "Завантажити сертифікат",
      filePending: "Файл очікується",
      noIssuedTitle: "Офіційний сертифікат IBPA ще не видано",
      noIssuedDescription:
        "Ваш офіційний сертифікат IBPA з'явиться тут після видачі.",
      uploadEyebrow: "Завантаження сертифіката",
      uploadTitle: "Додати особистий сертифікат",
      certificateTitle: "Назва сертифіката",
      certificateTitlePlaceholder: "Advanced Brow Masterclass",
      chooseFile: "Оберіть документ або зображення",
      fileTypes: "PDF, DOC, DOCX, JPG, PNG або WEBP",
      uploadCertificate: "Завантажити сертифікат",
      personalUploadsEyebrow: "Особисті завантаження",
      personalUploadsTitle: "Зовнішні сертифікати",
      additionalEyebrow: "Видано IBPA",
      additionalTitle: "Додаткові сертифікати",
      additionalBadge: "Видано IBPA",
      additionalCount: (count) => `${count} видано`,
      issuedOn: (dateLabel) => `Видано ${dateLabel}`,
      pdfDocument: "PDF-документ",
      previewUnavailable: "Попередній перегляд недоступний",
      uploadedCount: (count) => `${count} завантажено`,
      addedOn: (dateLabel) => `Додано ${dateLabel}`,
      recently: "нещодавно",
      openFile: "Відкрити файл",
      noUploadsTitle: "Особисті сертифікати ще не завантажено",
      noUploadsDescription:
        "Завантажте зовнішні сертифікати та підтвердження, щоб зберігати їх поруч з офіційним сертифікатом IBPA.",
      addTitleError: "Додайте назву сертифіката перед завантаженням.",
      chooseFileError: "Оберіть документ або зображення для завантаження.",
      uploadMissingUrl: "Завантаження завершилось без URL файлу.",
      saveUploadedError: "Не вдалося зберегти завантажений сертифікат.",
      uploadSuccess: "Сертифікат завантажено.",
      uploadError: "Не вдалося завантажити сертифікат.",
      removeError: "Не вдалося видалити сертифікат.",
      removeSuccess: "Сертифікат видалено.",
      removeAria: (title) => `Видалити ${title}`,
    },
    billing: {
      title: "Оплата та членство",
      renew: "Продовжити",
      support: "Підтримка",
      plan: "План",
      expires: "Діє до",
      status: "Статус",
      paymentHistory: "Історія платежів",
      partnerPaymentTitle: "Оплата партнерського членства",
      membershipPaymentTitle: "Оплата членства",
      noPayments: "Платежів поки немає.",
      supportTitle: "Підтримка з оплатою",
      supportDescription:
        "Потрібна допомога з оплатою, продовженням або доступом до членства?",
      contactSupport: "Зв'язатися з підтримкою",
      account: "Акаунт",
    },
    events: {
      eyebrow: "Події та переваги",
      title: "Можливості для учасників",
      filters: {
        all: "Усі події",
        members: "Лише для учасників",
        open: "Відкрито для всіх",
      },
      audienceMembers: "Лише для учасників",
      audienceOpen: "Відкрито для всіх",
      highlighted: "Рекомендовано",
      date: "Дата",
      price: "Ціна",
      registration: "Реєстрація",
      location: "Локація",
      locationTbd: "Локацію буде оголошено",
      register: "Зареєструватися",
      unregister: "Скасувати реєстрацію",
      openEvent: "Відкрити подію",
      noMatches: "За поточним фільтром подій поки немає.",
      membersRate: "Тариф для учасників",
      memberPromo: "Доступна перевага для учасників",
      memberPerk: (membership) =>
        `Перевага для ${membership.replace(" членство", "").toLowerCase()}`,
    },
    support: {
      eyebrow: "Підтримка",
      title: "Допомога та запити",
      question: "Поставити питання",
      questionDescription:
        "Отримайте допомогу щодо членства, оплати або доступу до кабінету.",
      idea: "Запропонувати ідею",
      ideaDescription:
        "Поділіться покращеннями, які зроблять досвід учасників кращим.",
      problem: "Повідомити про проблему",
      problemDescription:
        "Повідомте про помилку, зламаний процес або проблему з акаунтом.",
      requestTitle: "Запит у підтримку",
      memberEmail: "Email учасника",
      memberId: "ID учасника",
      phoneOptional: "Телефон (необов'язково)",
      phonePlaceholder: "Найкращий номер для зворотного зв'язку",
      messagePlaceholder:
        "Опишіть деталі, щоб команда могла допомогти швидше.",
      submit: "Надіслати запит",
      emailDirectly: "Написати в підтримку",
      faq: "FAQ",
      emailRequired:
        "Для надсилання запиту потрібен email авторизованого користувача.",
      messageTooShort:
        "Будь ласка, напишіть щонайменше 20 символів, щоб команді вистачило контексту.",
      sendError: "Не вдалося надіслати запит у підтримку.",
      sendSuccess: "Ваш запит надіслано в підтримку IBPA.",
      faqItems: [
        {
          question: "Як оновити публічний профіль?",
          answer:
            "Відкрийте редагування профілю, щоб оновити фото, контакти, спеціалізацію та біографію.",
        },
        {
          question: "Де з'являються файли сертифікатів?",
          answer:
            "Видані файли сертифікатів з'являються в розділі «Мої сертифікати» після адміністративної перевірки та завантаження.",
        },
        {
          question: "Як надходять нагадування?",
          answer:
            "IBPA може надсилати нагадування, оновлення та запрошення через наявний email-процес, коли ці автоматизації увімкнені.",
        },
        {
          question: "Чи можна змінити план членства онлайн?",
          answer:
            "Зміна плану й продовження відображаються тут, а фінальна оплата все ще проходить через наявний процес членства.",
        },
      ],
    },
    community: {
      accessFallback:
        "Доступ до спільноти відкритий лише для активних учасників IBPA.",
      loadError: "Не вдалося завантажити список учасників спільноти.",
      backToDashboard: "Назад до кабінету",
      signOut: "Вийти",
    },
    success: {
      accessEyebrow: "Доступ до кабінету",
      paymentReceivedTitle: "Платіж отримано",
      nextStepTitle: "Наступний крок",
      nextStepDescription:
        "Увійдіть з тим самим email, який ви використовували в заявці та під час оплати, щоб продовжити в кабінет.",
      needHelpTitle: "Потрібна допомога?",
      needHelpDescription:
        "Якщо після входу доступ усе ще не відкривається, зв’яжіться з підтримкою IBPA, і ми вручну перевіримо оплату.",
      backToLanding: "Повернутися на сайт",
      memberLogin: "Вхід учасника",
      activationEyebrow: "Активація членства",
      paymentSuccessPrefix: "Платіж",
      paymentSuccessHighlight: "успішний!",
      memberFallback: "учасник",
      thankYou: (name) =>
        `Дякуємо, ${name}. Ваш платіж підтверджено. Створіть доступ до кабінету, щоб відкрити зону членства, сертифікати, сповіщення та майбутні оновлення.`,
      firstTimeAccessTitle: "Перший вхід",
      firstTimeAccessDescription:
        "Якщо це ваш перший візит після схвалення та оплати, створіть акаунт з тим самим email, який був указаний у заявці.",
      existingAccountTitle: "Існуючий акаунт",
      existingAccountDescription:
        "Якщо ви вже створювали акаунт раніше, перемкніться на вхід і продовжуйте прямо в кабінет.",
      approvedEmail: "Підтверджений email",
      accountReadyEyebrow: "Акаунт готовий",
      dashboardAccessActive: "Доступ до кабінету активний",
      accountReadyDescription:
        "Ваш акаунт уже авторизований. Ви можете одразу перейти до особистого кабінету.",
      openDashboard: "Відкрити кабінет",
      createAccount: "Створити акаунт",
      signIn: "Увійти",
      errorBodies: {
        missingToken:
          "Ваш платіж, імовірно, вже завершено. Продовжіть, увійшовши з тим самим email, який ви використовували в заявці.",
        notFound:
          "Ваш платіж, імовірно, вже завершено. Це посилання виглядає застарілим або неповним, тому продовжіть, увійшовши до кабінету.",
        backendUnavailable:
          "Ваш платіж, імовірно, вже завершено. Сервіс перевірки тимчасово недоступний, тому ви можете продовжити, увійшовши напряму.",
        verifyFailed:
          "Ваш платіж, імовірно, вже завершено. Увійдіть до кабінету з тим самим email, який використовувався в заявці.",
      },
    },
    directory: { title: "Каталог учасників" },
    teamMembers: {
      title: "Учасники команди",
      partnerRequired: "Потрібен партнерський акаунт",
      partnerRequiredDescription:
        "Доступ до команди доступний лише для партнерських членств.",
      includedSeats: "Включені місця",
      usedSeats: "Використано місць",
      remainingSeats: "Залишилось місць",
      additionalSeats: "Додаткові місця",
      pendingRequests: (count) => `${count} запитів у черзі`,
      noMembersTitle: "Учасників команди поки немає",
      noMembersDescription:
        "Запросіть першого спеціаліста, щоб активувати місце.",
      inviteFirst: "Запросити учасника",
      activeMembers: (count) => `${count} активних учасників`,
      extendSeats: "Збільшити місця",
      removed: "Видалено",
      active: "Активний",
      invited: "Запрошено",
      teamMemberRoleFallback: "Учасник команди",
      remove: "Видалити",
      inviteTitle: "Запросити учасника команди",
      fullName: "Повне ім'я",
      email: "Email",
      role: "Роль / посада",
      portfolioLink: "Instagram або посилання на портфоліо",
      affiliationConfirmation:
        "Підтверджую, що ця людина професійно пов'язана з моїм бізнесом.",
      inviting: "Запрошуємо...",
      inviteMember: "Запросити",
      rulesTitle: "Правила доступу команди",
      rules: [
        "Індивідуальний доступ за email",
        "Без передачі облікових даних",
        "Відстежуваний доступ",
        "Потрібен професійний зв'язок з бізнесом",
      ],
      loadError: "Не вдалося завантажити учасників команди.",
      connectionLoadError:
        "Помилка з'єднання під час завантаження учасників команди.",
      fullNameRequired: "Повне ім'я обов'язкове.",
      emailRequired: "Email обов'язковий.",
      roleRequired: "Посада / роль обов'язкова.",
      affiliationRequired: "Підтвердження зв'язку обов'язкове.",
      inviteError: "Не вдалося запросити учасника команди.",
      inviteSuccess: "Учасника команди запрошено.",
      inviteConnectionError:
        "Помилка з'єднання під час запрошення учасника команди.",
      removeError: "Не вдалося видалити учасника команди.",
      removeSuccess: "Учасника команди видалено.",
      removeConnectionError:
        "Помилка з'єднання під час видалення учасника команди.",
      extendError: "Не вдалося збільшити кількість місць.",
      extendSuccess: "Кількість місць оновлено.",
      extendConnectionError:
        "Помилка з'єднання під час збільшення кількості місць.",
    },
    account: {
      title: "Налаштування акаунта",
      signInTitle: "Увійдіть, щоб керувати налаштуваннями акаунта",
      signInDescription:
        "Ваш профіль, безпека та налаштування акаунта з'являться тут після входу.",
      signIn: "Увійти",
    },
    notifications: {
      navLabel: "Сповіщення",
      title: "Сповіщення в розробці",
      description:
        "Ми готуємо цей розділ кабінету і відкриємо його, коли досвід буде готовий.",
      expectedLabel: "Оновлення кабінету в роботі",
      backLabel: "Назад до кабінету",
      notifyLabel: "Оновлення з'являться тут, коли розділ буде готовий.",
      items: [
        "Ми допрацьовуємо макет, мобільну адаптацію та потік даних кабінету.",
        "Цей розділ буде підключений лише після того, як досвід стане стабільним і зрозумілим.",
        "Поки що можна користуватися вже доступними розділами кабінету.",
      ],
    },
    editProfile: {
      pageEyebrow: "Редактор заявки",
      pageTitle: "Оновіть подану інформацію",
      pageDescription:
        "Ви можете оновити контактні дані, професійну інформацію та поля заявки за категорією. Юридичне ім'я, email, тип членства та дані ідентифікації залишаються заблокованими для цілісності перевірки.",
      lockedInformation: "Заблокована інформація",
      profilePhoto: "Фото профілю",
      uploadNewPhoto: "Завантажити нове фото",
      uploading: "Завантаження...",
      removePhoto: "Видалити фото",
      photoHelper:
        "Це фото буде використовуватися у профілі кабінету та публічному каталозі учасників.",
      accessBlockedTitle: "Потрібна активація членства",
      accessBlockedDescription:
        "Редагування профілю доступне лише для оплачених учасників IBPA. Якщо оплату вже завершено, увійдіть з тим самим email, який використовувався в заявці та оплаті.",
      accessBlockedGeneric:
        "Редагування профілю недоступне для цього акаунта.",
      teamMemberBlocked:
        "Профілями учасників команди керує власник партнерського акаунта.",
      profileBlocked:
        "Редагування профілю недоступне для цього акаунта.",
      backToDashboard: "Назад до кабінету",
      contactSupport: "Зв'язатися з підтримкою",
      cancel: "Скасувати",
      saveChanges: "Зберегти зміни",
      loadError: "Не вдалося завантажити профіль",
      saveError: "Не вдалося зберегти зміни",
      saveSuccess: "Інформацію в заявці оновлено",
      photoUpdated: "Фото профілю оновлено",
      photoUploadError: "Не вдалося завантажити фото профілю",
      photoUploadMissingUrl:
        "Завантаження завершилося, але URL зображення не було отримано.",
      lockedFields: {
        fullName: "Повне ім'я",
        email: "Email",
        membership: "Членство",
        applicantType: "Тип заявника",
      },
      fieldLabels: {
        phone: "Телефон",
        country: "Країна",
        city: "Місто",
        yearsExperience: "Досвід",
        instagramLink: "Instagram",
        whyJoin: "Чому IBPA",
        contributionDesc: "Внесок в індустрію",
        dateOfBirth: "Дата народження",
        studentSchool: "Школа",
        studentProgName: "Програма",
        studentEndDate: "Дата завершення",
        studentMotivation: "Мотивація спеціаліста",
        professionalDesc: "Професійний опис",
        specialization: "Спеціалізація",
        workingJurisdictions: "Юрисдикції / ліцензія",
        portfolioLink: "Портфоліо",
        achievementsYesNo: "Професійні досягнення",
        achievementsDesc: "Деталі досягнень",
        competitionsYesNo: "Участь у конкурсах",
        competitionName: "Назва конкурсу",
        competitionYear: "Рік конкурсу",
        competitionResult: "Результат конкурсу",
        speakerEducatorJudge: "Спікер / викладач / суддя",
        publicationsYesNo: "Публікації / медіа",
        publicationsLinks: "Посилання на публікації",
        educatorRole: "Роль викладача",
        educatorSubjects: "Дисципліни",
        educatorYears: "Досвід викладання",
        educatorFormat: "Формат навчання",
        studentCount: "Кількість студентів",
        websiteLink: "Сайт",
        bizName: "Назва бізнесу",
        bizType: "Тип бізнесу",
        bizYear: "Засновано",
        bizTeamSize: "Розмір команди",
        bizServices: "Послуги",
        brandName: "Назва бренду",
        brandType: "Тип бренду",
        brandYear: "Рік запуску",
        brandMarket: "Ринок",
      },
      fieldPlaceholders: {
        phone: "Ваш номер телефону",
        country: "Країна",
        city: "Місто",
        yearsExperience: "наприклад, 6 років",
        instagramLink: "https://instagram.com/...",
        whyJoin: "Чому ви хочете бути частиною IBPA?",
        contributionDesc: "Як ви робите внесок у beauty-індустрію?",
        studentSchool: "Ваша школа",
        studentProgName: "Назва програми",
        specialization: "Брови, вії, естетика...",
        workingJurisdictions: "Штати, країни, ліцензії",
        portfolioLink: "https://...",
        achievementsDesc: "Нагороди, конкурси, виступи, публікації...",
        competitionName: "Назва події",
        competitionYear: "2024",
        competitionResult: "Переможець, фіналіст...",
        publicationsLinks: "Вставте посилання сюди",
        educatorRole: "Провідний викладач",
        educatorYears: "наприклад, 5 років",
        educatorFormat: "Онлайн / офлайн / обидва",
        studentCount: "Орієнтовна кількість студентів",
        websiteLink: "https://...",
        bizName: "Назва студії або салону",
        bizType: "Салон, академія...",
        bizYear: "Рік заснування",
        bizTeamSize: "Кількість співробітників",
        brandName: "Назва бренду або компанії",
        brandType: "Категорія продукту",
        brandYear: "Рік",
      },
      selectPlaceholder: "Оберіть варіант",
    },
  }),
} as const satisfies Record<"en" | "ru" | "uk", DashboardDictionary>;

export function localizeEditableField(
  field: EditableField,
  dictionary: DashboardDictionary,
  locale: "en" | "ru" | "uk",
): EditableField {
  const label = dictionary.editProfile.fieldLabels[field.key] ?? field.label;
  const placeholder =
    dictionary.editProfile.fieldPlaceholders[field.key] ?? field.placeholder;

  return {
    ...field,
    label,
    placeholder,
    options: field.options?.map((option) => ({
      ...option,
      label:
        option.value === "Yes"
          ? locale === "ru"
            ? "Да"
            : locale === "uk"
              ? "Так"
              : "Yes"
          : option.value === "No"
            ? locale === "ru"
              ? "Нет"
              : locale === "uk"
                ? "Ні"
                : "No"
            : option.label,
    })),
  };
}
