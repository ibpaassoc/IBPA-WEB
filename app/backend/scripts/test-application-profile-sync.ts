import assert from "node:assert/strict";
import type { CoreProfile } from "../src/lib/schema";
import {
  computeProfileFill,
  mapApplicationPayloadToProfile,
  type ApplicationForProfileSync,
} from "../src/features/profiles/server/application-profile-sync";

/**
 * Standalone assertion suite for the application -> profile mapper and fill logic.
 * No DB required. Run with:  tsx scripts/test-application-profile-sync.ts
 */

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Minimal factory for an existing profile row with sensible empty defaults.
function profile(overrides: Partial<CoreProfile>): CoreProfile {
  return {
    id: "p1",
    userId: "u1",
    firstName: null,
    lastName: null,
    phone: null,
    avatarUrl: null,
    bio: null,
    credentials: null,
    achievements: null,
    industryContribution: null,
    services: [],
    workGalleryPhotos: [],
    specializations: [],
    city: null,
    state: null,
    country: null,
    website: null,
    instagram: null,
    yearsExperience: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CoreProfile;
}

// --- Anna Charkviani fixture (Trainer / MEMBER, PAID) -------------------------
const annaApplication: ApplicationForProfileSync = {
  id: "8ee1534b-6f22-44bf-b343-37e42c25ccf3",
  type: "MEMBER",
  fullName: "Anna Charkviani",
  phone: "+995 599 000 000",
  packageName: "Trainer",
  applicationData: {
    firstName: "Anna",
    lastName: "Charkviani",
    email: "ania080@icloud.com",
    membershipCategory: "Trainer",
    applicantType: "School",
    phone: "+995 599 000 000",
    city: "Tbilisi",
    state: "Tbilisi",
    country: "Georgia",
    specialization: ["Brow Artist", "Lash Artist"],
    specializationOther: "Permanent Makeup",
    yearsExperience: "5-10",
    educatorYears: "3-5",
    professionalDesc: "Master trainer with a decade of teaching experience.",
    whyJoin: "To connect with the global beauty community.",
    educationDesc: "Diploma in Cosmetology, 2014.",
    additionalEducation: "Advanced PMU certification, 2018.",
    achievementsDesc: "National brow championship finalist.",
    contributionDesc: "Trained over 500 students.",
    instagramLink: "@anna.brows",
    websiteLink: "anna-academy.ge",
    portfolioImages: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
    // Private fields that must NOT map into the public profile:
    dateOfBirth: "1990-01-01",
    streetAddress: "12 Rustaveli Ave",
    citizenship: "Georgian",
    signature: "Anna Charkviani",
    privacyConsent: true,
    certificateNumber: "CERT-20260619-A32E",
    stripePaymentIntentId: "pi_123",
    stripeInvoiceId: "in_123",
  },
};

console.log("\n[Test] application-profile-sync\n");

test("maps core member fields from payload", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  assert.equal(c.firstName, "Anna");
  assert.equal(c.lastName, "Charkviani");
  assert.equal(c.phone, "+995 599 000 000");
  assert.equal(c.city, "Tbilisi");
  assert.equal(c.state, "Tbilisi");
  assert.equal(c.country, "Georgia");
  assert.equal(c.bio, "Master trainer with a decade of teaching experience.");
});

test("normalizes instagram handle and bare website domain", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  assert.equal(c.instagram, "https://instagram.com/anna.brows");
  assert.equal(c.website, "https://anna-academy.ge");
});

test("preserves specialization array and merges 'other'", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  assert.deepEqual(c.specializations, ["Brow Artist", "Lash Artist", "Permanent Makeup"]);
});

test("preserves portfolio images as an array", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  assert.deepEqual(c.workGalleryPhotos, [
    "https://cdn.example.com/a.jpg",
    "https://cdn.example.com/b.jpg",
  ]);
});

test("merges education + additional education into credentials", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  assert.equal(c.credentials, "Diploma in Cosmetology, 2014.\n\nAdvanced PMU certification, 2018.");
});

test("parses years experience to a number", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  assert.equal(c.yearsExperience, 5); // "5-10" -> 5
});

test("does not leak private application fields into candidates", () => {
  const c = mapApplicationPayloadToProfile(annaApplication) as Record<string, unknown>;
  for (const forbidden of ["dateOfBirth", "streetAddress", "citizenship", "signature", "privacyConsent", "certificateNumber", "stripePaymentIntentId", "stripeInvoiceId"]) {
    assert.ok(!(forbidden in c), `candidate unexpectedly contains ${forbidden}`);
  }
});

test("empty profile gets fully populated (Anna case)", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  const { update, filledFields } = computeProfileFill(null, c);
  assert.equal(update.firstName, "Anna");
  assert.equal(update.country, "Georgia");
  assert.deepEqual(update.specializations, ["Brow Artist", "Lash Artist", "Permanent Makeup"]);
  assert.equal(update.yearsExperience, 5);
  assert.ok(filledFields.includes("bio"));
  assert.ok(filledFields.includes("workGalleryPhotos"));
});

test("manual profile values are NOT overwritten", () => {
  const existing = profile({
    firstName: "Anna",
    lastName: "Charkviani",
    bio: "My hand-written bio",
    city: "Kutaisi", // manually corrected, differs from payload
    specializations: ["Custom Specialization"],
  });
  const c = mapApplicationPayloadToProfile(annaApplication);
  const { update, filledFields } = computeProfileFill(existing, c);
  assert.ok(!("bio" in update), "bio should be preserved");
  assert.ok(!("city" in update), "manual city should be preserved");
  assert.ok(!("specializations" in update), "curated specializations preserved");
  // But still fills the genuinely-empty fields:
  assert.equal(update.country, "Georgia");
  assert.ok(filledFields.includes("country"));
});

test("placeholder values are treated as empty and overwritten", () => {
  const existing = profile({ city: "Not provided", country: "N/A", phone: "unknown" });
  const c = mapApplicationPayloadToProfile(annaApplication);
  const { update } = computeProfileFill(existing, c);
  assert.equal(update.city, "Tbilisi");
  assert.equal(update.country, "Georgia");
  assert.equal(update.phone, "+995 599 000 000");
});

test("empty payload never blanks an existing profile", () => {
  const existing = profile({ firstName: "Real", lastName: "Member", bio: "Existing bio" });
  const emptyApp: ApplicationForProfileSync = {
    id: "x",
    type: "MEMBER",
    fullName: "",
    applicationData: {},
  };
  const c = mapApplicationPayloadToProfile(emptyApp);
  const { update, filledFields } = computeProfileFill(existing, c);
  assert.deepEqual(update, {});
  assert.equal(filledFields.length, 0);
});

test("partner application does not invent member profile data", () => {
  // Partner payloads carry message/tier, not the member field vocabulary.
  const partnerApp: ApplicationForProfileSync = {
    id: "partner-1",
    type: "PARTNER",
    fullName: "Beauty Brand LLC",
    phone: "+1 555 111 2222",
    packageName: "Premier",
    applicationData: {
      message: "We would like to partner with IBPA.",
      requestedTier: "Premier",
      partnerOrderId: "po_1",
      stripeInvoiceId: "in_partner",
    },
  };
  const c = mapApplicationPayloadToProfile(partnerApp);
  const { update } = computeProfileFill(null, c);
  // Name falls back to the org name (split), phone maps, but no member-only fields
  // are fabricated from partner metadata.
  assert.equal(c.firstName, "Beauty");
  assert.equal(c.lastName, "Brand LLC");
  assert.equal(c.phone, "+1 555 111 2222");
  assert.equal(c.bio, "");
  assert.deepEqual(c.specializations, []);
  assert.deepEqual(c.workGalleryPhotos, []);
  assert.ok(!("bio" in update));
  assert.ok(!("specializations" in update));
});

test("trainer/school fields map correctly (educatorYears fallback)", () => {
  const trainerApp: ApplicationForProfileSync = {
    id: "trainer-1",
    type: "MEMBER",
    fullName: "Trainer One",
    packageName: "Trainer",
    applicationData: {
      firstName: "Trainer",
      lastName: "One",
      applicantType: "School",
      // no yearsExperience, only educatorYears -> should be used as fallback
      educatorYears: "10+",
      specialization: ["Educator"],
      professionalDesc: "Runs a beauty school.",
    },
  };
  const c = mapApplicationPayloadToProfile(trainerApp);
  assert.equal(c.yearsExperience, 10);
  assert.deepEqual(c.specializations, ["Educator"]);
  assert.equal(c.bio, "Runs a beauty school.");
});

test("organization applications map their new fields into member profiles", () => {
  const business = mapApplicationPayloadToProfile({
    fullName: "Jane Owner",
    packageName: "Business",
    applicationData: {
      firstName: "Jane",
      lastName: "Owner",
      businessDescription: "Owner of a multi-service beauty studio.",
      professionalEducation: "Licensed cosmetologist.",
      businessAchievements: "Local business award.",
      businessIndustryContribution: "Creates jobs and mentors new specialists.",
      businessPortfolioImages: ["https://example.com/work-1.jpg"],
      bizType: "Studio",
      businessCity: "Seattle",
      businessCountry: "United States",
      businessWebsite: "example.com",
      businessInstagram: "@example_studio",
      yearsExperience: "10+",
    },
  });
  assert.equal(business.bio, "Owner of a multi-service beauty studio.");
  assert.equal(business.credentials, "Licensed cosmetologist.");
  assert.equal(business.achievements, "Local business award.");
  assert.equal(business.city, "Seattle");
  assert.deepEqual(business.workGalleryPhotos, ["https://example.com/work-1.jpg"]);

  const brand = mapApplicationPayloadToProfile({
    fullName: "Alex Contact",
    packageName: "Brand",
    applicationData: {
      brandDescription: "Professional skincare brand.",
      brandAchievements: "International exhibition award.",
      brandIndustryContribution: "Supports product research.",
      brandProductCategories: ["Skincare"],
      brandCertifications: ["ISO", "Vegan"],
      brandCity: "Toronto",
      brandRegistrationCountry: "Canada",
      brandWebsite: "brand.example",
      brandInstagram: "@brand_example",
      brandContactPhone: "+1 555 0100",
    },
  });
  assert.equal(brand.bio, "Professional skincare brand.");
  assert.equal(brand.achievements, "International exhibition award.");
  assert.equal(brand.credentials, "ISO, Vegan");
  assert.deepEqual(brand.specializations, ["Skincare"]);
  assert.equal(brand.country, "Canada");
});

test("idempotency: second fill over a populated profile is a no-op", () => {
  const c = mapApplicationPayloadToProfile(annaApplication);
  const firstPass = computeProfileFill(null, c);
  // Simulate the row that would exist after the first apply.
  const afterFirst = profile({
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    bio: c.bio,
    credentials: c.credentials,
    achievements: c.achievements,
    industryContribution: c.industryContribution,
    city: c.city,
    state: c.state,
    country: c.country,
    website: c.website,
    instagram: c.instagram,
    specializations: c.specializations,
    workGalleryPhotos: c.workGalleryPhotos,
    yearsExperience: c.yearsExperience,
  });
  assert.ok(firstPass.filledFields.length > 0);
  const secondPass = computeProfileFill(afterFirst, c);
  assert.deepEqual(secondPass.update, {});
  assert.equal(secondPass.filledFields.length, 0);
});

console.log(`\n[Test] ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
