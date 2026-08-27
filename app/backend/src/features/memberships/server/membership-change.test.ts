import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMembershipBalance,
  getMembershipChangeDetails,
  isMembershipChangeApplicationData,
  normalizeMembershipCategory,
} from "./membership-change";

test("normalizes membership categories without accepting unknown tiers", () => {
  assert.equal(normalizeMembershipCategory(" professional "), "Professional");
  assert.equal(normalizeMembershipCategory("Enterprise"), null);
});

test("charges only the positive difference between memberships", () => {
  assert.deepEqual(calculateMembershipBalance("Specialist", "Professional"), {
    oldAmount: 4900,
    newAmount: 19900,
    balanceDue: 15000,
  });
  assert.deepEqual(calculateMembershipBalance("Trainer", "Specialist"), {
    oldAmount: 39900,
    newAmount: 4900,
    balanceDue: 0,
  });
});

test("recognizes a complete membership-change application payload", () => {
  const applicationData = {
    applicationKind: "MEMBERSHIP_CHANGE",
    membershipChange: {
      previousMembershipId: "old-membership-id",
      previousApplicationId: "old-application-id",
      fromCategory: "Professional",
      toCategory: "Trainer",
      oldAmount: 1,
      newAmount: 1,
      balanceDue: 1,
      reason: "I now teach classes.",
      submittedAt: "2026-08-25T12:00:00.000Z",
    },
  };

  assert.equal(isMembershipChangeApplicationData(applicationData), true);
  assert.deepEqual(getMembershipChangeDetails(applicationData.membershipChange), {
    previousMembershipId: "old-membership-id",
    previousApplicationId: "old-application-id",
    fromCategory: "Professional",
    toCategory: "Trainer",
    oldAmount: 19900,
    newAmount: 39900,
    balanceDue: 20000,
    reason: "I now teach classes.",
    submittedAt: "2026-08-25T12:00:00.000Z",
  });
});
