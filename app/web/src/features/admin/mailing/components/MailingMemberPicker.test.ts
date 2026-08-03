import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MailingRecipient } from "../types/mailing.types";
import { MailingMemberPicker } from "./MailingMemberPicker";

const studio: MailingRecipient = {
  cardName: "Business Membership",
  email: "studio@example.com",
  id: "owner-studio",
  membershipCategory: "Business",
  teamMemberEmails: ["seat.one@example.com", "seat.two@example.com"],
  userName: "Studio Owner",
};

const solo: MailingRecipient = {
  cardName: "Professional Membership",
  email: "solo@example.com",
  id: "owner-solo",
  membershipCategory: "Professional",
  teamMemberEmails: [],
  userName: "Solo Member",
};

function renderPicker(
  overrides: Partial<Parameters<typeof MailingMemberPicker>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(MailingMemberPicker, {
      includeTeamMembers: false,
      onChange: () => {},
      onTeamChange: () => {},
      recipients: [studio, solo],
      selectedEmails: [],
      selectedTeamEmails: [],
      ...overrides,
    }),
  );
}

describe("mailing member picker", () => {
  it("offers a collapsed team dropdown only for accounts that have seats", () => {
    const markup = renderPicker();

    assert.equal(markup.match(/aria-expanded="false"/g)?.length, 1);
    assert.match(markup, /Team<span class="tabular-nums">2<\/span>/);
    assert.match(markup, /Add studio@example\.com as a recipient/);
    assert.match(markup, /Add solo@example\.com as a recipient/);
    // The roster only loads once a dropdown is opened.
    assert.doesNotMatch(markup, /Loading team members/);
  });

  it("marks a picked account and keeps the others unpicked", () => {
    const markup = renderPicker({ selectedEmails: ["studio@example.com"] });

    assert.match(markup, /aria-label="Remove studio@example\.com[^>]*aria-pressed="true"/);
    assert.match(markup, /aria-label="Add solo@example\.com[^>]*aria-pressed="false"/);
  });

  it("reports separately picked team members in the selection summary", () => {
    const none = renderPicker();
    const one = renderPicker({ selectedTeamEmails: ["seat.one@example.com"] });
    const two = renderPicker({
      selectedTeamEmails: ["seat.one@example.com", "seat.two@example.com"],
    });

    assert.doesNotMatch(none, /team members? picked/);
    assert.match(one, /1 team member picked/);
    assert.match(two, /2 team members picked/);
  });

  it("still offers Clear all when only team members are picked", () => {
    const markup = renderPicker({ selectedTeamEmails: ["seat.one@example.com"] });

    assert.match(markup, />Clear all</);
  });

  it("renders an empty state instead of cards when no recipients loaded", () => {
    const markup = renderPicker({ recipients: [] });

    assert.match(markup, /No members loaded yet\./);
    assert.doesNotMatch(markup, /aria-expanded/);
  });
});
