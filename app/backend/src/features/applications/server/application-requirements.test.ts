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

const photo = ["https://cdn.example.com/photo.jpg"];

test("requires Instagram for every membership category", () => {
  for (const membershipPackage of ["Specialist", "Professional", "Trainer"]) {
    assert.match(validateApplicationRequirements(membershipPackage, { profilePhotoFiles: photo }) ?? "", /Instagram is required/);
    assert.equal(validateApplicationRequirements(membershipPackage, { instagramLink: "@anna.brows", profilePhotoFiles: photo }), null);
  }

  assert.match(
    validateApplicationRequirements("Business", { instagramLink: "@anna.brows", businessProfilePhotoFiles: photo }) ?? "",
    /Instagram is required/,
  );
  assert.equal(validateApplicationRequirements("Business", { businessInstagram: "@studio", businessProfilePhotoFiles: photo }), null);
  assert.equal(validateApplicationRequirements("Brand", { brandInstagram: "instagram.com/brand", profilePhotoFiles: photo }), null);
});

test("requires a profile photo for every membership category", () => {
  for (const membershipPackage of ["Specialist", "Professional", "Trainer"]) {
    assert.equal(validateApplicationRequirements(membershipPackage, { instagramLink: "@anna.brows" }), "A profile photo is required.");
    assert.equal(
      validateApplicationRequirements(membershipPackage, { instagramLink: "@anna.brows", profilePhotoFiles: [" "] }),
      "A profile photo is required.",
    );
  }

  assert.equal(validateApplicationRequirements("Brand", { brandInstagram: "@brand" }), "A profile photo is required.");
  assert.equal(
    validateApplicationRequirements("Business", { businessInstagram: "@studio", profilePhotoFiles: photo }),
    "A profile photo is required.",
  );
});
