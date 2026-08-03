import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MailingRecipient } from "../types/mailing.types";
import { MailingMemberPicker } from "./MailingMemberPicker";

const studio: MailingRecipient = {
  accountType: "business",
  applicationType: "MEMBER",
  cardName: "Business",
  email: "studio@example.com",
  id: "owner-studio",
  membershipCategory: "Business",
  teamMemberEmails: ["seat.one@example.com", "seat.two@example.com"],
  userName: "Studio Owner",
};

const partner: MailingRecipient = {
  accountType: "partner",
  applicationType: "PARTNER",
  cardName: "Partner",
  email: "partner@example.com",
  id: "owner-partner",
  membershipCategory: "Associate",
  teamMemberEmails: ["agency.seat@example.com"],
  userName: "Partner Account",
};

const solo: MailingRecipient = {
  accountType: "individual",
  applicationType: "MEMBER",
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
      onChange: () => {},
      onTeamChange: () => {},
      recipients: [studio, partner, solo],
      selectedEmails: [],
      selectedTeamEmails: [],
      ...overrides,
    }),
  );
}

describe("mailing member picker", () => {
  it("offers a collapsed Team dropdown for Business and Partner accounts only", () => {
    const markup = renderPicker();

    assert.equal(markup.match(/aria-expanded="false"/g)?.length, 2);
    assert.match(markup, /Add studio@example\.com as a recipient/);
    assert.match(markup, /Add partner@example\.com as a recipient/);
    assert.match(markup, /Add solo@example\.com as a recipient/);
    // The roster only loads once a dropdown is opened.
    assert.doesNotMatch(markup, /Loading team members/);
  });

  it("uses the same Team control markup as the applications queue", () => {
    const markup = renderPicker({ recipients: [studio] });

    assert.match(markup, /lucide-users size-3\.5/);
    assert.match(markup, /lucide-chevron-down size-3 transition-transform/);
    assert.match(
      markup,
      /inline-flex h-8 shrink-0 items-center gap-1\.5 rounded-xl border px-2\.5 text-xs font-semibold shadow-sm/,
    );
  });

  it("marks a picked account and keeps the others unpicked", () => {
    const markup = renderPicker({ selectedEmails: ["studio@example.com"] });

    assert.match(markup, /aria-label="Remove studio@example\.com[^>]*aria-pressed="true"/);
    assert.match(markup, /aria-label="Add solo@example\.com[^>]*aria-pressed="false"/);
  });

  it("reports picked team members in the selection summary", () => {
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
