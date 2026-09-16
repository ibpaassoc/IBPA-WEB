import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreSiteSettings } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

/** Settings keys owned by the product. Add a key here before writing to it. */
export const SITE_SETTINGS_KEYS = {
  promoCodes: "promo_codes",
} as const;

export type SiteSettingsKey = (typeof SITE_SETTINGS_KEYS)[keyof typeof SITE_SETTINGS_KEYS];

export async function readSiteSetting<T extends Record<string, unknown>>(
  db: DbClient,
  key: SiteSettingsKey,
): Promise<T | null> {
  const [row] = await db
    .select()
    .from(coreSiteSettings)
    .where(eq(coreSiteSettings.key, key))
    .limit(1);

  return (row?.value as T | undefined) ?? null;
}

export async function writeSiteSetting<T extends Record<string, unknown>>(
  db: DbClient,
  input: {
    key: SiteSettingsKey;
    value: T;
    description?: string | null;
    updatedBy?: string | null;
  },
): Promise<T> {
  const [row] = await db
    .insert(coreSiteSettings)
    .values({
      key: input.key,
      value: input.value,
      description: input.description ?? null,
      updatedBy: input.updatedBy ?? null,
    })
    .onConflictDoUpdate({
      target: coreSiteSettings.key,
      set: {
        value: input.value,
        description: input.description ?? null,
        updatedBy: input.updatedBy ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return (row?.value as T | undefined) ?? input.value;
}
