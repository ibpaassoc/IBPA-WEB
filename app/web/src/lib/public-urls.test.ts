import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  getBackendUrl,
  getDashboardUrl,
  getLandingOrigin,
} from "./public-urls";

const originalValues = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalValues)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

test("public origins remove whitespace and trailing slashes", () => {
  process.env.NEXT_PUBLIC_SITE_URL = " https://www.example.com/// ";
  assert.equal(getLandingOrigin(), "https://www.example.com");
});

test("backend and dashboard URLs join paths with exactly one slash", () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/";
  process.env.NEXT_PUBLIC_DASHBOARD_URL = "https://members.example.com///";

  assert.equal(
    getBackendUrl("/api/content"),
    "https://api.example.com/api/content",
  );
  assert.equal(
    getDashboardUrl("team-invite"),
    "https://members.example.com/team-invite",
  );
});
