import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { coreApplications, coreTeamMembers, coreTeams } from "@/lib/schema";
import {
  isUuid,
  listAdminTeamMembersByOwnerOrder,
  mapAdminTeamMemberRecords,
} from "./admin-team.service";

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

type Row = Record<string, unknown>;

/**
 * Minimal stand-in for the drizzle client: it answers each query by the table
 * it reads from, and records the credential written back to a stored member.
 * Filters are irrelevant here — the fixture holds a single team.
 */
function createFakeDb(state: { applications: Row[]; teams: Row[]; members: Row[] }) {
  const updated: Row[] = [];

  const resolvesTo = (rows: Row[]) => {
    const chain = {
      where: () => chain,
      limit: () => chain,
      orderBy: () => chain,
      then: (onFulfilled: (value: Row[]) => unknown, onRejected?: (reason: unknown) => unknown) =>
        Promise.resolve(rows).then(onFulfilled, onRejected),
    };
    return chain;
  };

  return {
    updated,
    db: {
      select: (projection?: unknown) => ({
        from: (table: unknown) => {
          if (table === coreApplications) return resolvesTo(state.applications);
          if (table === coreTeams) return resolvesTo(state.teams);
          // A projected member query is the credential-uniqueness probe; an
          // unprojected one lists the team roster.
          return resolvesTo(projection ? [] : state.members);
        },
      }),
      update: (_table: unknown) => ({
        set: (values: Row) => ({
          where: () => ({
            returning: () => {
              const target = state.members.find((member) => !member.credentials)!;
              Object.assign(target, values);
              updated.push({ ...target });
              return Promise.resolve([target]);
            },
          }),
        }),
      }),
    },
  };
}

describe("admin team members lookup", () => {
  const ownerOrderId = "00000000-0000-4000-8000-000000000001";

  function fixture(memberOverrides: Row = {}) {
    return createFakeDb({
      applications: [{ id: ownerOrderId, type: "MEMBER", packageName: "Business", fullName: "Studio" }],
      teams: [{ id: ownerOrderId, name: "Studio Team", seatCount: 5 }],
      members: [
        {
          id: "00000000-0000-4000-8000-0000000000a1",
          teamId: ownerOrderId,
          email: "member@example.com",
          fullName: "Team Member",
          role: "Stylist",
          status: "ACTIVE",
          credentials: null,
          joinedAt: new Date("2026-07-31T00:00:00.000Z"),
          ...memberOverrides,
        },
      ],
    });
  }

  it("issues and stores a credential for a member that never received one", async () => {
    const { db, updated } = fixture();

    const result = await listAdminTeamMembersByOwnerOrder(db as never, ownerOrderId);

    assert.equal(result.ok, true);
    assert.ok(result.ok && result.data.items[0].credentials);
    assert.match(result.ok ? result.data.items[0].credentials! : "", /^TEAM-\d{2,}-\d{8}-[0-9A-F]{4}$/);
    assert.equal(updated.length, 1);
  });

  it("leaves an already stored credential untouched", async () => {
    const { db, updated } = fixture({ credentials: "TEAM-01-20260731-ABCD" });

    const result = await listAdminTeamMembersByOwnerOrder(db as never, ownerOrderId);

    assert.equal(result.ok && result.data.items[0].credentials, "TEAM-01-20260731-ABCD");
    assert.equal(updated.length, 0);
  });
});
