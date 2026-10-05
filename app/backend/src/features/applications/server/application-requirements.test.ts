import assert from "node:assert/strict";
import test from "node:test";

import { isInstagramProfile, validateApplicationRequirements } from "./application-requirements";

test("accepts Instagram handles and profile links only", () => {
  assert.equal(isInstagramProfile("@anna.brows"), true);
  assert.equal(isInstagramProfile("https://www.instagram.com/anna.brows/?hl=en"), true);
  assert.equal(isInstagramProfile("https://facebook.com/anna"), false);
  assert.equal(isInstagramProfile("  "), false);
  assert.equal(isInstagramProfile(undefined), false);
});

test("requires Instagram for every membership category", () => {
  for (const membershipPackage of ["Specialist", "Professional", "Trainer"]) {
    assert.match(validateApplicationRequirements(membershipPackage, {}) ?? "", /Instagram is required/);
    assert.equal(validateApplicationRequirements(membershipPackage, { instagramLink: "@anna.brows" }), null);
  }

  assert.match(validateApplicationRequirements("Business", { instagramLink: "@anna.brows" }) ?? "", /Instagram is required/);
  assert.equal(validateApplicationRequirements("Business", { businessInstagram: "@studio" }), null);
  assert.equal(validateApplicationRequirements("Brand", { brandInstagram: "instagram.com/brand" }), null);
});
