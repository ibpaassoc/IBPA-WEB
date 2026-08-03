import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { AdminTeamMember } from "../../teams/types/admin-team.types";
import { MailingTeamSeatList } from "./MailingTeamPicker";

function seat(overrides: Partial<AdminTeamMember> = {}): AdminTeamMember {
  return {
    accessStatus: "active",
    avatarUrl: null,
    credentials: "TEAM-2-20260731-A1B2",
    email: "anna@example.com",
    fullName: "Anna Kovalenko",
    id: "m1",
    joinedAt: null,
    role: "Senior esthetician",
    ...overrides,
  };
}

function render(members: AdminTeamMember[], selectedEmails: string[] = []) {
  return renderToStaticMarkup(
    createElement(MailingTeamSeatList, { members, onChange: () => {}, selectedEmails }),
  );
}

describe("mailing team seat list", () => {
  it("renders a compact row per seat, not the full roster card", () => {
    const markup = render([seat()]);

    // Compact row geometry: small avatar, tight padding, small check.
    assert.match(markup, /size-8 shrink-0/);
    assert.match(markup, /rounded-xl border px-2\.5 py-2/);
    assert.match(markup, /size-5 shrink-0/);
    // None of the full roster card's structure.
    assert.doesNotMatch(markup, /min-h-28/);
    assert.doesNotMatch(markup, /sm:grid-cols-\[minmax/);
    assert.doesNotMatch(markup, />Role</);
    assert.doesNotMatch(markup, />Access</);
    assert.doesNotMatch(markup, /TEAM-2-20260731-A1B2/);
  });

  it("shows the name with email and role on one secondary line", () => {
    const markup = render([seat()]);

    assert.match(markup, /Anna Kovalenko/);
    assert.match(markup, /anna@example\.com/);
    assert.match(markup, /Senior esthetician/);
  });

  it("omits the role separator when a seat has no role", () => {
    const markup = render([seat({ role: "" })]);

    assert.doesNotMatch(markup, /·/);
  });

  it("marks the picked seats and leaves the others unpicked", () => {
    const markup = render(
      [seat(), seat({ email: "marta@example.com", fullName: "Marta D.", id: "m2" })],
      ["anna@example.com"],
    );

    assert.match(markup, /aria-label="Remove anna@example\.com[^>]*aria-pressed="true"/);
    assert.match(markup, /aria-label="Add marta@example\.com[^>]*aria-pressed="false"/);
  });

  it("shows a removed seat without a toggle", () => {
    const markup = render([seat({ accessStatus: "removed", email: "former@example.com" })]);

    assert.doesNotMatch(markup, /aria-pressed/);
    assert.match(markup, />Removed</);
  });

  it("offers Select all until everything selectable is picked, then Clear all", () => {
    const members = [
      seat(),
      seat({ accessStatus: "removed", email: "former@example.com", id: "m4" }),
    ];

    assert.match(render(members), />Select all</);
    // The removed seat is not selectable, so it must not keep the bulk control
    // stuck on "Select all".
    assert.match(render(members, ["anna@example.com"]), />Clear all</);
  });

  it("hides the bulk control when no seat can be picked", () => {
    const markup = render([seat({ accessStatus: "removed" })]);

    assert.doesNotMatch(markup, />Select all</);
    assert.doesNotMatch(markup, />Clear all</);
  });

  it("counts every seat, including removed ones", () => {
    assert.match(render([seat()]), /1 team member</);
    assert.match(
      render([seat(), seat({ accessStatus: "removed", email: "x@example.com", id: "m4" })]),
      /2 team members</,
    );
  });

  it("renders an empty state for an account with no seats", () => {
    const markup = render([]);

    assert.match(markup, /No team members yet\./);
    assert.doesNotMatch(markup, /aria-pressed/);
  });
});
