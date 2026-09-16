import assert from "node:assert/strict";
import test from "node:test";

import {
  PromoCodeError,
  createPromoCode,
  deletePromoCode,
  listDiscountEnvKeys,
  listPromoCodes,
  normalizePromoCodeInput,
  resolveStripeCouponId,
  updatePromoCode,
} from "./promo-code.service";

/**
 * These tests only ever touch the single `promo_codes` settings key, so an
 * in-memory stand-in for the two calls the repository makes — one select, one
 * upsert — is enough to exercise the whole service.
 */
function fakeDb() {
  let row: { key: string; value: Record<string, unknown> } | null = null;

  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (row ? [row] : []),
        }),
      }),
    }),
    insert: () => ({
      values: (value: { key: string; value: Record<string, unknown> }) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            row = { key: value.key, value: value.value };
            return [row];
          },
        }),
      }),
    }),
  };

  return db as unknown as Parameters<typeof listPromoCodes>[0];
}

test("normalizes what an applicant types into a comparable code", () => {
  assert.equal(normalizePromoCodeInput(" bbf member 2026 "), "BBFMEMBER2026");
  assert.equal(normalizePromoCodeInput(42), "");
  assert.equal(normalizePromoCodeInput("a".repeat(60)).length, 40);
});

test("resolves a coupon id only from a named environment variable", () => {
  process.env.PROMO_TEST_COUPON = " cpn_123 ";
  assert.equal(resolveStripeCouponId({ discountEnvKey: "PROMO_TEST_COUPON" }), "cpn_123");
  assert.equal(resolveStripeCouponId({ discountEnvKey: "PROMO_TEST_MISSING" }), null);
  assert.equal(resolveStripeCouponId({ discountEnvKey: null }), null);
  delete process.env.PROMO_TEST_COUPON;
});

test("offers only Stripe discount variables as coupon choices", () => {
  process.env.STRIPE_UNIT_TEST_DISCOUNT = "cpn_unit";
  const keys = listDiscountEnvKeys();
  assert.ok(keys.includes("STRIPE_UNIT_TEST_DISCOUNT"));
  assert.ok(!keys.includes("DATABASE_URL"));
  delete process.env.STRIPE_UNIT_TEST_DISCOUNT;
});

test("seeds the forum code on first read", async () => {
  const db = fakeDb();
  const items = await listPromoCodes(db);

  assert.equal(items.length, 1);
  assert.equal(items[0].code, "BBFMEMBER2026");
  assert.equal(items[0].enabled, true);
  assert.equal(items[0].discountEnvKey, "STRIPE_FORUM_DISCOUNT");
});

test("rejects a duplicate code and a code that is too short", async () => {
  const db = fakeDb();
  await listPromoCodes(db);

  await assert.rejects(
    () => createPromoCode(db, { code: "BBFMEMBER2026" }),
    (error: PromoCodeError) => error.status === 409,
  );
  await assert.rejects(
    () => createPromoCode(db, { code: "AB" }),
    (error: PromoCodeError) => error.status === 400,
  );
});

test("refuses to point a promo code at an unrelated environment variable", async () => {
  const db = fakeDb();
  await listPromoCodes(db);

  await assert.rejects(
    () => createPromoCode(db, { code: "LEAK", discountEnvKey: "DATABASE_URL" }),
    /not a known Stripe discount environment variable/,
  );
});

test("renaming a code keeps its identity, history, and settings", async () => {
  const db = fakeDb();
  const [seeded] = await listPromoCodes(db);

  const renamed = await updatePromoCode(db, seeded.id, { code: "forum 2027" });

  assert.equal(renamed.id, seeded.id);
  assert.equal(renamed.code, "FORUM2027");
  assert.equal(renamed.discountEnvKey, seeded.discountEnvKey);
  assert.equal(renamed.createdAt, seeded.createdAt);

  const items = await listPromoCodes(db);
  assert.deepEqual(items.map((item) => item.code), ["FORUM2027"]);
});

test("turning a code off persists, and deleting it removes only that code", async () => {
  const db = fakeDb();
  const [seeded] = await listPromoCodes(db);
  const extra = await createPromoCode(db, { code: "EARLYBIRD", label: "Early bird" });

  await updatePromoCode(db, seeded.id, { enabled: false });
  const afterToggle = await listPromoCodes(db);
  assert.equal(afterToggle.find((item) => item.id === seeded.id)?.enabled, false);
  assert.equal(afterToggle.find((item) => item.id === extra.id)?.enabled, true);

  await deletePromoCode(db, extra.id);
  assert.deepEqual((await listPromoCodes(db)).map((item) => item.id), [seeded.id]);

  await assert.rejects(
    () => deletePromoCode(db, extra.id),
    (error: PromoCodeError) => error.status === 404,
  );
});

test("drops stored entries that no longer carry a usable code", async () => {
  const db = fakeDb();
  await listPromoCodes(db);
  await createPromoCode(db, { code: "KEEPME" });

  // Simulate a hand-edited settings row containing junk alongside real codes.
  const { writeSiteSetting, SITE_SETTINGS_KEYS } = await import("./site-settings.repository");
  const items = await listPromoCodes(db);
  await writeSiteSetting(db, {
    key: SITE_SETTINGS_KEYS.promoCodes,
    value: { items: [...items, { label: "no code" }, null, "nonsense"] },
  });

  const cleaned = await listPromoCodes(db);
  assert.deepEqual(cleaned.map((item) => item.code), ["BBFMEMBER2026", "KEEPME"]);
});
