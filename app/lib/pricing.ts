import { ITEM_CONDITIONS, type ItemCondition } from "~/db/schema";

export interface PricingTier {
  label: string;
  minCents: number;
  maxCents: number | null;
  feeCents: number;
  expiryDays: number;
}

export interface ListingTiersConfig {
  mode: "price_condition";
  currency: string;
  tiers: PricingTier[];
  conditionMultipliers: Record<ItemCondition, number>;
}

export const DEFAULT_LISTING_TIERS: ListingTiersConfig = {
  mode: "price_condition",
  currency: "USD",
  tiers: [
    {
      label: "Budget",
      minCents: 0,
      maxCents: 4_999,
      feeCents: 50,
      expiryDays: 7,
    },
    {
      label: "Standard",
      minCents: 5_000,
      maxCents: 49_999,
      feeCents: 100,
      expiryDays: 14,
    },
    {
      label: "Premium",
      minCents: 50_000,
      maxCents: null,
      feeCents: 250,
      expiryDays: 30,
    },
  ],
  conditionMultipliers: {
    new_with_tags: 1.0,
    like_new: 1.0,
    good: 1.0,
    fair: 1.1,
    poor: 1.25,
  },
};

export function parseListingTiersConfig(raw: unknown): ListingTiersConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_LISTING_TIERS;
  const obj = raw as Partial<ListingTiersConfig>;
  const tiers = Array.isArray(obj.tiers)
    ? obj.tiers.filter(
        (t): t is PricingTier =>
          typeof t === "object" &&
          t !== null &&
          typeof t.label === "string" &&
          typeof t.minCents === "number" &&
          (t.maxCents === null || typeof t.maxCents === "number") &&
          typeof t.feeCents === "number" &&
          typeof t.expiryDays === "number"
      )
    : [];

  const multipliers = ITEM_CONDITIONS.reduce((acc, condition) => {
    const value =
      obj.conditionMultipliers &&
      typeof obj.conditionMultipliers === "object" &&
      condition in obj.conditionMultipliers
        ? Number(
            (obj.conditionMultipliers as Record<string, unknown>)[condition]
          )
        : NaN;
    acc[condition] = Number.isFinite(value) ? value : 1;
    return acc;
  }, {} as Record<ItemCondition, number>);

  return {
    mode: "price_condition",
    currency: "USD",
    tiers: tiers.length > 0 ? tiers : DEFAULT_LISTING_TIERS.tiers,
    conditionMultipliers: multipliers,
  };
}

export interface ListingPricing {
  tierLabel: string;
  baseFeeCents: number;
  feeCents: number;
  expiryDays: number;
  expiresAt: Date;
}

export function calculateListingPricing(
  priceCents: number,
  condition: ItemCondition,
  config: ListingTiersConfig,
  referenceDate: Date = new Date()
): ListingPricing {
  const tier =
    config.tiers.find((t) => {
      const aboveMin = priceCents >= t.minCents;
      const belowMax = t.maxCents === null || priceCents <= t.maxCents;
      return aboveMin && belowMax;
    }) ?? config.tiers[config.tiers.length - 1];

  const multiplier = config.conditionMultipliers[condition] ?? 1;
  const baseFeeCents = tier.feeCents;
  const feeCents = Math.round(baseFeeCents * multiplier);

  const expiresAt = new Date(referenceDate);
  expiresAt.setDate(expiresAt.getDate() + tier.expiryDays);

  return {
    tierLabel: tier.label,
    baseFeeCents,
    feeCents,
    expiryDays: tier.expiryDays,
    expiresAt,
  };
}
