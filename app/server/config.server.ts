import { db } from "~/db";
import { platformConfigs, categoryFees } from "~/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import type { ItemCondition } from "~/db/schema";
import {
  calculateListingPricing,
  parseListingTiersConfig,
  type ListingPricing,
  type MonetizationModel,
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

export async function getPlatformMonetizationModel(): Promise<MonetizationModel> {
  const value = await getPlatformConfig<MonetizationModel>("platform_monetization_model");
  if (value === "commission_only" || value === "hybrid") return value;
  return "fixed_only";
}

function isEffectiveAt(
  row: { effectiveFrom: Date | null; effectiveUntil: Date | null },
  at: Date
): boolean {
  if (row.effectiveFrom && row.effectiveFrom > at) return false;
  if (row.effectiveUntil && row.effectiveUntil < at) return false;
  return true;
}

async function getActiveCategoryFee(
  categoryId: string | null,
  feeType: "listing_fee" | "commission",
  at: Date = new Date()
) {
  const rows = await db
    .select()
    .from(categoryFees)
    .where(
      and(
        eq(categoryFees.feeType, feeType),
        eq(categoryFees.isActive, true),
        or(isNull(categoryFees.categoryId), eq(categoryFees.categoryId, categoryId ?? ""))
      )
    );

  return (
    rows
      .filter((r) => isEffectiveAt(r, at))
      // Prefer category-specific over global fallback.
      .sort((a, b) => {
        if (a.categoryId && !b.categoryId) return -1;
        if (!a.categoryId && b.categoryId) return 1;
        return 0;
      })
      .shift() ?? null
  );
}

export async function getListingPricing(
  priceCents: number,
  condition: ItemCondition | null | undefined,
  categoryId?: string | null
): Promise<ListingPricing> {
  const [config, monetizationModel] = await Promise.all([
    getListingTiersConfig(),
    getPlatformMonetizationModel(),
  ]);

  const [listingFeeRule, commissionRule] = await Promise.all([
    (monetizationModel === "fixed_only" || monetizationModel === "hybrid")
      ? getActiveCategoryFee(categoryId ?? null, "listing_fee")
      : Promise.resolve(null),
    (monetizationModel === "commission_only" || monetizationModel === "hybrid")
      ? getActiveCategoryFee(categoryId ?? null, "commission")
      : Promise.resolve(null),
  ]);

  return calculateListingPricing(priceCents, condition, config, {
    monetizationModel,
    listingFeeRule: listingFeeRule
      ? {
          id: listingFeeRule.id,
          feeType: listingFeeRule.feeType,
          amount: listingFeeRule.amount,
          currency: "USD",
        }
      : undefined,
    commissionRule: commissionRule
      ? {
          id: commissionRule.id,
          feeType: commissionRule.feeType,
          percentage: commissionRule.percentage,
          currency: "USD",
        }
      : undefined,
    currency: "USD",
  });
}

export async function ensurePlatformMonetizationModelConfig() {
  const existing = await db
    .select({ key: platformConfigs.key })
    .from(platformConfigs)
    .where(eq(platformConfigs.key, "platform_monetization_model"))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(platformConfigs).values({
      key: "platform_monetization_model",
      value: "fixed_only",
      description: "Platform monetization model: fixed_only, commission_only, or hybrid",
    });
  }
}
