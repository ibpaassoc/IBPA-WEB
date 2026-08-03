import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { AdminTeamMember } from "../types/admin-team.types";
import { TeamMemberCard } from "./AdminTeamMemberList";

function member(overrides: Partial<AdminTeamMember> = {}): AdminTeamMember {
  return {
    id: "member-id",
    credentials: "TEAM-2-20260731-ABCD",
    avatarUrl: null,
    fullName: "Alexandra Very Long Team Member Name",
    email: "alexandra.long.email.address@example.com",
    role: "Senior esthetician, laser professional, educator, and studio operations lead",
    accessStatus: "active",
    joinedAt: null,
    ...overrides,
  };
}

function renderMember(overrides: Partial<AdminTeamMember> = {}) {
  return renderToStaticMarkup(createElement(TeamMemberCard, { member: member(overrides) }));
}

describe("admin team member card", () => {
  it("renders Identity, Role, and one fixed Access area without seat or registration fields", () => {
    const markup = renderMember();

    assert.match(markup, /Alexandra Very Long Team Member Name/);
    assert.match(markup, /alexandra\.long\.email\.address@example\.com/);
    assert.match(markup, /TEAM-2-20260731-ABCD/);
    assert.match(markup, /Senior esthetician, laser professional, educator, and studio operations lead/);
    assert.doesNotMatch(markup, /Seat type/);
    assert.doesNotMatch(markup, /Registration/);
    assert.equal(markup.match(/>Access</g)?.length, 1);
    assert.equal(markup.match(/>Active</g)?.length, 1);
    assert.match(markup, /sm:grid-cols-\[minmax\(13rem,1fr\)_minmax\(0,1\.35fr\)_7\.5rem\]/);
    assert.match(markup, /sm:border-l/);
  });

  it("uses a neutral fallback instead of inventing a missing credential", () => {
    const markup = renderMember({ credentials: null });

    assert.match(markup, />Not assigned</);
    assert.doesNotMatch(markup, /TEAM-2-20260731-ABCD/);
  });

  it("renders all supported access states exactly once", () => {
    for (const accessStatus of ["active", "invited", "inactive", "removed"]) {
      const markup = renderMember({ accessStatus });
      const label = `${accessStatus[0].toUpperCase()}${accessStatus.slice(1)}`;

      assert.equal(markup.match(/>Access</g)?.length, 1);
      assert.equal(markup.match(new RegExp(`>${label}<`, "g"))?.length, 1);
    }
  });
});

describe("admin team member card selection", () => {
  it("stays read-only when no selection is provided", () => {
    const markup = renderMember();

    assert.doesNotMatch(markup, /aria-pressed/);
    assert.doesNotMatch(markup, /as a recipient/);
  });

  it("renders a toggle for a selectable seat and reflects the checked state", () => {
    const unchecked = renderToStaticMarkup(
      createElement(TeamMemberCard, {
        member: member(),
        selection: { isSelected: false, onToggle: () => {} },
      }),
    );
    const checked = renderToStaticMarkup(
      createElement(TeamMemberCard, {
        member: member(),
        selection: { isSelected: true, onToggle: () => {} },
      }),
    );

    assert.match(unchecked, /aria-pressed="false"/);
    assert.match(unchecked, /Add alexandra\.long\.email\.address@example\.com as a recipient/);
    assert.doesNotMatch(unchecked, /bg-\[#1F5D8F\] text-white/);

    assert.match(checked, /aria-pressed="true"/);
    assert.match(checked, /Remove alexandra\.long\.email\.address@example\.com as a recipient/);
    assert.match(checked, /bg-\[#1F5D8F\] text-white/);
  });
});
