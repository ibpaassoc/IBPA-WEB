import assert from "node:assert/strict";
import test from "node:test";

import { getAllEmailsFromClerkUser } from "./clerk";

test("getAllEmailsFromClerkUser excludes explicitly unverified addresses", () => {
  assert.deepEqual(
    getAllEmailsFromClerkUser({
      emailAddresses: [
        {
          emailAddress: " Member@Example.com ",
          verification: { status: "verified" },
        },
        {
          emailAddress: "invited@example.com",
          verification: { status: "unverified" },
        },
        {
          emailAddress: "legacy@example.com",
        },
      ],
    }),
    ["member@example.com", "legacy@example.com"],
  );
});

test("getAllEmailsFromClerkUser normalizes and deduplicates verified addresses", () => {
  assert.deepEqual(
    getAllEmailsFromClerkUser({
      emailAddresses: [
        {
          emailAddress: "MEMBER@example.com",
          verification: { status: "verified" },
        },
        {
          emailAddress: "member@example.com",
          verification: { status: "verified" },
        },
        {
          emailAddress: "",
          verification: { status: "verified" },
        },
      ],
    }),
    ["member@example.com"],
  );
});
