import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  listEmailHistory,
  listEventRegistrantAudienceEmails,
  listMailingRecipients,
  listTeamMemberAudienceEmails,
  sendEmailCampaign,
} from "./mailing.repository";
import {
  buildCampaignRecipients,
  emptyMailingDraft,
  normalizeRecipients,
  renderEmailHtml,
} from "./mailing.service";

type TrackedResponse = {
  response: Response;
  cloneCallsAfterBodyUsed: () => number;
  bodyReads: () => number;
};

/**
 * Wraps a real Response so the test can prove:
 * - the body is consumed at most once
 * - clone() is never called after the body has been consumed
 * Real Response.clone() throws once the body is disturbed, which is exactly
 * the production bug ("Response body is already used").
 */
function trackResponse(body: string | null, init: ResponseInit): TrackedResponse {
  const response = new Response(body, init);
  let bodyReads = 0;
  let cloneCallsAfterBodyUsed = 0;

  const originalText = response.text.bind(response);
  const originalJson = response.json.bind(response);
  const originalClone = response.clone.bind(response);

  response.text = () => {
    bodyReads += 1;
    return originalText();
  };
  response.json = () => {
    bodyReads += 1;
    return originalJson();
  };
  response.clone = () => {
    if (response.bodyUsed) {
      cloneCallsAfterBodyUsed += 1;
    }
    return originalClone();
  };

  return {
    response,
    cloneCallsAfterBodyUsed: () => cloneCallsAfterBodyUsed,
    bodyReads: () => bodyReads,
  };
}

const originalFetch = globalThis.fetch;

function stubFetch(tracked: TrackedResponse) {
  let calls = 0;
  globalThis.fetch = (() => {
    calls += 1;
    return Promise.resolve(tracked.response);
  }) as typeof fetch;
  return () => calls;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("mailing repository response handling", () => {
  it("parses a JSON success response with a single body read and no clone", async () => {
    const tracked = trackResponse(JSON.stringify([{ id: "log-1", subject: "Hi" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const fetchCalls = stubFetch(tracked);

    const result = await listEmailHistory();

    assert.deepEqual(result, [{ id: "log-1", subject: "Hi" }]);
    assert.equal(fetchCalls(), 1, "must not re-fetch");
    assert.equal(tracked.bodyReads(), 1, "body must be consumed exactly once");
    assert.equal(tracked.cloneCallsAfterBodyUsed(), 0, "must not clone after consumption");
  });

  it("surfaces the server error message from a non-OK JSON response", async () => {
    const tracked = trackResponse(JSON.stringify({ error: "Backend said no." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    stubFetch(tracked);

    await assert.rejects(listEmailHistory(), (error: Error) => {
      assert.equal(error.message, "Backend said no.");
      return true;
    });
    assert.equal(tracked.bodyReads(), 1, "body must be consumed exactly once");
    assert.equal(tracked.cloneCallsAfterBodyUsed(), 0, "must not clone after consumption");
  });

  it("falls back to the friendly message for a non-JSON error response", async () => {
    const tracked = trackResponse("<html><body>502 Bad Gateway</body></html>", {
      status: 502,
      headers: { "Content-Type": "text/html" },
    });
    stubFetch(tracked);

    await assert.rejects(listEmailHistory(), (error: Error) => {
      assert.equal(error.message, "Could not load email history.");
      return true;
    });
    assert.equal(tracked.cloneCallsAfterBodyUsed(), 0, "must not clone after consumption");
  });

  it("does not crash on an empty error response", async () => {
    const tracked = trackResponse(null, { status: 500 });
    stubFetch(tracked);

    await assert.rejects(listEmailHistory(), (error: Error) => {
      assert.equal(error.message, "Could not load email history.");
      return true;
    });
    assert.equal(tracked.cloneCallsAfterBodyUsed(), 0, "must not clone after consumption");
  });

  it("does not crash on an empty success response", async () => {
    const tracked = trackResponse(null, { status: 200 });
    stubFetch(tracked);

    const result = await listEmailHistory();
    assert.equal(result, null);
  });

  it("surfaces mutation errors without consuming the body twice", async () => {
    const tracked = trackResponse(JSON.stringify({ error: "Mailing quota exceeded." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
    stubFetch(tracked);

    await assert.rejects(
      sendEmailCampaign({ emails: ["a@b.co"], subject: "s", html: "<p>x</p>" }),
      (error: Error) => {
        assert.equal(error.message, "Mailing quota exceeded.");
        return true;
      },
    );
    assert.equal(tracked.bodyReads(), 1, "body must be consumed exactly once");
    assert.equal(tracked.cloneCallsAfterBodyUsed(), 0, "must not clone after consumption");
  });

  it("loads the team member audience from the dedicated admin route", async () => {
    const calls: string[] = [];
    globalThis.fetch = ((input: RequestInfo | URL) => {
      calls.push(String(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            count: 3,
            emails: ["Seat.One@Example.com", " seat.one@example.com ", "seat.two@example.com"],
          }),
          { status: 200 },
        ),
      );
    }) as typeof fetch;

    const emails = await listTeamMemberAudienceEmails();

    assert.deepEqual(emails, ["seat.one@example.com", "seat.two@example.com"]);
    assert.deepEqual(calls, ["/api/admin/team-members"]);
  });

  /**
   * End-to-end over the send path with fetch stubbed: loaded recipients ->
   * picked accounts and seats -> the body that reaches the admin mailing route.
   * No request leaves the process.
   */
  it("posts the picked accounts and the picked team members as one campaign", async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith("/api/cards")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  accountType: "business",
                  applicationType: "MEMBER",
                  cardName: "Business",
                  email: "Studio@Example.com",
                  id: "owner-studio",
                  membershipCategory: "Business",
                  userName: "Studio Owner",
                },
                {
                  cardName: "Professional Membership",
                  email: "solo@example.com",
                  id: "owner-solo",
                  membershipCategory: "Professional",
                  userName: "Solo Member",
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      requests.push({ body: JSON.parse(String(init?.body ?? "null")), url });
      return Promise.resolve(new Response(JSON.stringify({ count: 3, success: true }), { status: 200 }));
    }) as typeof fetch;

    const recipients = normalizeRecipients((await listMailingRecipients()).items ?? []);
    const campaign = buildCampaignRecipients({
      audienceEmails: [],
      draft: { ...emptyMailingDraft, body: "Hello", subject: "Update" },
      pickedMemberEmails: recipients.map((recipient) => recipient.email),
      pickedTeamMemberEmails: ["Seat.One@Example.com"],
    });

    const result = await sendEmailCampaign({
      emails: campaign.emails,
      html: renderEmailHtml("Hello"),
      subject: "Update",
    });

    assert.equal(result.count, 3);
    assert.deepEqual(requests, [
      {
        body: {
          emails: ["studio@example.com", "solo@example.com", "seat.one@example.com"],
          html: renderEmailHtml("Hello"),
          subject: "Update",
        },
        url: "/api/admin/mailing",
      },
    ]);
  });

  it("posts only the accounts when no team member was picked", async () => {
    let sentEmails: string[] = [];
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith("/api/admin/mailing")) {
        sentEmails = JSON.parse(String(init?.body)).emails;
      }
      return Promise.resolve(new Response(JSON.stringify({ count: 1 }), { status: 200 }));
    }) as typeof fetch;

    const campaign = buildCampaignRecipients({
      audienceEmails: ["studio@example.com"],
      draft: emptyMailingDraft,
      pickedMemberEmails: [],
      pickedTeamMemberEmails: [],
    });

    await sendEmailCampaign({ emails: campaign.emails, html: "<p>x</p>", subject: "s" });

    assert.deepEqual(sentEmails, ["studio@example.com"]);
  });

  it("loads and deduplicates event registrants through the admin event routes", async () => {
    const calls: string[] = [];
    globalThis.fetch = ((input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);

      if (url === "/api/admin/content") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                { id: "event one", type: "events" },
                { id: "article-one", type: "news" },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      if (url === "/api/admin/events/event%20one/registrations") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                { email: "Member@Example.com" },
                { email: " member@example.com " },
                { email: "second@example.com" },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    }) as typeof fetch;

    const result = await listEventRegistrantAudienceEmails();

    assert.deepEqual(result, ["member@example.com", "second@example.com"]);
    assert.deepEqual(calls, [
      "/api/admin/content",
      "/api/admin/events/event%20one/registrations",
    ]);
  });
});
