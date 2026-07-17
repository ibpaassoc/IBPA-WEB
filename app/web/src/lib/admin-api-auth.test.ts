import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  adminAuthErrorResponse,
  classifyProxyPath,
  evaluateAdminIdentity,
  getEmailFromToken,
  isDocumentRequest,
  unauthenticatedAdminPageAction,
} from "./admin-api-auth";

const originalAdminEmails = process.env.ADMIN_EMAILS;

beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@example.com,second-admin@example.com";
});

afterEach(() => {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }
});

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fakeJwt(payload: Record<string, unknown>) {
  return `${base64Url("{}")}.${base64Url(JSON.stringify(payload))}.sig`;
}

describe("classifyProxyPath", () => {
  it("bypasses UploadThing so its callbacks are never blocked", () => {
    assert.equal(classifyProxyPath("/api/uploadthing"), "bypass");
    assert.equal(classifyProxyPath("/api/uploadthing/callback"), "bypass");
  });

  it("bypasses Stripe webhooks", () => {
    assert.equal(classifyProxyPath("/api/webhooks/stripe"), "bypass");
  });

  it("protects admin, cards, and dashboard APIs", () => {
    assert.equal(classifyProxyPath("/api/admin/content"), "protected-api");
    assert.equal(classifyProxyPath("/api/admin/orders/abc/certificate"), "protected-api");
    assert.equal(classifyProxyPath("/api/cards"), "protected-api");
    assert.equal(classifyProxyPath("/api/dashboard/me"), "protected-api");
  });

  it("treats admin pages as admin pages", () => {
    assert.equal(classifyProxyPath("/admin"), "admin-page");
    assert.equal(classifyProxyPath("/admin/events"), "admin-page");
    assert.equal(classifyProxyPath("/admin/applications"), "admin-page");
  });

  it("leaves everything else (including the sign-in page) ungated", () => {
    assert.equal(classifyProxyPath("/"), "public");
    assert.equal(classifyProxyPath("/sign-in"), "public");
    assert.equal(classifyProxyPath("/dashboard"), "public");
    assert.equal(classifyProxyPath("/api/content"), "public");
    assert.equal(classifyProxyPath("/api/orders"), "public");
  });
});

describe("isDocumentRequest", () => {
  it("detects document navigations via sec-fetch-dest", () => {
    assert.equal(isDocumentRequest(new Headers({ "sec-fetch-dest": "document" })), true);
    assert.equal(isDocumentRequest(new Headers({ "sec-fetch-dest": "empty" })), false);
  });

  it("falls back to the accept header when sec-fetch-dest is missing", () => {
    assert.equal(isDocumentRequest(new Headers({ accept: "text/html,*/*" })), true);
    assert.equal(isDocumentRequest(new Headers({ accept: "text/x-component" })), false);
    assert.equal(isDocumentRequest(new Headers()), false);
  });
});

describe("unauthenticatedAdminPageAction", () => {
  it("redirects only document navigations to sign-in", () => {
    assert.equal(
      unauthenticatedAdminPageAction(new Headers({ "sec-fetch-dest": "document" })),
      "redirect-to-sign-in",
    );
  });

  it("never redirects RSC or prefetch requests (prevents mid-session bounces)", () => {
    assert.equal(
      unauthenticatedAdminPageAction(new Headers({ "sec-fetch-dest": "empty", rsc: "1" })),
      "json-401",
    );
    assert.equal(unauthenticatedAdminPageAction(new Headers()), "json-401");
  });
});

describe("adminAuthErrorResponse", () => {
  it("distinguishes 401 unauthenticated from 403 forbidden", async () => {
    const unauthenticated = adminAuthErrorResponse("unauthenticated");
    assert.equal(unauthenticated.status, 401);
    assert.deepEqual(await unauthenticated.json(), {
      error: "Authentication required. Please sign in again.",
      code: "unauthenticated",
    });

    const forbidden = adminAuthErrorResponse("forbidden");
    assert.equal(forbidden.status, 403);
    assert.equal((await forbidden.json()).code, "forbidden");
  });

  it("maps unavailable to 503 and misconfigured to 500", () => {
    assert.equal(adminAuthErrorResponse("unavailable").status, 503);
    assert.equal(adminAuthErrorResponse("misconfigured").status, 500);
  });

  it("always returns JSON and never a redirect", () => {
    for (const category of ["unauthenticated", "forbidden", "unavailable", "misconfigured"] as const) {
      const response = adminAuthErrorResponse(category);
      assert.match(response.headers.get("content-type") ?? "", /application\/json/);
      assert.equal(response.headers.get("location"), null);
      assert.ok(response.status < 300 || response.status >= 400, "no 3xx statuses");
    }
  });
});

describe("getEmailFromToken", () => {
  it("reads the email claim from a base64url JWT payload", () => {
    assert.equal(getEmailFromToken(fakeJwt({ email: "admin@example.com" })), "admin@example.com");
    assert.equal(
      getEmailFromToken(fakeJwt({ email_address: "user@example.com" })),
      "user@example.com",
    );
  });

  it("survives unicode payloads without Buffer (Edge-safe decode)", () => {
    assert.equal(
      getEmailFromToken(fakeJwt({ name: "Іван", email: "admin@example.com" })),
      "admin@example.com",
    );
  });

  it("returns null for malformed tokens", () => {
    assert.equal(getEmailFromToken("not-a-jwt"), null);
    assert.equal(getEmailFromToken("a.!!!.c"), null);
    assert.equal(getEmailFromToken(`${base64Url("{}")}.${base64Url("not json")}.s`), null);
  });
});

describe("evaluateAdminIdentity", () => {
  const neverLookup = async (): Promise<string[]> => {
    throw new Error("lookup must not be called");
  };

  it("reports a missing session as unauthenticated, not forbidden", async () => {
    assert.deepEqual(
      await evaluateAdminIdentity({ userId: null, sessionClaims: null, token: null }, neverLookup),
      { outcome: "unauthenticated" },
    );
    assert.deepEqual(
      await evaluateAdminIdentity({ userId: "user_1", sessionClaims: {}, token: null }, neverLookup),
      { outcome: "unauthenticated" },
    );
  });

  it("accepts an admin email from session claims", async () => {
    assert.deepEqual(
      await evaluateAdminIdentity(
        { userId: "user_1", sessionClaims: { email: "Admin@Example.com" }, token: fakeJwt({}) },
        neverLookup,
      ),
      { outcome: "ok", email: "admin@example.com" },
    );
  });

  it("accepts an admin email from the token payload", async () => {
    assert.deepEqual(
      await evaluateAdminIdentity(
        { userId: "user_1", sessionClaims: {}, token: fakeJwt({ email: "admin@example.com" }) },
        neverLookup,
      ),
      { outcome: "ok", email: "admin@example.com" },
    );
  });

  it("rejects an authenticated non-admin with forbidden", async () => {
    assert.deepEqual(
      await evaluateAdminIdentity(
        { userId: "user_1", sessionClaims: { email: "user@example.com" }, token: fakeJwt({}) },
        neverLookup,
      ),
      { outcome: "forbidden" },
    );
  });

  it("falls back to the provider lookup when no email claim is present", async () => {
    assert.deepEqual(
      await evaluateAdminIdentity(
        { userId: "user_1", sessionClaims: {}, token: fakeJwt({}) },
        async () => ["second-admin@example.com"],
      ),
      { outcome: "ok", email: "second-admin@example.com" },
    );

    assert.deepEqual(
      await evaluateAdminIdentity(
        { userId: "user_1", sessionClaims: {}, token: fakeJwt({}) },
        async () => ["user@example.com"],
      ),
      { outcome: "forbidden" },
    );
  });

  it("reports a provider outage as unavailable instead of forbidden", async () => {
    assert.deepEqual(
      await evaluateAdminIdentity(
        { userId: "user_1", sessionClaims: {}, token: fakeJwt({}) },
        async () => {
          throw new Error("clerk down");
        },
      ),
      { outcome: "unavailable" },
    );
  });

  it("is deterministic for the same session — GET and POST share the answer", async () => {
    const identity = {
      userId: "user_1",
      sessionClaims: { email: "admin@example.com" },
      token: fakeJwt({}),
    };
    const first = await evaluateAdminIdentity(identity, neverLookup);
    const second = await evaluateAdminIdentity(identity, neverLookup);
    assert.deepEqual(first, second);
  });
});
