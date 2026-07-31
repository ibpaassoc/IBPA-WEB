import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getAdminTeamMembers } from "./admin-team.repository";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("admin team repository", () => {
  it("loads one owner team lazily through the protected admin route", async () => {
    const calls: string[] = [];
    globalThis.fetch = ((input: RequestInfo | URL) => {
      calls.push(String(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            ownerOrderId: "owner id",
            ownerType: "business",
            ownerName: "Studio",
            seatCount: 5,
            count: 1,
            activeCount: 1,
            items: [{
              id: "member-id",
              teamMemberId: "TEAM-2-20260731-ABCD",
              avatarUrl: null,
              fullName: "Team Member",
              email: "member@example.com",
              role: "Long-form role",
              accessStatus: "active",
              joinedAt: null,
            }],
          }),
          { status: 200 },
        ),
      );
    }) as typeof fetch;

    const result = await getAdminTeamMembers("owner id");

    assert.equal(result.count, 1);
    assert.equal(result.items[0].teamMemberId, "TEAM-2-20260731-ABCD");
    assert.equal(result.items[0].accessStatus, "active");
    assert.deepEqual(calls, ["/api/admin/orders/owner%20id/team-members"]);
  });

  it("surfaces an API failure so the shared list can render its retry state", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Owner order not found." }), { status: 404 }),
      )) as typeof fetch;

    await assert.rejects(getAdminTeamMembers("missing"), (error: Error) => {
      assert.equal(error.message, "Owner order not found.");
      return true;
    });
  });
});
