import assert from "node:assert/strict";
import test from "node:test";
import { describeAccess, individualCategories } from "./webinar-access";

const options = [
  { value: "Specialist" as const, applicantType: "Individual" },
  { value: "Professional" as const, applicantType: "Individual" },
  { value: "Trainer" as const, applicantType: "School" },
  { value: "Business" as const, applicantType: "Business" },
];

test("individual categories come from the existing membership applicant types", () => {
  assert.deepEqual(individualCategories(options), ["Specialist", "Professional"]);
});

test("access descriptions name the audience and the team-member rule", () => {
  assert.equal(
    describeAccess({ audience: "ALL_MEMBERS", membershipTypes: [], allowTeamMembers: false }, options),
    "All members · Team members not allowed",
  );
  assert.equal(
    describeAccess({ audience: "INDIVIDUALS", membershipTypes: [], allowTeamMembers: false }, options),
    "Individuals only (Specialist, Professional) · Team members not allowed",
  );
  assert.equal(
    describeAccess(
      { audience: "MEMBERSHIP_TYPES", membershipTypes: ["Trainer", "Business"], allowTeamMembers: true },
      options,
    ),
    "Trainer, Business · Team members allowed",
  );
});
