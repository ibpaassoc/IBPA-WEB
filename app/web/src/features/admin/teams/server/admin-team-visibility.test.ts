import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  handleTeamControlClick,
  isTeamApplication,
  toggleExpandedTeamKeys,
} from "../../applications/server/application-admin.service";
import type { AdminApplicationRecord } from "../../applications/types/application-admin.types";
import {
  isOrganizationMember,
  resolveMemberTab,
} from "../../members/server/members-admin.service";

function application(
  kind: "member" | "partner",
  membershipPackage: string,
): AdminApplicationRecord {
  return {
    id: `${kind}-id`,
    kind,
    applicantName: "Applicant",
    applicantEmail: "applicant@example.com",
    applicantType: kind === "partner" ? "Partner" : "Individual",
    membershipPackage,
    status: "pending",
    statusLabel: "Pending",
    statusTone: "neutral",
    paymentStatus: "not_requested",
    paymentStatusLabel: "Not requested",
    paymentStatusTone: "neutral",
    submittedAt: "2026-01-01T00:00:00.000Z",
    raw: {} as AdminApplicationRecord["raw"],
  };
}

describe("application Team control visibility", () => {
  it("shows for Business and every Partner application, but not individual or Brand categories", () => {
    assert.equal(isTeamApplication(application("member", "Business")), true);
    assert.equal(isTeamApplication(application("partner", "Associate")), true);
    assert.equal(isTeamApplication(application("member", "Professional")), false);
    assert.equal(isTeamApplication(application("member", "Trainer")), false);
    assert.equal(isTeamApplication(application("member", "Brand")), false);
  });

  it("toggles a team section without mutating other expanded application keys", () => {
    const current = new Set(["member:first"]);
    const opened = toggleExpandedTeamKeys(current, "partner:second");
    const closed = toggleExpandedTeamKeys(opened, "partner:second");

    assert.deepEqual([...current], ["member:first"]);
    assert.deepEqual([...opened], ["member:first", "partner:second"]);
    assert.deepEqual([...closed], ["member:first"]);
  });

  it("stops row propagation and invokes only the Team toggle callback", () => {
    const record = application("member", "Business");
    let propagationStopped = false;
    let toggledRecord: AdminApplicationRecord | null = null;
    let reviewOpened = false;

    handleTeamControlClick(
      { stopPropagation: () => { propagationStopped = true; } },
      record,
      (value) => { toggledRecord = value; },
    );
    if (!propagationStopped) reviewOpened = true;

    assert.equal(propagationStopped, true);
    assert.equal(toggledRecord, record);
    assert.equal(reviewOpened, false);
  });
});

describe("member Team tab visibility and switching", () => {
  it("recognizes paid Business and Partner owner records", () => {
    assert.equal(
      isOrganizationMember({ accountType: "business", applicationType: "MEMBER", membershipCategory: "Business" }),
      true,
    );
    assert.equal(
      isOrganizationMember({ accountType: "partner", applicationType: "PARTNER", membershipCategory: "Associate" }),
      true,
    );
    assert.equal(
      isOrganizationMember({ accountType: "individual", applicationType: "MEMBER", membershipCategory: "Professional" }),
      false,
    );
  });

  it("prevents stale Team content when switching from an organization to an individual", () => {
    const individual = {
      accountType: "individual" as const,
      applicationType: "MEMBER" as const,
      membershipCategory: "Professional",
    };
    const business = {
      accountType: "business" as const,
      applicationType: "MEMBER" as const,
      membershipCategory: "Business",
    };

    assert.equal(resolveMemberTab(business, "team"), "team");
    assert.equal(resolveMemberTab(individual, "team"), "profile");
    assert.equal(resolveMemberTab(individual, "certificate"), "certificate");
  });
});
