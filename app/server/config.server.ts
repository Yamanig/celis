import { db } from "~/db";
import { platformConfigs } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { ItemCondition } from "~/db/schema";
import {
  calculateListingPricing,
  parseListingTiersConfig,
  type ListingPricing,
} from "~/lib/pricing";

const DEFAULTS = {
  listingFeeCents: 100, // $1.00
  commissionBps: 500, // 5%
  platformFeeCents: 0,
};

export async function getPlatformConfig<T>(key: string): Promise<T | undefined> {
  const rows = await db
    .select({ value: platformConfigs.value })
    .from(platformConfigs)
    .where(eq(platformConfigs.key, key))
    .limit(1);
  return rows[0]?.value as T | undefined;
}

export async function getListingFeeCents(): Promise<number> {
  const value = await getPlatformConfig<number>("listing_fee_cents");
  return value ?? DEFAULTS.listingFeeCents;
}

export async function getListingTiersConfig() {
  const raw = await getPlatformConfig<unknown>("listing_tiers");
  return parseListingTiersConfig(raw);
}

export async function getListingPricing(
  priceCents: number,
  condition: ItemCondition
): Promise<ListingPricing> {
  const config = await getListingTiersConfig();
  return calculateListingPricing(priceCents, condition, config);
}
