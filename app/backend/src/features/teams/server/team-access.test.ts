import assert from "node:assert/strict";
import test from "node:test";

import {
  getTeamAccountType,
  getTeamMemberAccessType,
  getTeamOwnerAccessType,
  isBusinessOwnerMembershipType,
  isTeamMemberAccess,
  isTeamOwnerAccess,
  resolveTeamOwnerKind,
} from "./team-access";

test("Business Owner membership aliases are team eligible", () => {
  assert.equal(isBusinessOwnerMembershipType("Business"), true);
  assert.equal(isBusinessOwnerMembershipType("Business Owner"), true);
  assert.equal(isBusinessOwnerMembershipType("Business Owner Membership"), true);
  assert.equal(isBusinessOwnerMembershipType("Business Owners"), true);
  assert.equal(isBusinessOwnerMembershipType("business_owner"), true);
  assert.equal(isBusinessOwnerMembershipType("Professional"), false);
});

test("team ownership distinguishes partners from Business Owner members", () => {
  assert.equal(
    resolveTeamOwnerKind({ role: "PARTNER", membershipType: "partner" }),
    "partner",
  );
  assert.equal(
    resolveTeamOwnerKind({ role: "MEMBER", membershipType: "Business" }),
    "business",
  );
  assert.equal(
    resolveTeamOwnerKind({
      applicationType: "MEMBER",
      packageName: "Business Owner",
    }),
    "business",
  );
  assert.equal(
    resolveTeamOwnerKind({ role: "MEMBER", membershipType: "Professional" }),
    null,
  );
});

test("legacy teams retain partner access when classification is incomplete", () => {
  assert.equal(resolveTeamOwnerKind({ role: "MEMBER", hasTeam: true }), "partner");
});

test("owner and member dashboard access follows the owner category", () => {
  assert.equal(getTeamOwnerAccessType("partner"), "partner_owner");
  assert.equal(getTeamOwnerAccessType("business"), "business_owner");
  assert.equal(getTeamMemberAccessType("partner"), "partner_team_member");
  assert.equal(getTeamMemberAccessType("business"), "business_team_member");
  assert.equal(isTeamOwnerAccess("business_owner"), true);
  assert.equal(isTeamMemberAccess("business_team_member"), true);
  assert.equal(getTeamAccountType("partner"), "partner");
  assert.equal(getTeamAccountType("business"), "member");
});
