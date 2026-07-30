import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTeamAccountSetupUrl,
  buildTeamInvitationEmail,
  getTeamInvitationBaseUrl,
} from "./team-invitation";

test("team invitation setup URL uses the dashboard origin and normalized email", () => {
  const setupUrl = buildTeamAccountSetupUrl({
    email: "  Member@Example.COM ",
    environment: {
      DASHBOARD_URL: "https://members.example.com/",
      FRONTEND_URL: "https://www.example.com",
      NODE_ENV: "production",
    },
  });

  assert.equal(
    setupUrl,
    "https://members.example.com/team-invite?email=member%40example.com",
  );
});

test("team invitation base URL rejects missing production configuration", () => {
  assert.throws(
    () =>
      getTeamInvitationBaseUrl({
        DASHBOARD_URL: "",
        FRONTEND_URL: "",
        NODE_ENV: "production",
      }),
    /not configured/,
  );
});

test("team invitation email includes account setup and escapes member data", () => {
  const email = buildTeamInvitationEmail({
    email: "member@example.com",
    fullName: "<Taylor>",
    role: "Lead & Trainer",
    teamName: "Studio <One>",
    certificateNumber: "TEAM-01-20260730-A1B2",
    setupUrl: "https://members.example.com/team-invite?email=member%40example.com",
  });

  assert.equal(email.to, "member@example.com");
  assert.match(email.subject, /Studio <One>/);
  assert.match(email.html, /TEAM-01-20260730-A1B2/);
  assert.match(email.html, /Set up my team member account/);
  assert.doesNotMatch(email.html, /<Taylor>/);
  assert.match(email.html, /Lead &amp; Trainer/);
});
