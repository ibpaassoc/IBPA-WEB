import assert from "node:assert/strict";
import { test } from "node:test";
import { listZoomUserRecordings, listZoomUsers } from "./zoom-recordings";

test("uses standard account-admin user recording APIs instead of master account APIs", async () => {
  const originalFetch = globalThis.fetch;
  const originalAccountId = process.env.ZOOM_ACCOUNT_ID;
  const originalClientId = process.env.ZOOM_CLIENT_ID;
  const originalClientSecret = process.env.ZOOM_CLIENT_SECRET;
  const requests: URL[] = [];

  process.env.ZOOM_ACCOUNT_ID = "account-id";
  process.env.ZOOM_CLIENT_ID = "client-id";
  process.env.ZOOM_CLIENT_SECRET = "client-secret";

  globalThis.fetch = (async (input) => {
    const url = new URL(String(input));
    requests.push(url);

    if (url.pathname === "/oauth/token") {
      return Response.json({ access_token: "token", expires_in: 3600 });
    }
    if (url.pathname === "/v2/users") {
      return Response.json({
        users: [{ id: "host-1", email: "host@example.com" }],
      });
    }
    if (url.pathname === "/v2/users/host-1/recordings") {
      return Response.json({ meetings: [] });
    }
    return Response.json(
      { message: "Unexpected test request" },
      { status: 500 },
    );
  }) as typeof fetch;

  try {
    await listZoomUsers({ pageSize: 300 });
    await listZoomUserRecordings({
      userId: "host-1",
      from: "2026-09-01",
      to: "2026-09-11",
      pageSize: 300,
    });

    assert.deepEqual(
      requests.slice(1).map((url) => url.pathname),
      ["/v2/users", "/v2/users/host-1/recordings"],
    );
    assert.equal(
      requests.some((url) => url.pathname.includes("/accounts/")),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAccountId === undefined) delete process.env.ZOOM_ACCOUNT_ID;
    else process.env.ZOOM_ACCOUNT_ID = originalAccountId;
    if (originalClientId === undefined) delete process.env.ZOOM_CLIENT_ID;
    else process.env.ZOOM_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined)
      delete process.env.ZOOM_CLIENT_SECRET;
    else process.env.ZOOM_CLIENT_SECRET = originalClientSecret;
  }
});
