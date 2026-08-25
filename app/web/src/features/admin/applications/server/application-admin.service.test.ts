import assert from "node:assert/strict";
import test from "node:test";

import {
  getMembershipChangeSummary,
  isTeamApplication,
  sortApplicationQueue,
  toMemberApplicationRecord,
} from "./application-admin.service";
import type { MemberApplicationDetail } from "../types/application-admin.types";

function changeApplication(): MemberApplicationDetail {
  return {
    id: "change-1",
    email: "member@example.com",
    name: "Existing Member",
    membershipCategory: "Trainer",
    applicantType: "School",
    status: "pending",
    stripeSessionId: null,
    checkoutUrl: null,
    createdAt: "2026-08-25T12:00:00.000Z",
    applicationKind: "MEMBERSHIP_CHANGE",
    applicationPayload: {
      applicationKind: "MEMBERSHIP_CHANGE",
      membershipChange: {
        previousMembershipId: "membership-1",
        previousApplicationId: "application-1",
        fromCategory: "Professional",
        toCategory: "Trainer",
        oldAmount: 19900,
        newAmount: 39900,
        balanceDue: 20000,
        reason: "I now teach accredited classes.",
        submittedAt: "2026-08-25T12:00:00.000Z",
      },
    },
  };
}

test("maps membership changes distinctly from new member applications", () => {
  const application = changeApplication();
  const record = toMemberApplicationRecord(application);

  assert.equal(record.isMembershipChange, true);
  assert.equal(record.membershipChange?.fromCategory, "Professional");
  assert.equal(record.membershipChange?.toCategory, "Trainer");
  assert.equal(record.membershipChange?.balanceDue, 20000);
  assert.equal(isTeamApplication(record), false);
});

test("does not infer a membership change from an ordinary application", () => {
  const application = { ...changeApplication(), applicationKind: null, applicationPayload: {} };
  assert.equal(getMembershipChangeSummary(application), null);
  assert.equal(toMemberApplicationRecord(application).isMembershipChange, false);
});

test("pins membership changes ahead of newer ordinary applications", () => {
  const change = toMemberApplicationRecord(changeApplication());
  const ordinary = toMemberApplicationRecord({
    ...changeApplication(),
    id: "new-application",
    applicationKind: null,
    applicationPayload: {},
    createdAt: "2026-08-26T12:00:00.000Z",
  });

  assert.deepEqual(sortApplicationQueue([ordinary, change]).map((record) => record.id), [
    "change-1",
    "new-application",
  ]);
});
