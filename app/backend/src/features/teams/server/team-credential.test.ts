import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCredential,
  formatCredentialDate,
  formatTeamNumber,
  generateTeamMemberCredential,
} from "./team-credential";

test("formatTeamNumber zero-pads to at least two digits", () => {
  assert.equal(formatTeamNumber(1), "01");
  assert.equal(formatTeamNumber(2), "02");
  assert.equal(formatTeamNumber(12), "12");
  assert.equal(formatTeamNumber(123), "123");
});

test("formatCredentialDate renders YYYYMMDD in UTC", () => {
  assert.equal(formatCredentialDate(new Date("2026-07-20T00:00:00.000Z")), "20260720");
  assert.equal(formatCredentialDate(new Date("2026-01-05T23:59:59.000Z")), "20260105");
});

test("generateTeamMemberCredential matches the TEAM-<n>-<date>-<hash> format", () => {
  const credential = generateTeamMemberCredential({
    teamNumber: 1,
    date: new Date("2026-07-20T12:00:00.000Z"),
    hash: "4A8F",
  });
  assert.equal(credential, "TEAM-01-20260720-4A8F");
  assert.match(credential, /^TEAM-\d{2,}-\d{8}-[0-9A-F]{4}$/);
});

test("generateTeamMemberCredential produces a 4-hex-char suffix by default", () => {
  const credential = generateTeamMemberCredential({
    teamNumber: 2,
    date: new Date("2026-07-20T12:00:00.000Z"),
  });
  assert.match(credential, /^TEAM-02-20260720-[0-9A-F]{4}$/);
});

test("classifyCredential routes TEAM codes to the team lookup and everything else to cert", () => {
  assert.equal(classifyCredential("TEAM-01-20260720-4A8F"), "team");
  assert.equal(classifyCredential("team-01-20260720-4a8f"), "team");
  assert.equal(classifyCredential("  TEAM-02-20260720-9BCC  "), "team");
  assert.equal(classifyCredential("CERT-20260720-1A2B"), "cert");
  assert.equal(classifyCredential("cert-20260720-1a2b"), "cert");
  assert.equal(classifyCredential("SOMETHING-ELSE"), "cert");
});
