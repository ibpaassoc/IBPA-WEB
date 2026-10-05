import assert from "node:assert/strict";
import test from "node:test";

import { isInstagramProfile } from "./instagram";

test("accepts Instagram handles and profile links", () => {
  for (const value of [
    "@anna.brows",
    "anna_brows",
    "  @anna.brows  ",
    "instagram.com/anna.brows",
    "https://instagram.com/anna.brows",
    "https://www.instagram.com/anna.brows/?hl=en",
  ]) {
    assert.equal(isInstagramProfile(value), true, value);
  }
});

test("rejects empty values and other social links", () => {
  for (const value of ["", "   ", "see my page", "https://facebook.com/anna", "https://instagram.com/", undefined, null]) {
    assert.equal(isInstagramProfile(value), false, String(value));
  }
});
