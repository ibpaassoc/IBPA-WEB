import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isUuid, mapAdminTeamMemberRecords } from "./admin-team.service";

type SourceMember = Parameters<typeof mapAdminTeamMemberRecords>[0][number];

function sourceMember(
  id: string,
  status: string,
  overrides: Partial<SourceMember> = {},
): SourceMember {
  return {
    id,
    teamId: "00000000-0000-4000-8000-000000000001",
    email: `${id}@example.com`,
    fullName: `Member ${id}`,
    role: "Stylist",
    status,
    credentials: null,
    joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("admin team owner id validation", () => {
  it("accepts canonical UUIDs and rejects malformed identifiers before a query", () => {
    assert.equal(isUuid("00000000-0000-4000-8000-000000000001"), true);
    assert.equal(isUuid("not-an-order"), false);
    assert.equal(isUuid("00000000-0000-0000-0000-000000000000"), false);
    assert.equal(isUuid(null), false);
  });
});

describe("admin team member mapping", () => {
  it("returns stored credentials unchanged and keeps every access state visible", () => {
    const records = mapAdminTeamMemberRecords(
      [
        sourceMember("one", "ACTIVE", { credentials: "TEAM-7-20260731-A1B2" }),
        sourceMember("two", "INACTIVE", { credentials: "TEAM-7-20260731-C3D4" }),
        sourceMember("three", "REMOVED", { credentials: "TEAM-7-20260731-E5F6" }),
        sourceMember("four", "INVITED", { credentials: null }),
      ],
    );

    assert.equal(records.length, 4);
    assert.equal(records[0].credentials, "TEAM-7-20260731-A1B2");
    assert.equal(records[1].credentials, "TEAM-7-20260731-C3D4");
    assert.equal(records[2].credentials, "TEAM-7-20260731-E5F6");
    assert.equal(records[3].credentials, null);
    assert.equal(records[0].accessStatus, "active");
    assert.equal(records[1].accessStatus, "inactive");
    assert.equal(records[2].accessStatus, "removed");
    assert.equal(records[3].accessStatus, "invited");
  });
});
