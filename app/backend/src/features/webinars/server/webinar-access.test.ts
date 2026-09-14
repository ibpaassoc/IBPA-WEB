import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeWebinarAccessSettings,
  validateWebinarAccessInput,
} from "./webinar-access";

test("existing webinars without access settings default to all members, no team members", () => {
  assert.deepEqual(normalizeWebinarAccessSettings({}), {
    audience: "ALL_MEMBERS",
    membershipTypes: [],
    allowTeamMembers: false,
    updatedAt: null,
    updatedBy: null,
  });
});

test("access input validation accepts each audience", () => {
  assert.deepEqual(
    validateWebinarAccessInput({ audience: "ALL_MEMBERS", allowTeamMembers: true, membershipTypes: ["Trainer"] }),
    { ok: true, value: { audience: "ALL_MEMBERS", membershipTypes: [], allowTeamMembers: true } },
  );
  assert.deepEqual(
    validateWebinarAccessInput({ audience: "INDIVIDUALS", allowTeamMembers: false }),
    { ok: true, value: { audience: "INDIVIDUALS", membershipTypes: [], allowTeamMembers: false } },
  );
  assert.deepEqual(
    validateWebinarAccessInput({
      audience: "MEMBERSHIP_TYPES",
      allowTeamMembers: false,
      membershipTypes: ["trainer", "Business"],
    }),
    {
      ok: true,
      value: { audience: "MEMBERSHIP_TYPES", membershipTypes: ["Trainer", "Business"], allowTeamMembers: false },
    },
  );
});

test("access input validation rejects incomplete or unknown settings", () => {
  assert.equal(validateWebinarAccessInput(null).ok, false);
  assert.equal(validateWebinarAccessInput({ audience: "EVERYONE", allowTeamMembers: false }).ok, false);
  assert.equal(validateWebinarAccessInput({ audience: "ALL_MEMBERS" }).ok, false);
  assert.equal(
    validateWebinarAccessInput({ audience: "MEMBERSHIP_TYPES", allowTeamMembers: false, membershipTypes: [] }).ok,
    false,
  );
  assert.equal(
    validateWebinarAccessInput({
      audience: "MEMBERSHIP_TYPES",
      allowTeamMembers: false,
      membershipTypes: ["Business", "Webinar VIP"],
    }).ok,
    false,
  );
});
