import assert from "node:assert/strict";
import test from "node:test";
import {
  canViewerWatchWebinar,
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

const owner = (membershipType: string | null) => ({ kind: "owner" as const, membershipType });
const teamMember = (ownerMembershipType: string | null) => ({
  kind: "team_member" as const,
  membershipType: ownerMembershipType,
});
function access(overrides: Partial<ReturnType<typeof normalizeWebinarAccessSettings>> = {}) {
  return { ...normalizeWebinarAccessSettings({}), ...overrides };
}
const can = (
  settings: ReturnType<typeof access>,
  viewer: ReturnType<typeof owner> | ReturnType<typeof teamMember>,
  publicationStatus = "PUBLISHED",
) => canViewerWatchWebinar({ publicationStatus, access: settings, viewer });

test("draft webinars are never visible to anyone", () => {
  assert.equal(can(access(), owner("Professional"), "DRAFT"), false);
  assert.equal(can(access({ allowTeamMembers: true }), teamMember("Business"), "DRAFT"), false);
});

test("all-members access admits every eligible member account", () => {
  for (const type of ["Specialist", "Professional", "Trainer", "Business", "Brand", "Partner package"]) {
    assert.equal(can(access(), owner(type)), true, type);
  }
});

test("individuals-only access admits Specialist and Professional accounts only", () => {
  const settings = access({ audience: "INDIVIDUALS" });
  assert.equal(can(settings, owner("Specialist")), true);
  assert.equal(can(settings, owner("professional")), true);
  assert.equal(can(settings, owner("Trainer")), false);
  assert.equal(can(settings, owner("Business")), false);
  assert.equal(can(settings, owner(null)), false);
});

test("membership-type access admits only the selected categories", () => {
  const settings = access({ audience: "MEMBERSHIP_TYPES", membershipTypes: ["Trainer", "Business"] });
  assert.equal(can(settings, owner("Trainer")), true);
  assert.equal(can(settings, owner("Business")), true);
  assert.equal(can(settings, owner("Professional")), false);
  assert.equal(can(settings, owner("Brand")), false);
});

test("team members need the toggle and an eligible owner account", () => {
  const off = access({ allowTeamMembers: false });
  const on = access({ allowTeamMembers: true });
  assert.equal(can(off, teamMember("Business")), false);
  assert.equal(can(on, teamMember("Business")), true);

  const businessOnly = access({ audience: "MEMBERSHIP_TYPES", membershipTypes: ["Business"], allowTeamMembers: true });
  assert.equal(can(businessOnly, teamMember("Business")), true);
  assert.equal(can(businessOnly, teamMember("Trainer")), false);

  // Individuals-only never reaches a Business owner's team, even with the toggle on.
  assert.equal(can(access({ audience: "INDIVIDUALS", allowTeamMembers: true }), teamMember("Business")), false);
});
