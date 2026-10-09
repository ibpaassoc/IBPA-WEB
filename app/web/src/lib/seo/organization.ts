/**
 * Organization facts reused by structured data and metadata.
 *
 * Every value here is published on the live site (footer, contact, governance,
 * and about pages). Do not add credentials, awards, accreditations, member
 * counts, or endorsements that the site itself does not state.
 */
export const ORGANIZATION = {
  name: "International Beauty Professionals Association",
  shortName: "IBPA",
  alternateNames: ["IBPA", "IBPA Associations"],
  description:
    "IBPA is an international professional beauty association and California-registered nonprofit for beauty specialists, educators, salon owners, and brands, focused on professional standards, education, and recognition.",
  email: "support@ibpassociations.org",
  telephone: "+1-279-230-2804",
  address: {
    streetAddress: "1220 Melody Ln, Suite 110",
    addressLocality: "Roseville",
    addressRegion: "CA",
    postalCode: "95678",
    addressCountry: "US",
  },
  logoPath: "/branding/logo-header.webp",
  logoWidth: 843,
  logoHeight: 341,
  /** Profiles linked from the site footer. */
  sameAs: ["https://www.instagram.com/bbeauty_forum/"],
  founder: { name: "Iuliia Andreeva", jobTitle: "President" },
} as const;

/** Display name with the abbreviation, used for Open Graph `siteName`. */
export const SITE_DISPLAY_NAME = `${ORGANIZATION.name} (${ORGANIZATION.shortName})`;
