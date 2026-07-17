import assert from "node:assert/strict";
import test from "node:test";

import {
  getOrganizationStepFields,
  isOrganizationApplication,
  organizationApplicationLabels,
} from "./organization-application";

test("Business and Brand use category-specific application fields", () => {
  assert.equal(isOrganizationApplication("Business"), true);
  assert.equal(isOrganizationApplication("Brand"), true);
  assert.equal(isOrganizationApplication("Professional"), false);

  assert.ok(getOrganizationStepFields("Business", 1).includes("businessProfilePhotoFiles"));
  assert.ok(getOrganizationStepFields("Business", 3).includes("businessPortfolioImages"));
  assert.ok(getOrganizationStepFields("Brand", 2).includes("brandProductCategories"));
  assert.ok(getOrganizationStepFields("Brand", 4).includes("brandMemberBenefits"));
});

test("every organization field label has en, ru, and uk text", () => {
  for (const [field, translations] of Object.entries(organizationApplicationLabels)) {
    assert.ok(translations.en.trim(), `${field} is missing English text`);
    assert.ok(translations.ru.trim(), `${field} is missing Russian text`);
    assert.ok(translations.uk.trim(), `${field} is missing Ukrainian text`);
  }
});
