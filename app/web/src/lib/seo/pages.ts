export type PageSeo = {
  /** Canonical, site-relative path. */
  path: string;
  /** Title without the " | IBPA" suffix (added by the `(public)` title template). */
  title: string;
  description: string;
  /** Label used for this page in BreadcrumbList structured data. */
  breadcrumb: string;
};

/**
 * Search metadata for every public page, in one place so titles stay unique
 * and so tests can enforce length and uniqueness rules.
 *
 * Keyword targeting (see SEO_REPORT.md):
 * - Homepage: the organization and "international beauty association".
 * - /beauty-association: the category terms ("beauty association",
 *   "professional beauty association").
 * - /membership: "beauty association membership" (transactional).
 * Do not repeat those phrases on the other pages.
 */
export const PAGE_SEO = {
  home: {
    path: "/",
    // Rendered with `absoluteTitle`: the full brand name must stay in the title.
    title: "International Beauty Association for Professionals | IBPA",
    description:
      "IBPA is an international beauty association for estheticians, cosmetologists, lash and brow artists, educators, salon owners, and brands. Explore membership.",
    breadcrumb: "Home",
  },
  about: {
    path: "/about",
    title: "About IBPA: Mission, Vision & Nonprofit Status",
    description:
      "Learn how the International Beauty Professionals Association works: its mission, vision, strategic pillars, and California-registered nonprofit status.",
    breadcrumb: "About",
  },
  membership: {
    path: "/membership",
    title: "Beauty Association Membership: Categories & Benefits",
    description:
      "Compare IBPA membership for specialists, practicing professionals, educators, salon owners, and brands. See what each category includes and how to apply.",
    breadcrumb: "Membership",
  },
  criteria: {
    path: "/criteria",
    title: "Membership Criteria & Review Process",
    description:
      "See how the IBPA Membership Review Board evaluates applications, including experience, training, achievements, and professional reputation.",
    breadcrumb: "Criteria",
  },
  standards: {
    path: "/standards",
    title: "Professional Standards, Ethics & Policies",
    description:
      "Read IBPA's professional standards, code of ethics, membership policies, bylaws, and governance documents in one place.",
    breadcrumb: "Standards",
  },
  governance: {
    path: "/governance",
    title: "Governance: Board of Directors & Officers",
    description:
      "Meet the IBPA board of directors and officers, and see how the association's governance, committees, and policies are structured.",
    breadcrumb: "Governance",
  },
  members: {
    path: "/members",
    title: "Members Directory",
    description:
      "Browse active members of the International Beauty Professionals Association — beauty specialists, educators, and brands from around the world.",
    breadcrumb: "Members",
  },
  events: {
    path: "/events",
    title: "Beauty Industry Events & Championships",
    description:
      "IBPA events and online championships for beauty professionals worldwide, focused on education, networking, competition, and collaboration.",
    breadcrumb: "Events",
  },
  news: {
    path: "/news",
    title: "News & Insights for Beauty Professionals",
    description:
      "IBPA updates, industry developments, educational initiatives, and professional commentary for the international beauty community.",
    breadcrumb: "News",
  },
  partnership: {
    path: "/partnership",
    title: "Partner & Sponsor: Brand Membership vs Sponsorship",
    description:
      "Brands, media, and educators can support the IBPA professional community through sponsorship packages, separate from verified Brand Membership.",
    breadcrumb: "Partnership",
  },
  faq: {
    path: "/faq",
    title: "Membership FAQ: Application, Payment & Certificates",
    description:
      "Answers about IBPA membership categories, the application and review process, payment, certificates, the member dashboard, and professional standards.",
    breadcrumb: "FAQ",
  },
  contact: {
    path: "/contact",
    title: "Contact IBPA: Membership & Partnership Questions",
    description:
      "Reach the IBPA team about membership, applications, partnerships, or standards. Email, phone, and our Roseville, California office address.",
    breadcrumb: "Contact",
  },
  apply: {
    path: "/apply",
    title: "Apply for IBPA Membership",
    description:
      "Start your IBPA membership application. Choose a category and submit your profile for review by the Membership Review Board.",
    breadcrumb: "Apply",
  },
  privacy: {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "How the International Beauty Professionals Association collects, uses, stores, and protects personal information.",
    breadcrumb: "Privacy Policy",
  },
  terms: {
    path: "/terms",
    title: "Terms of Use",
    description:
      "Terms for using the IBPA website and member platform, including user responsibilities, limitations, and general conditions.",
    breadcrumb: "Terms of Use",
  },
  cancellationPolicy: {
    path: "/cancellation-policy",
    title: "Cancellation Policy",
    description:
      "IBPA's cancellation, refund, and policy handling guidance for association-related payments and participation.",
    breadcrumb: "Cancellation Policy",
  },
} as const satisfies Record<string, PageSeo>;
