import assert from "node:assert/strict";
import test from "node:test";

import {
  isDashboardAccessType,
  isPartnerOwnerDashboard,
  isTeamMemberDashboard,
  isTeamOwnerDashboard,
} from "./dashboard-access";

test("Business Owner access is accepted as a team owner dashboard", () => {
  assert.equal(isDashboardAccessType("business_owner"), true);
  assert.equal(isTeamOwnerDashboard("business_owner"), true);
  assert.equal(isPartnerOwnerDashboard("business_owner"), false);
});

test("Business Owner team members receive limited team-member access", () => {
  assert.equal(isDashboardAccessType("business_team_member"), true);
  assert.equal(isTeamMemberDashboard("business_team_member"), true);
  assert.equal(isTeamOwnerDashboard("business_team_member"), false);
});

test("unknown dashboard access values are rejected", () => {
  assert.equal(isDashboardAccessType("business"), false);
  assert.equal(isDashboardAccessType(null), false);
});
