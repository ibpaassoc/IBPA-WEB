import crypto from "crypto";
import { requireDb } from "@/lib/db";
import { describeCoupon } from "./stripe-coupon";
import {
  SITE_SETTINGS_KEYS,
  readSiteSetting,
  writeSiteSetting,
} from "./site-settings.repository";
import type {
  PromoCode,
  PromoCodeSettings,
  PublicPromoCode,
} from "./promo-code.types";

type DbClient = ReturnType<typeof requireDb>;

export const PROMO_CODE_MAX_LENGTH = 40;
const LABEL_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 400;
const SETTINGS_DESCRIPTION =
  "Promo codes offered on the membership application. The linked Stripe coupon is applied when an administrator approves the application for payment.";

/**
 * Seeded the first time the settings key is read, so a fresh environment has a
 * working code without a manual step. Later edits live in the database and are
 * never overwritten by this default.
 */
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: "bbf-2026",
    code: "BBFMEMBER2026",
    label: "Beauty Business Forum 2026",
    description:
      "Forum attendee rate. Applied to your membership invoice once your application is approved.",
    enabled: true,
    discountEnvKey: "STRIPE_FORUM_DISCOUNT",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

/** Environment variables that may hold a Stripe coupon id, by name only. */
export function listDiscountEnvKeys(): string[] {
  const keys = Object.keys(process.env).filter((name) =>
    /^STRIPE_.*(DISCOUNT|COUPON)/.test(name),
  );

  for (const promo of DEFAULT_PROMO_CODES) {
    if (promo.discountEnvKey && !keys.includes(promo.discountEnvKey)) {
      keys.push(promo.discountEnvKey);
    }
  }

  return keys.sort();
}

/** The Stripe coupon id a promo code points at, or null when it is unset. */
export function resolveStripeCouponId(
  promoCode: Pick<PromoCode, "discountEnvKey">,
): string | null {
  if (!promoCode.discountEnvKey) {
    return null;
  }

  const value = process.env[promoCode.discountEnvKey];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizePromoCodeInput(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/\s+/g, "").slice(0, PROMO_CODE_MAX_LENGTH)
    : "";
}

function textValue(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizePromoCode(value: unknown): PromoCode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const code = normalizePromoCodeInput(record.code);
  if (!code) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : crypto.randomUUID(),
    code,
    label: textValue(record.label, LABEL_MAX_LENGTH) || code,
    description: textValue(record.description, DESCRIPTION_MAX_LENGTH),
    enabled: record.enabled !== false,
    discountEnvKey:
      typeof record.discountEnvKey === "string" && record.discountEnvKey.trim()
        ? record.discountEnvKey.trim()
        : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : now,
  };
}

export async function listPromoCodes(db: DbClient): Promise<PromoCode[]> {
  const stored = await readSiteSetting<PromoCodeSettings>(db, SITE_SETTINGS_KEYS.promoCodes);

  if (!stored) {
    await writeSiteSetting(db, {
      key: SITE_SETTINGS_KEYS.promoCodes,
      value: { items: DEFAULT_PROMO_CODES },
      description: SETTINGS_DESCRIPTION,
    });
    return DEFAULT_PROMO_CODES;
  }

  const items = Array.isArray(stored.items) ? stored.items : [];
  return items
    .map((item) => sanitizePromoCode(item))
    .filter((item): item is PromoCode => item !== null);
}

async function savePromoCodes(db: DbClient, items: PromoCode[], updatedBy?: string | null) {
  await writeSiteSetting(db, {
    key: SITE_SETTINGS_KEYS.promoCodes,
    value: { items },
    description: SETTINGS_DESCRIPTION,
    updatedBy: updatedBy ?? null,
  });

  return items;
}

export class PromoCodeError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PromoCodeError";
    this.status = status;
  }
}

type PromoCodeInput = {
  code?: unknown;
  label?: unknown;
  description?: unknown;
  enabled?: unknown;
  discountEnvKey?: unknown;
};

function assertUniqueCode(items: PromoCode[], code: string, ignoreId?: string) {
  if (items.some((item) => item.code === code && item.id !== ignoreId)) {
    throw new PromoCodeError(`The code ${code} already exists.`, 409);
  }
}

function readDiscountEnvKey(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const key = value.trim();
  if (!listDiscountEnvKeys().includes(key)) {
    throw new PromoCodeError(`${key} is not a known Stripe discount environment variable.`);
  }

  return key;
}

export async function createPromoCode(
  db: DbClient,
  input: PromoCodeInput,
  updatedBy?: string | null,
): Promise<PromoCode> {
  const code = normalizePromoCodeInput(input.code);
  if (code.length < 3) {
    throw new PromoCodeError("A promo code needs at least 3 characters.");
  }

  const items = await listPromoCodes(db);
  assertUniqueCode(items, code);

  const now = new Date().toISOString();
  const created: PromoCode = {
    id: crypto.randomUUID(),
    code,
    label: textValue(input.label, LABEL_MAX_LENGTH) || code,
    description: textValue(input.description, DESCRIPTION_MAX_LENGTH),
    enabled: input.enabled !== false,
    discountEnvKey: readDiscountEnvKey(input.discountEnvKey),
    createdAt: now,
    updatedAt: now,
  };

  await savePromoCodes(db, [...items, created], updatedBy);
  return created;
}

export async function updatePromoCode(
  db: DbClient,
  id: string,
  input: PromoCodeInput,
  updatedBy?: string | null,
): Promise<PromoCode> {
  const items = await listPromoCodes(db);
  const existing = items.find((item) => item.id === id);
  if (!existing) {
    throw new PromoCodeError("Promo code not found.", 404);
  }

  const next: PromoCode = { ...existing, updatedAt: new Date().toISOString() };

  if (input.code !== undefined) {
    const code = normalizePromoCodeInput(input.code);
    if (code.length < 3) {
      throw new PromoCodeError("A promo code needs at least 3 characters.");
    }
    assertUniqueCode(items, code, id);
    next.code = code;
  }

  if (input.label !== undefined) {
    next.label = textValue(input.label, LABEL_MAX_LENGTH) || next.code;
  }

  if (input.description !== undefined) {
    next.description = textValue(input.description, DESCRIPTION_MAX_LENGTH);
  }

  if (input.enabled !== undefined) {
    next.enabled = input.enabled === true;
  }

  if (input.discountEnvKey !== undefined) {
    next.discountEnvKey = readDiscountEnvKey(input.discountEnvKey);
  }

  await savePromoCodes(
    db,
    items.map((item) => (item.id === id ? next : item)),
    updatedBy,
  );

  return next;
}

export async function deletePromoCode(db: DbClient, id: string, updatedBy?: string | null) {
  const items = await listPromoCodes(db);
  if (!items.some((item) => item.id === id)) {
    throw new PromoCodeError("Promo code not found.", 404);
  }

  await savePromoCodes(
    db,
    items.filter((item) => item.id !== id),
    updatedBy,
  );
}

/**
 * Why a promo code can or cannot discount an invoice right now. The three
 * failure modes are genuinely different problems with different fixes, so they
 * stay distinct instead of collapsing into one "missing":
 *
 * - `unlinked`  — no environment variable is chosen for this code.
 * - `unset`     — the chosen variable holds no value on this server.
 * - `rejected`  — the variable holds a coupon id Stripe will not accept.
 */
export async function describePromoCodeDiscount(
  promoCode: Pick<PromoCode, "discountEnvKey">,
): Promise<{ status: "linked" | "unlinked" | "unset" | "rejected"; message: string | null }> {
  if (!promoCode.discountEnvKey) {
    return { status: "unlinked", message: null };
  }

  const couponId = resolveStripeCouponId(promoCode);
  if (!couponId) {
    return {
      status: "unset",
      message: `${promoCode.discountEnvKey} is not set on this server.`,
    };
  }

  const check = await describeCoupon(couponId);
  return check.usable
    ? { status: "linked", message: null }
    : { status: "rejected", message: check.reason };
}

/** Whether Stripe will actually honor the coupon behind a promo code. */
export async function hasUsableCoupon(promoCode: Pick<PromoCode, "discountEnvKey">) {
  return (await describePromoCodeDiscount(promoCode)).status === "linked";
}

/**
 * The code an applicant typed, if it is currently enabled and backed by a
 * coupon Stripe will honor. Unknown, disabled, and misconfigured codes return
 * null so the form never promises a discount we cannot honor.
 */
export async function findRedeemablePromoCode(
  db: DbClient,
  code: unknown,
): Promise<PromoCode | null> {
  const normalized = normalizePromoCodeInput(code);
  if (!normalized) {
    return null;
  }

  const items = await listPromoCodes(db);
  const match = items.find((item) => item.code === normalized);

  if (!match || !match.enabled || !(await hasUsableCoupon(match))) {
    return null;
  }

  return match;
}

export function toPublicPromoCode(promoCode: PromoCode): PublicPromoCode {
  return {
    code: promoCode.code,
    description: promoCode.description,
    label: promoCode.label,
  };
}
