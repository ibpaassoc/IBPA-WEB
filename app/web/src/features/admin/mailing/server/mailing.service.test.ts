import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MailingDraft, MailingRecipient } from "../types/mailing.types";
import {
  buildCampaignRecipients,
  collectTeamMemberEmails,
  emptyMailingDraft,
  isMemberPickerActive,
  listAllTeamMemberEmails,
  normalizeRecipients,
  resolveAudienceEmails,
} from "./mailing.service";

function recipient(overrides: Partial<MailingRecipient> = {}): MailingRecipient {
  return {
    cardName: "Professional Membership",
    email: "owner@example.com",
    id: "owner-1",
    membershipCategory: "Professional",
    teamMemberEmails: [],
    userName: "Owner One",
    ...overrides,
  };
}

const studio = recipient({
  cardName: "Business Membership",
  email: "studio@example.com",
  id: "owner-studio",
  membershipCategory: "Business",
  teamMemberEmails: ["seat.one@example.com", "seat.two@example.com"],
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
  it("lowercases and deduplicates team seats, and defaults a missing list to empty", () => {
    const [withTeam, withoutTeam] = normalizeRecipients([
      {
        cardName: "Business Membership",
        createdAt: "2026-01-01",
        email: " Studio@Example.com ",
        id: "owner-studio",
        status: "active",
        teamMemberEmails: ["Seat.One@Example.com", " seat.one@example.com ", "seat.two@example.com"],
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

    assert.equal(withTeam.email, "studio@example.com");
    assert.deepEqual(withTeam.teamMemberEmails, ["seat.one@example.com", "seat.two@example.com"]);
    assert.deepEqual(withoutTeam.teamMemberEmails, []);
  });
});

describe("team member collection", () => {
  it("returns seats only for the accounts that were asked for", () => {
    assert.deepEqual(
      collectTeamMemberEmails([studio, solo], ["studio@example.com"]),
      ["seat.one@example.com", "seat.two@example.com"],
    );
    assert.deepEqual(collectTeamMemberEmails([studio, solo], ["solo@example.com"]), []);
    assert.deepEqual(collectTeamMemberEmails([studio, solo], ["stranger@example.com"]), []);
  });

  it("lists every seat on file for the team members audience", () => {
    assert.deepEqual(listAllTeamMemberEmails([studio, solo]), [
      "seat.one@example.com",
      "seat.two@example.com",
    ]);
  });

  it("resolves the team members audience through the shared resolver", () => {
    const emails = resolveAudienceEmails(
      {
        applicationStatusEmails: { approved: [], pending: [], rejected: [] },
        eventRegistrantEmails: [],
        recipients: [studio, solo],
        teamMemberEmails: listAllTeamMemberEmails([studio, solo]),
      },
      draft({ audienceKind: "team_members" }),
    );

    assert.deepEqual(emails, ["seat.one@example.com", "seat.two@example.com"]);
  });
});

describe("campaign recipient assembly", () => {
  const recipients = [studio, solo];

  it("sends to picked accounts only while the team toggle is off", () => {
    const result = buildCampaignRecipients({
      audienceEmails: ["ignored@example.com"],
      draft: draft(),
      pickedMemberEmails: ["studio@example.com"],
      pickedTeamMemberEmails: [],
      recipients,
    });

    assert.deepEqual(result.accountEmails, ["studio@example.com"]);
    assert.deepEqual(result.teamEmails, []);
    assert.deepEqual(result.emails, ["studio@example.com"]);
  });

  it("adds the seats of picked accounts when the team toggle is on, and drops them again when off", () => {
    const on = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft({ includeTeamMembers: true }),
      pickedMemberEmails: ["studio@example.com", "solo@example.com"],
      pickedTeamMemberEmails: [],
      recipients,
    });

    assert.deepEqual(on.teamEmails, ["seat.one@example.com", "seat.two@example.com"]);
    assert.deepEqual(on.emails, [
      "studio@example.com",
      "solo@example.com",
      "seat.one@example.com",
      "seat.two@example.com",
    ]);

    const off = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft({ includeTeamMembers: false }),
      pickedMemberEmails: ["studio@example.com", "solo@example.com"],
      pickedTeamMemberEmails: [],
      recipients,
    });

    assert.deepEqual(off.emails, ["studio@example.com", "solo@example.com"]);
  });

  it("expands the bulk audience when nothing is picked", () => {
    const result = buildCampaignRecipients({
      audienceEmails: ["studio@example.com", "solo@example.com"],
      draft: draft({ includeTeamMembers: true }),
      pickedMemberEmails: [],
      pickedTeamMemberEmails: [],
      recipients,
    });

    assert.deepEqual(result.accountEmails, ["studio@example.com", "solo@example.com"]);
    assert.deepEqual(result.teamEmails, ["seat.one@example.com", "seat.two@example.com"]);
  });

  it("keeps individually picked seats even when their owner is not selected", () => {
    const result = buildCampaignRecipients({
      audienceEmails: ["studio@example.com"],
      draft: draft(),
      pickedMemberEmails: [],
      pickedTeamMemberEmails: ["Seat.One@Example.com"],
      recipients,
    });

    assert.equal(isMemberPickerActive([], ["seat.one@example.com"]), true);
    assert.deepEqual(result.accountEmails, []);
    assert.deepEqual(result.emails, ["seat.one@example.com"]);
  });

  it("never mails the same address twice when a seat is also an account", () => {
    const sharedAddress = recipient({
      email: "seat.one@example.com",
      id: "owner-shared",
      userName: "Seat One",
    });

    const result = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft({ includeTeamMembers: true }),
      pickedMemberEmails: ["studio@example.com", "seat.one@example.com"],
      pickedTeamMemberEmails: ["seat.one@example.com"],
      recipients: [...recipients, sharedAddress],
    });

    assert.deepEqual(result.emails, [
      "studio@example.com",
      "seat.one@example.com",
      "seat.two@example.com",
    ]);
    assert.equal(new Set(result.emails).size, result.emails.length);
  });

  it("still appends extra custom emails to a picked selection", () => {
    const result = buildCampaignRecipients({
      audienceEmails: [],
      draft: draft({ customEmails: "Guest@Example.com, not-an-email" }),
      pickedMemberEmails: ["solo@example.com"],
      pickedTeamMemberEmails: [],
      recipients,
    });

    assert.deepEqual(result.emails, ["solo@example.com", "guest@example.com"]);
  });
});
