import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MailingDraft, MailingRecipient } from "../types/mailing.types";
import {
  buildCampaignRecipients,
  emptyMailingDraft,
  hasTeam,
  isMemberPickerActive,
  normalizeRecipients,
  resolveAudienceEmails,
} from "./mailing.service";

function recipient(overrides: Partial<MailingRecipient> = {}): MailingRecipient {
  return {
    accountType: "individual",
    applicationType: "MEMBER",
    cardName: "Professional Membership",
    email: "owner@example.com",
    id: "owner-1",
    membershipCategory: "Professional",
    userName: "Owner One",
    ...overrides,
  };
}

const studio = recipient({
  accountType: "business",
  cardName: "Business",
  email: "studio@example.com",
  id: "owner-studio",
  membershipCategory: "Business",
  userName: "Studio Owner",
});

const solo = recipient({
  email: "solo@example.com",
  id: "owner-solo",
  userName: "Solo Member",
});

function draft(overrides: Partial<MailingDraft> = {}): MailingDraft {
  return { ...emptyMailingDraft, ...overrides };
}

describe("mailing recipient normalization", () => {
  it("lowercases the address and keeps the account classification", () => {
    const [business, individual] = normalizeRecipients([
      {
        accountType: "business",
        applicationType: "MEMBER",
        cardName: "Business",
        createdAt: "2026-01-01",
        email: " Studio@Example.com ",
        id: "owner-studio",
        membershipCategory: "Business",
        status: "active",
        userName: "Studio Owner",
      },
      {
        cardName: "Professional Membership",
        createdAt: "2026-01-01",
        email: "solo@example.com",
        id: "owner-solo",
        status: "active",
        userName: "Solo Member",
      },
    ]);

    assert.equal(business.email, "studio@example.com");
    assert.equal(business.accountType, "business");
    assert.equal(individual.accountType, null);
    assert.equal(individual.applicationType, null);
  });
});

describe("team dropdown visibility", () => {
  it("offers a team only for Business and Partner accounts", () => {
    assert.equal(hasTeam(studio), true);
    assert.equal(hasTeam(recipient({ accountType: "partner" })), true);
    assert.equal(hasTeam(recipient({ applicationType: "PARTNER" })), true);
    assert.equal(
      hasTeam(recipient({ accountType: null, membershipCategory: "Business" })),
      true,
    );
    assert.equal(hasTeam(solo), false);
    assert.equal(hasTeam(recipient({ membershipCategory: "Brand" })), false);
  });
});

describe("team members audience", () => {
  it("resolves to the seats loaded from the team members table", () => {
    const emails = resolveAudienceEmails(
      {
        applicationStatusEmails: { approved: [], pending: [], rejected: [] },
        eventRegistrantEmails: [],
        recipients: [studio, solo],
        // Seats are their own table, so they arrive from the audience endpoint
        // rather than from the membership rows above.
        teamMemberEmails: ["seat.one@example.com", "seat.two@example.com"],
      },
      draft({ audienceKind: "team_members" }),
    );

    assert.deepEqual(emails, ["seat.one@example.com", "seat.two@example.com"]);
  });

  it("resolves to nothing when no seats were loaded", () => {
    const emails = resolveAudienceEmails(
      {
        applicationStatusEmails: { approved: [], pending: [], rejected: [] },
        eventRegistrantEmails: [],
        recipients: [studio, solo],
        teamMemberEmails: [],
      },
      draft({ audienceKind: "team_members" }),
    );

    assert.deepEqual(emails, []);
  });
});

describe("campaign recipient assembly", () => {
  it("sends to the picked accounts", () => {
    const result = buildCampaignRecipients({
      audienceEmails: ["ignored@example.com"],
      draft: draft(),
      pickedMemberEmails: ["studio@example.com"],
      pickedTeamMemberEmails: [],
    });

    assert.deepEqual(result.accountEmails, ["studio@example.com"]);
    assert.deepEqual(result.teamEmails, []);
    assert.deepEqual(result.emails, ["studio@example.com"]);
  });

  it("adds the seats picked from a team dropdown", () => {
    const result = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft(),
      pickedMemberEmails: ["studio@example.com"],
      pickedTeamMemberEmails: ["Seat.One@Example.com", "seat.two@example.com"],
    });

    assert.deepEqual(result.teamEmails, ["seat.one@example.com", "seat.two@example.com"]);
    assert.deepEqual(result.emails, [
      "studio@example.com",
      "seat.one@example.com",
      "seat.two@example.com",
    ]);
  });

  it("keeps picked seats even when their owner is not selected", () => {
    const result = buildCampaignRecipients({
      audienceEmails: ["studio@example.com"],
      draft: draft(),
      pickedMemberEmails: [],
      pickedTeamMemberEmails: ["seat.one@example.com"],
    });

    assert.equal(isMemberPickerActive([], ["seat.one@example.com"]), true);
    assert.deepEqual(result.accountEmails, []);
    assert.deepEqual(result.emails, ["seat.one@example.com"]);
  });

  it("falls back to the bulk audience when nothing is picked", () => {
    const result = buildCampaignRecipients({
      audienceEmails: ["seat.one@example.com", "seat.two@example.com"],
      draft: draft({ audienceKind: "team_members" }),
      pickedMemberEmails: [],
      pickedTeamMemberEmails: [],
    });

    assert.deepEqual(result.emails, ["seat.one@example.com", "seat.two@example.com"]);
  });

  it("never mails the same address twice when a seat is also an account", () => {
    const result = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft(),
      pickedMemberEmails: ["studio@example.com", "seat.one@example.com"],
      pickedTeamMemberEmails: ["seat.one@example.com"],
    });

    assert.deepEqual(result.emails, ["studio@example.com", "seat.one@example.com"]);
    assert.equal(new Set(result.emails).size, result.emails.length);
  });

  it("still appends extra custom emails to a picked selection", () => {
    const result = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft({ customEmails: "Guest@Example.com, not-an-email" }),
      pickedMemberEmails: ["solo@example.com"],
      pickedTeamMemberEmails: [],
    });

    assert.deepEqual(result.emails, ["solo@example.com", "guest@example.com"]);
  });
});
